import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

declare var Culqi: any;

export interface CulqiTokenResult {
  id: string;
  email: string;
}

export interface CulqiChargeResponse {
  outcome: { type: string };
  reference_code: string;
}

@Injectable({
  providedIn: 'root',
})
export class CulqiService {
  // Misma llave pública que ya usa el sistema actual (Buy.vue).
  private readonly publicKey = 'pk_live_95f8434020538bb8';

  constructor(private http: HttpClient) {}

  /** Abre el widget de Culqi y resuelve con el token generado. */
  open(amountInCents: number, title: string): Promise<CulqiTokenResult> {
    return new Promise((resolve, reject) => {
      Culqi.publicKey = this.publicKey;
      Culqi.settings({
        title,
        currency: 'PEN',
        amount: amountInCents,
      });

      let settled = false;
      let observer: MutationObserver | undefined;
      let captureTimer: ReturnType<typeof setTimeout> | undefined;

      const cleanup = () => {
        observer?.disconnect();
        if (captureTimer) clearTimeout(captureTimer);
        delete (window as any).culqi;
      };

      (window as any).culqi = () => {
        if (settled) return;
        settled = true;
        cleanup();
        if (Culqi.token) {
          resolve({ id: Culqi.token.id, email: Culqi.token.email });
        } else {
          reject(Culqi.error ?? new Error('El pago fue cancelado.'));
        }
      };

      const nodesBefore = new Set(Array.from(document.body.children));

      Culqi.open();

      // ⚠️ Culqi V4 no siempre llama a la función 'culqi()' cuando el
      // usuario cierra el widget SIN completar el pago (solo llega a
      // llamarla si hubo un intento de tokenizar). Sin esto, la promesa
      // se queda esperando para siempre y el botón "Procesando..." nunca
      // se destraba. Por eso vigilamos si el elemento que Culqi agregó al
      // <body> desaparece, y si nadie llamó a 'culqi()' antes, lo tratamos
      // como una cancelación manual.
      captureTimer = setTimeout(() => {
        const newNodes = Array.from(document.body.children).filter(
          (el) => !nodesBefore.has(el)
        );
        if (newNodes.length === 0 || settled) return;

        observer = new MutationObserver(() => {
          const stillOpen = newNodes.some((el) => document.body.contains(el));
          if (!stillOpen && !settled) {
            settled = true;
            cleanup();
            reject(new Error('El pago fue cancelado.'));
          }
        });
        observer.observe(document.body, { childList: true });
      }, 500);
    });
  }

  /**
   * ⚠️ Igual que en el sistema Vue actual: esto cobra directo desde el
   * navegador usando la llave SECRETA de Culqi, lo cual expone esa llave
   * en el código fuente del frontend. Se mantiene así por consistencia
   * con el flujo ya existente, pero lo ideal es mover este cargo al
   * backend cuanto antes (ver conversación anterior sobre este tema).
   */
  charge(amountInCents: number, email: string, sourceId: string): Observable<CulqiChargeResponse> {
    return this.http.post<CulqiChargeResponse>(
      'https://api.culqi.com/v2/charges',
      {
        amount: amountInCents,
        currency_code: 'PEN',
        email,
        source_id: sourceId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sk_live_ab08d50c685fcfdc',
        },
      }
    );
  }
}
