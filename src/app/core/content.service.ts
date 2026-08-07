import { Injectable, isDevMode } from '@angular/core';
import {
  NavLink,
  ValueProp,
  Course,
  CourseLanguage,
  Testimonial,
  Faq,
  ChatStep,
} from './models';

@Injectable({
  providedIn: 'root',
})
export class ContentService {
 
  private static readonly PLACEHOLDER_WHATSAPP = '33749630070';
  readonly whatsappNumber = ContentService.PLACEHOLDER_WHATSAPP;
readonly contactEmail = 'laprofechris@gmail.com';
readonly contactPhone = '+33 7 49630070';
readonly contactLocation = 'Vitry-Sur-Seine, 94400, France';
readonly contactLocationExtra = 'Online';
  constructor() {
    if (isDevMode() && this.whatsappNumber === ContentService.PLACEHOLDER_WHATSAPP) {
      // eslint-disable-next-line no-console
      console.warn(
        '[La Profe Chris] El número de WhatsApp sigue siendo el de prueba (33749630070). ' +
        'Actualízalo en src/app/core/content.service.ts antes de publicar el sitio.'
      );
    }
  }
  readonly images = {
    logo: 'assets/images/logo.png',
    logoFooter: 'assets/images/logo.png',
    hero: 'assets/images/hero.png',
    //frances
    courseA1: 'assets/images/frances-a1.png',
    courseA2: 'assets/images/frances-a2.png',
    courseB1: 'assets/images/frances-b1.png',
    //ingles
    courseEnA1: 'assets/images/ingles-a1.png',
    courseEnA2: 'assets/images/ingles-a2.png',
    courseEnB1: 'assets/images/ingles-b1.png',
    //espanol
    courseEsA1: 'assets/images/espanol-a1.png',
    courseEsA2: 'assets/images/espanol-a2.png',
    courseEsB1: 'assets/images/espanol-b1.png',
  };

