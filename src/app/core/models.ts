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
