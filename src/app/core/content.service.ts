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
import { allCourses } from './data/courses.data';

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

  readonly qrPayments = [
    {
      appName: 'Yape',
      qrImage: 'assets/images/qr-yape.png',
      holderName: 'La Profe Chris',
    },
    {
      appName: 'Plin',
      qrImage: 'assets/images/qr-plin.png',
      holderName: 'La Profe Chris',
    },
  ];

  readonly bankAccounts = [
    { bank: 'BCP', account: '000-000000-0-00', cci: '000-000-000000000000-00' },
    { bank: 'BBVA', account: '0000-0000-0000000000', cci: '011-000-000000000000-00' },
  ];

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
  };

  readonly navLinks: NavLink[] = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'cursos', label: 'Cursos' },
    { id: 'sobre-mi', label: 'Sobre mí' },
    { id: 'metodologia', label: 'Metodología' },
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

  readonly courses: Course[] = allCourses;

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

  // Usado por la página de detalle de curso (/curso/:idioma/:slug) para
  // encontrar el curso exacto según la URL.
  findCourse(language: string, slug: string): Course | undefined {
    return this.courses.find((c) => c.language === language && c.slug === slug);
  }

  // Usado por el selector "Explorar niveles" dentro de la página de detalle,
  // para listar los demás cursos del mismo idioma y poder saltar entre ellos.
  coursesByLanguage(language: string): Course[] {
    return this.courses.filter((c) => c.language === language);
  }
}