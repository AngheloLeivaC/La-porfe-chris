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
  CalendarEventApi,
  ExamListResponse,
  ExamDataResponse,
  ExamAnswerResult,
  CourseContent,
  CourseProductInfo,
  ClassResource,
  ClassLinksResponse,
  ClassTimeResponse,
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

  /**
   * Cambio de contraseña del alumno logueado (POST /user/change-pass).
   * El backend responde con TEXTO PLANO (no JSON) y siempre con HTTP 200:
   * "Cambio de contraseña exitoso" si todo salió bien, o
   * "Ingrese su contraseña actual correctamente" si la actual no coincide.
   * Por eso se pide responseType 'text'.
   */
  changePassword(payload: {
    actual_pass: string;
    new_pass: string;
    repeat_pass: string;
  }): Observable<string> {
    return this.http.post(`${this.baseUrl}/user/change-pass`, payload, {
      responseType: 'text',
    });
  }

  /**
   * Paso 1 de "olvidé mi contraseña": el backend genera un código de 5 dígitos
   * y lo envía por correo. Responde texto plano (HTTP 200):
   * "!Se ha enviado el correo de recuperación!" o "!Correo no registrado!".
   */
  sendRecoveryEmail(email: string): Observable<string> {
    return this.http.post(`${this.baseUrl}/public/sendRecoveryEmail`, { email }, {
      responseType: 'text',
    });
  }

  /**
   * Paso 2: valida el código y guarda la nueva contraseña. Responde texto plano:
   * "Contraseña reestablecida", "Código de recuperación incorrecto, intentos
   * restantes: N", "Ha alcanzado el máximo de intentos..." o "El correo no está
   * registrado".
   */
  recoverPassword(payload: {
    email: string;
    code: string;
    password: string;
  }): Observable<string> {
    return this.http.post(`${this.baseUrl}/public/recoveryPassword`, payload, {
      responseType: 'text',
    });
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

  /** Trae los eventos del calendario personal del alumno. from/to son opcionales, en formato YYYY-MM-DD. */
  getCalendarEvents(userId: number, from?: string, to?: string): Observable<CalendarEventApi[]> {
    let url = `${this.baseUrl}/user/${userId}/calendar`;
    const params: string[] = [];
    if (from) params.push(`from=${from}`);
    if (to) params.push(`to=${to}`);
    if (params.length) url += `?${params.join('&')}`;
    return this.http.get<CalendarEventApi[]>(url);
  }

  createCalendarEvent(payload: {
    user_id: number;
    date: string;
    type: 'recordatorio' | 'actividad';
    title: string;
    time?: string;
    note?: string;
  }): Observable<CalendarEventApi> {
    return this.http.post<CalendarEventApi>(`${this.baseUrl}/calendar`, payload);
  }

  updateCalendarEvent(
    id: number,
    userId: number,
    payload: Partial<{
      date: string;
      type: 'recordatorio' | 'actividad';
      title: string;
      time: string | null;
      note: string | null;
    }>
  ): Observable<CalendarEventApi> {
    return this.http.put<CalendarEventApi>(`${this.baseUrl}/calendar/${id}`, {
      user_id: userId,
      ...payload,
    });
  }

  deleteCalendarEvent(id: number, userId: number): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/calendar/${id}`, {
      body: { user_id: userId },
    });
  }

  // ---------- Pantalla de clase (reproductor) ----------

  /** Temario del curso comprado, con las clases que el alumno ya empezó (`checkpoint`) y sus fechas de acceso. */
  getCourseContent(slug: string): Observable<CourseContent> {
    return this.http.get<CourseContent>(`${this.baseUrl}/course/temary/get-all-class/${encodeURIComponent(slug)}`);
  }

  /** Datos del producto (id, nombre) a partir de su slug; el backend lo resuelve con el literal "empty slug". */
  getCourseProduct(slug: string): Observable<CourseProductInfo | null> {
    return this.http.get<CourseProductInfo | null>(
      `${this.baseUrl}/public/course/info/${encodeURIComponent(slug)}/empty%20slug`
    );
  }

  /** URL (S3) del video de una clase. El backend responde texto plano. */
  getClassVideoUrl(classSlug: string, productId: number): Observable<string> {
    return this.http.get(`${this.baseUrl}/video/stream-video`, {
      params: { slug: classSlug, product_id: productId },
      responseType: 'text',
    });
  }

  /** Segundo donde el alumno dejó la clase. Da error si nunca la vio (el backend no lo controla). */
  getClassTime(productId: number, classId: number): Observable<ClassTimeResponse | null> {
    return this.http.get<ClassTimeResponse | null>(`${this.baseUrl}/purchased/get-time`, {
      params: { courseId: productId, classId },
    });
  }

  /** Guarda el segundo actual de la clase (el backend ignora el 0). */
  saveClassTime(productId: number, classId: number, seconds: number): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/purchased/save-time`, null, {
      params: { course_id: productId, class_id: classId, display_time: seconds },
    });
  }

  /**
   * Igual que saveClassTime pero pensado para el cierre de pestaña: `keepalive`
   * deja que la petición termine aunque la página se descargue. Es "best effort".
   */
  saveClassTimeOnExit(productId: number, classId: number, seconds: number, token: string): void {
    try {
      const qs = new URLSearchParams({
        course_id: String(productId),
        class_id: String(classId),
        display_time: String(seconds),
      });
      fetch(`${this.baseUrl}/purchased/save-time?${qs.toString()}`, {
        method: 'PATCH',
        keepalive: true,
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => undefined);
    } catch {
      // sin soporte de fetch/keepalive: no pasa nada, ya se guardó en pausas y cada 20 s
    }
  }

  getClassResources(classSlug: string): Observable<ClassResource[]> {
    return this.http.get<ClassResource[]>(
      `${this.baseUrl}/course/class/resources/${encodeURIComponent(classSlug)}/list`
    );
  }

  /** Descarga el archivo de un recurso (requiere el token, por eso va por HttpClient y no por un <a href>). */
  downloadClassResource(resourceId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/course/class/resources/${resourceId}/download`, {
      responseType: 'blob',
    });
  }

  getClassLinks(productSlug: string, classSlug: string): Observable<ClassLinksResponse | null> {
    return this.http.get<ClassLinksResponse | null>(
      `${this.baseUrl}/course/class/get-links/${encodeURIComponent(productSlug)}/${encodeURIComponent(classSlug)}`
    );
  }

  /** Lista de exámenes (curso, módulos y clases) de un curso comprado, con estado de avance del alumno. */
  getExamList(courseSlug: string): Observable<ExamListResponse> {
    return this.http.get<ExamListResponse>(`${this.baseUrl}/course/exam/list`, {
      params: { slug: courseSlug },
    });
  }

  /** Trae el examen y sus preguntas para poder rendirlo. */
  getExam(examId: number): Observable<{ status: number; data: ExamDataResponse }> {
    return this.http.post<{ status: number; data: ExamDataResponse }>(`${this.baseUrl}/course/exam`, {
      exam_id: examId,
    });
  }

  /** El curso al que pertenece un examen (lo necesita el envío de respuestas). */
  getCourseIdForExam(examId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/course/exam/course-id`, {
      params: { exam_id: examId },
    });
  }

  /** Envía las respuestas del alumno para que el backend las califique. */
  submitExamAnswers(payload: {
    id_exam: number;
    answers: { option: unknown }[];
    course_id: number;
    seconds_used: number;
  }): Observable<ExamAnswerResult | 'Waiting'> {
    return this.http.post<ExamAnswerResult | 'Waiting'>(`${this.baseUrl}/course/exam/answers`, payload);
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