  readonly navLinks: NavLink[] = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'cursos', label: 'Cursos' },
    { id: 'metodologia', label: 'Metodología' },
    { id: 'sobre-mi', label: 'Sobre mí' },
    { id: 'inscripcion', label: 'Contacto' },
  ];

  readonly valueProps: ValueProp[] = [
    {
      icon: 'book',
      colorVar: 'var(--color-primary)',
      bg: 'rgba(0,91,178,0.1)',
      title: 'Metodología Propia',
      text: 'Diseñada tras años de experiencia, centrada en la comunicación real y no solo en gramática aburrida.',
    },
    {
      icon: 'bolt',
      colorVar: 'var(--color-secondary)',
      bg: 'rgba(75,65,225,0.1)',
      title: 'Resultados Rápidos',
      text: 'Nuestro enfoque intensivo te permite ver avances reales desde la primera semana de clases.',
    },
    {
      icon: 'chat',
      colorVar: 'var(--color-tertiary)',
      bg: 'rgba(153,65,0,0.1)',
      title: 'Clases Dinámicas',
      text: 'Nada de monólogos. Participación activa, juegos y cultura francesa integrada en cada sesión.',
    },
  ];

  readonly languageTabs: { id: CourseLanguage; label: string; flag: string }[] = [
    { id: 'frances', label: 'Francés', flag: '🇫🇷' },
    { id: 'ingles', label: 'Inglés', flag: '🇬🇧' },
    { id: 'espanol', label: 'Español', flag: '🇪🇸' },
  ];

  readonly courses: Course[] = [
    {
      language: 'frances',
      level: 'Principiante',
      badgeColor: 'rgba(0,91,178,0.9)',
      title: 'Toi, moi la France A1',
      price: '€149',
      text: 'Ideal para quienes empiezan desde cero. Aprende a presentarte, pedir en un café y sobrevivir en París.',
      weeks: '12 Semanas',
      img: this.images.courseA1,
    },
    {
      language: 'frances',
      level: 'Elemental',
      badgeColor: 'rgba(75,65,225,0.9)',
      title: 'Toi, moi la France A2',
      price: '€169',
      text: 'Refuerza tus bases y comienza a comunicarte de forma independiente en situaciones cotidianas.',
      weeks: '14 Semanas',
      img: this.images.courseA2,
    },
    {
      language: 'frances',
      level: 'Intermedio',
      badgeColor: 'rgba(153,65,0,0.9)',
      title: 'Toi, moi la France B1',
      price: '€199',
      text: 'Alcanza la fluidez. Habla sobre tus sueños, opina sobre actualidad y domina los tiempos verbales complejos.',
      weeks: '16 Semanas',
      img: this.images.courseB1,
    },
    //Ingles
    {
      language: 'ingles',
      level: 'Principiante',
      badgeColor: 'rgba(0,91,178,0.9)',
      title: 'Nombre de tu curso A1',
      price: '€149',
      text: 'Descripción del curso, igual que las de francés.',
      weeks: '12 Semanas',
      img: this.images.courseEnA1,
    },
    {
      language: 'ingles',
      level: 'Elemental',
      badgeColor: 'rgba(75,65,225,0.9)',
      title: 'Nombre de tu curso A2',
      price: '€169',
      text: 'Descripción del curso...',
      weeks: '14 Semanas',
      img: this.images.courseEnA2,
    },
    {
      language: 'ingles',
      level: 'Intermedio',
      badgeColor: 'rgba(153,65,0,0.9)',
      title: 'Nombre de tu curso B1',
      price: '€199',
      text: 'Descripción del curso...',
      weeks: '16 Semanas',
      img: this.images.courseEnB1,
    },
    // Español
    {
      language: 'espanol',
      level: 'Principiante',
      badgeColor: 'rgba(0,91,178,0.9)',
      title: 'Nombre de tu curso A1',
      price: '€149',
      text: 'Descripción del curso...',
      weeks: '12 Semanas',
      img: this.images.courseEsA1,
    },
    {
      language: 'espanol',
      level: 'Elemental',
      badgeColor: 'rgba(75,65,225,0.9)',
      title: 'Nombre de tu curso A2',
      price: '€169',
      text: 'Descripción del curso...',
      weeks: '14 Semanas',
      img: this.images.courseEsA2,
    },
    {
      language: 'espanol',
      level: 'Intermedio',
      badgeColor: 'rgba(153,65,0,0.9)',
      title: 'Nombre de tu curso B1',
      price: '€199',
      text: 'Descripción del curso...',
      weeks: '16 Semanas',
      img: this.images.courseEsB1,
    },
  ];

  readonly testimonials: Testimonial[] = [
  {
    text: 'Increíble. Pasé de no entender nada a poder tener conversaciones fluidas en mi viaje a Lyon. Chris hace que todo parezca fácil.',
    name: 'Marco Rodríguez',
    role: 'Arquitecto',
    photo: 'assets/images/MR.png',
  },
  {
    text: 'Las clases son súper divertidas, nada que ver con el instituto tradicional. Aprendes sin darte cuenta y te motiva a seguir.',
    name: 'Lucía Ferreyra',
    role: 'Estudiante de Diseño',
    photo: 'assets/images/LF.png',
  },
  {
    text: 'Gracias a la metodología de Chris aprobé el examen B1 en tiempo récord para mi visa de trabajo. ¡Altamente recomendada!',
    name: 'Andrés Ibáñez',
    role: 'Ingeniero de Software',
    photo: 'assets/images/AI.png',
  },
];

  readonly faqs: Faq[] = [
    {
      q: '¿Necesito conocimientos previos?',
      a: 'No para el curso A1. Está diseñado específicamente para principiantes totales. Si ya tienes algo de base, podemos hacer una prueba de nivel gratuita para ubicarte en A2 o B1.',
    },
    {
      q: '¿Las clases son en vivo o grabadas?',
      a: 'Combinamos lo mejor de ambos mundos. Tienes material grabado de alta calidad para repasar y sesiones semanales en vivo para practicar conversación y resolver dudas.',
    },
    {
      q: '¿Hay algún certificado al finalizar?',
      a: "Sí, al completar cada curso recibes un certificado de aprovechamiento emitido por 'La Profe Chris' que valida las horas cursadas y el nivel alcanzado.",
    },
  ];

  /** Árbol de conversación simple para el chatbot */
  readonly chatFlow: Record<string, ChatStep> = {
    inicio: {
      id: 'inicio',
      bot: '¡Bonjour! 👋 Soy el asistente virtual de La Profe Chris. ¿En qué puedo ayudarte hoy?',
      options: [
        { label: '📚 Quiero ver los cursos', next: 'cursos' },
        { label: '💰 Precios y horarios', next: 'precios' },
        { label: '🎓 Quiero inscribirme', next: 'inscripcion' },
        { label: '💬 Hablar con un asesor', action: 'whatsapp' },
      ],
    },
    cursos: {
      id: 'cursos',
      bot: 'Tenemos 3 niveles: A1 (principiante), A2 (elemental) y B1 (intermedio). Te muestro la sección de cursos para que compares 👇',
      options: [
        { label: '👀 Ver cursos en la página', action: 'scroll-cursos' },
        { label: '🎓 Quiero inscribirme', next: 'inscripcion' },
        { label: '⬅️ Volver al inicio', next: 'inicio' },
      ],
    },
    precios: {
      id: 'precios',
      bot: 'Los cursos van desde €149 (A1) hasta €199 (B1), con clases en vivo + material grabado. ¿Quieres que te pasemos el detalle completo por WhatsApp?',
      options: [
        { label: '✅ Sí, por WhatsApp', action: 'whatsapp' },
        { label: '👀 Ver cursos en la página', action: 'scroll-cursos' },
        { label: '⬅️ Volver al inicio', next: 'inicio' },
      ],
    },
    inscripcion: {
      id: 'inscripcion',
      bot: '¡Genial! 🎉 Para reservar tu cupo, lo más rápido es hablar directo con nosotros por WhatsApp y te guiamos en el proceso.',
      options: [
        { label: '📲 Inscribirme por WhatsApp', action: 'whatsapp' },
        { label: '👀 Ver cursos primero', action: 'scroll-cursos' },
        { label: '⬅️ Volver al inicio', next: 'inicio' },
      ],
    },
  };
}
