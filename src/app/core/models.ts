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

export interface Course {
  language: CourseLanguage;
  level: string;
  badgeColor: string;
  title: string;
  price: string;
  text: string;
  weeks: string;
  img: string;
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
