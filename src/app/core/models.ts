export interface NavLink {
  id: string;
  label: string;
}

export interface ValueProp {
  icon: string;
  colorVar: string;
  bg: string;
  title: string;
  text: string;
}

export type CourseLanguage = 'frances' | 'ingles' | 'espanol';

export interface CourseModule {
  title: string;
  description?: string;
  lessons?: string[];
}

export interface Course {
  language: CourseLanguage;
  slug: string;
  level: string;
  badgeColor: string;
  title: string;
  price: string;
  text: string;
  weeks: string;
  img: string;
   // Campos opcionales solo para la página de detalle del curso:
  video?: string; // ruta a un .mp4 real en assets/videos/
  certificateText?: string;
  includes?: string[]; // checklist tipo "Acceso de por vida al contenido"
  modules?: CourseModule[]; // temario expandible (Módulo 1, 2, 3...)
  id?: number;
  tipoProductoId?: number;
  precioNumerico?: number;
}

export interface Testimonial {
  text: string;
  name: string;
  role: string;
  photo?: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface ChatOption {
  label: string;
  next?: string;
  action?: 'whatsapp' | 'scroll-cursos' | 'scroll-inscripcion';
}

export interface ChatStep {
  id: string;
  bot: string;
  options: ChatOption[];
}

// ---------------------------------------------------------------------
// Formas exactas de lo que devuelve el CRM (crm.laprofechris.com/api/v1).
// Se mapean a los modelos de arriba (Course, etc.) en content.service.ts,
// nunca se usan directo en los componentes.
// ---------------------------------------------------------------------

export interface CrmCourseListItem {
  id: number;
  nombre: string;
  precio: number;
  slug: string;
  tipo_producto_id: number;
  portada_url: string;
  course_categories_id: number;
  categoria: string;
  tipo?: string; // 'Curso' | 'Diplomado' (viene del join con tipo_productos)
  nivel?: string; // 'Principiante' | 'Elemental' | 'Intermedio' | 'Avanzado'
  duracion_semanas?: number;
  resumen_corto?: string;
}

export interface CrmCourseDetails extends CrmCourseListItem {
  descripcion: string;
  objetivo: string;
  will_learn: string;
  prev_knowledge: string;
  course_for: string;
}

export interface CrmLesson {
  id: number;
  name: string;
}

export interface CrmModule {
  name: string;
  lessons: CrmLesson[];
}

export interface CrmCourseTemary {
  title: string;
  modules: CrmModule[];
}

export interface CrmBanner {
  image: string;
  title: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
  role: string;
}

/** Envoltorio real que devuelve el backend: { status, message, data: {...} } */
export interface LoginEnvelope {
  status: number;
  message: string;
  data: LoginResponse;
}

/** Un curso ya comprado por el alumno logueado (aula virtual). */
export interface PurchasedCourse {
  id: number;
  nombre: string;
  portada_url: string;
  is_blocked: number;
  fechaVencimiento?: string;
  slug_product?: string;
  tipo_producto_id?: number;
  fecha_inicio?: string; // YYYY-MM-DD
  fecha_fin?: string; // YYYY-MM-DD
}

/** Una fila del panel "Actividades" (tarea o examen con fecha). */
export interface ActivityItem {
  id: number;
  type: 'tarea' | 'examen';
  title: string;
  description: string | null;
  due_date: string;
  course_name: string | null;
  completed: boolean;
}
export interface CalendarEventApi {
  id: number;
  user_id: number;
  date: string; // YYYY-MM-DD
  type: 'recordatorio' | 'actividad';
  title: string;
  time: string | null; // HH:mm
  note: string | null;
}

/** Fila de examen a nivel de clase o de módulo, tal como la devuelve /course/exam/list. */
export interface ExamListEntry {
  name: string;
  slug: string;
  exist: boolean;
  approved: boolean;
  exam_id?: number;
  class_id?: number;
  module_id?: number;
}

/** El examen general del curso (mismo shape, pero con nombre de campos del producto). */
export interface ExamListCourse {
  product_id: number;
  nombre: string;
  slug: string;
  exist: boolean;
  approved: boolean;
  exam_id?: number;
}

export interface ExamListResponse {
  exams_class: ExamListEntry[];
  exams_module: ExamListEntry[];
  exam_course: ExamListCourse;
  counter_class: number;
  counter_module: number;
  counter_course: number;
  exam_progress: number | 'empty';
}

/** El examen tal como lo entrega POST /course/exam { exam_id }. */
export interface ExamDetails {
  id: number;
  title: string;
  time: number | null; // segundos. null o 59999940 = "sin tiempo".
  min_passing_score: number;
  max_score: number;
}

export interface ExamQuestionApi {
  id: number;
  title: string;
  points: number;
  options: string[];
  correct: string; // índice (o índices separados por coma) de la(s) opción(es) correcta(s)
  question_type_id: 1 | 2 | 3 | 4; // 1 simple, 2 múltiple, 3 binaria, 4 abierta
}

export interface ExamDataResponse {
  exam: ExamDetails;
  questions: ExamQuestionApi[];
}

/** Lo que responde POST /course/exam/answers al calificar. */
export interface ExamAnswerResult {
  rate?: number;
  message?: 'Aprobado' | 'Desaprobado' | string;
  points?: number;
  points_gained?: number;
  rank?: number;
}

export interface DocumentTypeItem {
  id: number;
  name: string;
}

export interface RegisterAcademyUserResponse {
  status: 'success' | 'error';
  message: string;
  data: { id: number; name: string; email: string } | null;
}