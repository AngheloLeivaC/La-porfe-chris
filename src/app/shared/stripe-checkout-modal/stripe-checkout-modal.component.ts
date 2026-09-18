import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { loadStripe, Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';
import { CrmApiService } from '../../core/crm-api.service';
import { environment } from '../../../environments/environment';
import { PendingRegistration } from '../register-modal/register-modal.component';

export interface StripeCartItem {
  product_id: number;
  product_type: number;
}

@Component({
  selector: 'app-stripe-checkout-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stripe-checkout-modal.component.html',
  styleUrl: './stripe-checkout-modal.component.css',
})
export class StripeCheckoutModalComponent implements OnInit {
  // Uno de los dos, según de dónde venga la compra:
  // - userId: alumno que ya tiene cuenta (ej. comprando otro curso desde
  //   el aula virtual).
  // - pendingRegistration: usuario nuevo desde la landing, que llenó el
  //   paso 1 pero AÚN NO tiene cuenta creada. La cuenta recién se crea
  //   en el backend cuando el pago se confirma (ver webhook de Stripe).
  @Input() userId: number | null = null;
  @Input() pendingRegistration: PendingRegistration | null = null;
  @Input({ required: true }) items: StripeCartItem[] = [];
  @Input() totalLabel = '';
  @Input() itemLabel = '';

  @Output() closed = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  @ViewChild('paymentElementRef') paymentElementRef!: ElementRef<HTMLDivElement>;

  readonly loadingForm = signal(true);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly paidSuccessfully = signal(false);

  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private paymentElement: StripePaymentElement | null = null;

  constructor(private crmApi: CrmApiService) {}

  ngOnInit(): void {
    this.crmApi
      .createStripePaymentIntent({
        userId: this.userId ?? undefined,
        registration: this.pendingRegistration ?? undefined,
        items: this.items,
      })
      .subscribe({
        next: async ({ clientSecret }) => {
          this.stripe = await loadStripe(environment.stripePublishableKey);
          if (!this.stripe) {
            this.errorMessage.set('No se pudo cargar el formulario de pago.');
            this.loadingForm.set(false);
            return;
          }

          this.elements = this.stripe.elements({ clientSecret });
          this.paymentElement = this.elements.create('payment', {
            // "Link" agrega su propia sección de correo/celular/nombre para
            // guardar la tarjeta — duplica lo que ya pedimos en el registro
            // y es lo que más alarga el formulario. La desactivamos.
            wallets: { link: 'never' },
          });
          this.paymentElement.mount(this.paymentElementRef.nativeElement);
          this.loadingForm.set(false);
        },
        error: (err) => {
          // El backend puede rechazar aquí un email/DNI duplicado (cuando
          // viene de pendingRegistration) — mostramos ese mensaje real en
          // vez de uno genérico.
          this.errorMessage.set(
            err?.error?.message || 'No se pudo iniciar el pago. Intenta nuevamente.'
          );
          this.loadingForm.set(false);
        },
      });
  }

  async pagar(): Promise<void> {
    if (!this.stripe || !this.elements || this.submitting()) return;

    this.submitting.set(true);
    this.errorMessage.set(null);

    // 'redirect: if_required' mantiene todo dentro del modal para la
    // gran mayoría de tarjetas. Algunas tarjetas igual pueden requerir
    // una breve autenticación extra (3D Secure) por exigencia del banco
    // — eso lo maneja Stripe automáticamente si llega a hacer falta.
    const result = await this.stripe.confirmPayment({
      elements: this.elements,
      redirect: 'if_required',
    });

    if (result.error) {
      this.errorMessage.set(result.error.message ?? 'El pago fue rechazado. Intenta con otra tarjeta.');
      this.submitting.set(false);
      return;
    }

    if (result.paymentIntent?.status === 'succeeded') {
      this.paidSuccessfully.set(true);
      this.submitting.set(false);
      setTimeout(() => this.success.emit(), 1400);
    } else {
      this.errorMessage.set('El pago no se pudo confirmar. Intenta nuevamente.');
      this.submitting.set(false);
    }
  }

  close(): void {
    if (this.submitting()) return;
    this.closed.emit();
  }
}