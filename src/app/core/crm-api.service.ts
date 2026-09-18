import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CrmCourseListItem,
  CrmCourseDetails,
  CrmCourseTemary,
  CrmBanner,
  LoginEnvelope,
  PurchasedCourse,
  ActivityItem,
   DocumentTypeItem,
    RegisterAcademyUserResponse,

} from './models';

/**
 * Único punto de contacto HTTP con el CRM (crm.laprofechris.com).
 * Todos usan el prefijo /public, así que no requieren usuario logueado
 * (son los mismos endpoints que ya usa el marketplace de Vue, pero sin
 * autenticación).
 */
@Injectable({
  providedIn: 'root',
})
export class CrmApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /** Catálogo completo de cursos publicados (para las tarjetas y los tabs). */
  getCourses(): Observable<CrmCourseListItem[]> {
    return this.http.get<CrmCourseListItem[]>(`${this.baseUrl}/public/course/list`);
  }

  /** Detalle completo de un curso (descripción, objetivo, will_learn, etc). */
  getCourseDetails(slug: string): Observable<CrmCourseDetails> {
    return this.http.get<CrmCourseDetails>(
      `${this.baseUrl}/public/course/details/${slug}`
    );
  }

  /** Temario (módulos y lecciones) para la página de detalle del curso. */
  getCourseTemary(slug: string): Observable<CrmCourseTemary> {
    return this.http.get<CrmCourseTemary>(
      `${this.baseUrl}/public/course/temary/get-all-class/${slug}`
    );
  }

  /**
   * Video de preview del curso (la clase marcada como is_preview=1).
   * El backend devuelve la URL como texto plano, no como JSON.
   *
   * NOTA: si el curso todavía no tiene ninguna clase marcada como
   * "is_preview" en el CRM, este endpoint responde con error 500 (el
   * backend no valida que exista). Por eso content.service.ts atrapa el
   * error y sigue sin video en vez de romper la página.
   */
  getCoursePreviewVideo(slug: string): Observable<string> {
    return this.http.get(`${this.baseUrl}/public/video/get-video-intro/${slug}`, {
      responseType: 'text',
    });
  }

  /** Banners activos (se usan para la imagen del hero). */
  getBanners(): Observable<CrmBanner[]> {
    return this.http.get<CrmBanner[]>(`${this.baseUrl}/public/banners/list`);
  }

  login(email: string, password: string): Observable<LoginEnvelope> {
    return this.http.post<LoginEnvelope>(`${this.baseUrl}/public/auth/login`, {
      email,
      password,
    });
  }

 
  getPurchasedProducts(userId: number): Observable<PurchasedCourse[]> {
    return this.http.get<PurchasedCourse[]>(
      `${this.baseUrl}/user/${userId}/purchased-products`
    );
  }

  savePayment(payload: {
    user_id: number;
    product_id: number;
    amount: number; // en céntimos
    reference_code: string;
    product_type: number;
  }): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/payments/save-payment`, payload);
  }


  getActivities(userId: number): Observable<ActivityItem[]> {
    return this.http.get<ActivityItem[]>(`${this.baseUrl}/user/${userId}/activities`);
  }

  markTaskComplete(tareaId: number, userId: number): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/tareas/${tareaId}/complete`, {
      user_id: userId,
    });
  }

  markTaskIncomplete(tareaId: number, userId: number): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/tareas/${tareaId}/complete`, {
      body: { user_id: userId },
    });
  }

  /** Crea una sesión de pago de Stripe y devuelve la URL a la que redirigir. */
  createStripeCheckoutSession(
    userId: number,
    items: { product_id: number; product_type: number }[]
  ): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(
      `${this.baseUrl}/payments/stripe/create-checkout-session`,
      { user_id: userId, items }
    );
  }

  /**
   * Crea el PaymentIntent embebido. Enviar SOLO uno de los dos:
   * - userId: alumno que ya tiene cuenta.
   * - registration: datos del paso 1 para un usuario nuevo, todavía sin
   *   guardar — el backend lo crea recién cuando el pago se confirma.
   */
  createStripePaymentIntent(params: {
    userId?: number;
    registration?: {
      name: string;
      email: string;
      phone: string;
      password: string;
      doc_type_id: number | null;
      number_doc: string;
      country: string;
      birthday: string;
    };
    items: { product_id: number; product_type: number }[];
  }): Observable<{ clientSecret: string }> {
    return this.http.post<{ clientSecret: string }>(
      `${this.baseUrl}/payments/stripe/create-payment-intent`,
      {
        user_id: params.userId,
        registration: params.registration,
        items: params.items,
      }
    );
  }

  
listDocumentTypes(): Observable<DocumentTypeItem[]> {
  return this.http.get<DocumentTypeItem[]>(`${this.baseUrl}/public/listDocumentType`);
}

registerAcademyUser(payload: {
  name: string;
  email: string;
  phone: string;
  password: string;
  doc_type_id: number | null;
  number_doc: string;
  country: string;
  birthday: string;
}): Observable<RegisterAcademyUserResponse> {
  return this.http.post<RegisterAcademyUserResponse>(
    `${this.baseUrl}/public/registerAcademyUser`,
    payload
  );
}

}
