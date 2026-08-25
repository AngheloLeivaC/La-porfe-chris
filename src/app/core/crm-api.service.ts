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

  /** Login del aula virtual. Mismo endpoint que usa el sistema actual.
   *  El backend envuelve la respuesta real dentro de 'data'. */
  login(email: string, password: string): Observable<LoginEnvelope> {
    return this.http.post<LoginEnvelope>(`${this.baseUrl}/public/auth/login`, {
      email,
      password,
    });
  }

  /** Cursos ya comprados por el alumno logueado (requiere Bearer token). */
  getPurchasedProducts(userId: number): Observable<PurchasedCourse[]> {
    return this.http.get<PurchasedCourse[]>(
      `${this.baseUrl}/user/${userId}/purchased-products`
    );
  }

  /** Registra la compra de un curso ya pagado (mismo endpoint que Buy.vue). */
  savePayment(payload: {
    user_id: number;
    product_id: number;
    amount: number; // en céntimos
    reference_code: string;
    product_type: number;
  }): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/payments/save-payment`, payload);
  }
}
