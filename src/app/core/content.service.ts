import { Injectable, isDevMode, signal } from '@angular/core';
import { catchError, forkJoin, map, of, Observable } from 'rxjs';
import {
  NavLink,
  ValueProp,
  Course,
  CourseLanguage,
  Testimonial,
  Faq,
  ChatStep,
  CrmCourseListItem,
} from './models';
import { CrmApiService } from './crm-api.service';
import { environment } from '../../environments/environment';

// Color de la insignia (badge) de cada tarjeta de curso, según el idioma.
// Es puramente visual, no depende del CRM.
const LANGUAGE_BADGE_COLOR: Record<CourseLanguage, string> = {
  frances: 'rgba(0,91,178,0.9)',
  ingles: 'rgba(75,65,225,0.9)',
  espanol: 'rgba(153,65,0,0.9)',
};

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

  readonly promoOffer = {
    badge: '🎁 Oferta por tiempo limitado',
    title: '¡Tu primera clase de francés es GRATIS!',
    subtitle:
      'Prueba nuestra metodología sin compromiso. Una Guia completa de la Profe Chris, sin costo y sin tarjeta.',
    ctaLabel: 'Quiero mi guia gratis',
  };

  constructor(private crmApi: CrmApiService) {
    if (isDevMode() && this.whatsappNumber === ContentService.PLACEHOLDER_WHATSAPP) {
      // eslint-disable-next-line no-console
      console.warn(
        '[La Profe Chris] El número de WhatsApp sigue siendo el de prueba (33749630070). ' +
        'Actualízalo en src/app/core/content.service.ts antes de publicar el sitio.'
      );
    }

    this.loadCourses();
    this.loadHeroImage();
  }

  // -------------------------------------------------------------------
  // Imágenes: 'hero' arranca con el asset local y se reemplaza por el
  // primer banner activo del CRM en cuanto llega la respuesta (si hay
  // banners configurados). Así nunca se ve un hueco en blanco mientras
  // carga.
  // -------------------------------------------------------------------
  readonly images = {
    logo: 'assets/images/logo.png',
    logoFooter: 'assets/images/logo.png',
    hero: 'assets/images/hero.png',
  };

  /** Imagen del hero. Signal para que el componente se actualice solo
   *  cuando llegue el banner del CRM (o se quede con el asset local si
   *  no hay banners activos). */
  readonly heroImage = signal<string>(this.images.hero);

  private loadHeroImage(): void {
    this.crmApi
      .getBanners()
      .pipe(
        catchError((error) => {
          console.error('[La Profe Chris] No se pudieron cargar los banners del CRM:', error);
          return of([]);
        })
      )
      .subscribe((banners) => {
        if (banners.length > 0) {
          this.heroImage.set(banners[0].image);
        }
        // Si no hay banners activos, se queda con this.images.hero (local).
      });
  }

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

  // -------------------------------------------------------------------
  // Cursos: ya NO viven hardcodeados acá. Se traen del CRM al arrancar
  // la app (loadCourses) y se exponen como signal para que las tarjetas
  // se actualicen solas en cuanto llega la respuesta.
  // -------------------------------------------------------------------
  readonly courses = signal<Course[]>([]);
  readonly coursesLoading = signal<boolean>(true);
  readonly coursesError = signal<boolean>(false);

  private loadCourses(): void {
    this.coursesLoading.set(true);
    this.coursesError.set(false);

    this.crmApi
      .getCourses()
      .pipe(
        catchError((error) => {
          console.error('[La Profe Chris] No se pudieron cargar los cursos del CRM:', error);
          this.coursesError.set(true);
          return of([] as CrmCourseListItem[]);
        })
      )
      .subscribe((items) => {
        this.courses.set(items.map((item) => this.mapListItemToCourse(item)));
        this.coursesLoading.set(false);
      });
  }

  private mapCategoryToLanguage(categoria: string | undefined): CourseLanguage {
    const normalized = (categoria || '').trim().toLowerCase();
    if (normalized.includes('franc')) return 'frances';
    if (normalized.includes('ingl')) return 'ingles';
    if (normalized.includes('espa')) return 'espanol';

    // Si la categoría del CRM no calza con ninguno de los 3 idiomas
    // (por ejemplo, si course_categories todavía no tiene "Francés",
    // "Inglés" y "Español" creadas), cae en 'frances' por defecto y
    // avisa por consola para que se revise en el CRM.
    console.warn(
      `[La Profe Chris] Categoría "${categoria}" no se reconoce como idioma. ` +
      `Revisa que exista una categoría en course_categories llamada ` +
      `"Francés", "Inglés" o "Español". Se está usando "frances" por defecto.`
    );
    return 'frances';
  }

  /** Arma la URL completa de una imagen guardada en S3. */
  resolveImageUrl(path: string | undefined): string {
    if (!path) return this.images.hero;
    if (path.startsWith('http')) return path;
    const separator = path.startsWith('/') ? '' : '/';
    return `${environment.storageBaseUrl}${separator}${path}`;
  }

  private mapListItemToCourse(item: CrmCourseListItem): Course {
    const language = this.mapCategoryToLanguage(item.categoria);
    return {
      language,
      slug: item.slug,
      // 'level' y 'weeks' no existen todavía como columnas en la tabla
      // 'productos' del CRM. Mientras tanto usamos el tipo de producto
      // (Curso/Diplomado) como aproximación. Si quieres mostrar el nivel
      // real (Principiante/Intermedio/Avanzado) y la duración en semanas,
      // agrega columnas 'nivel' y 'duracion' en 'productos' y mapéalas
      // aquí igual que 'tipo'.
      level: item.tipo ?? '',
      badgeColor: LANGUAGE_BADGE_COLOR[language],
      title: item.nombre,
      price: `S/. ${Number(item.precio).toFixed(2)}`,
      // El teaser corto ('text') no viene en el listado (solo en el
      // detalle, como 'descripcion'), así que se completa al entrar al
      // detalle del curso. Aquí queda vacío para no pegarle un fetch
      // extra a cada tarjeta.
      text: '',
      weeks: '',
      img: this.resolveImageUrl(item.portada_url),
    };
  }

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

  // Ya no la usa la página de detalle (ver loadCourseBySlug), pero se
  // deja disponible por si se necesita buscar en la lista ya cargada.
  findCourse(language: string, slug: string): Course | undefined {
    return this.courses().find((c) => c.language === language && c.slug === slug);
  }

  // Usado por el selector "Explorar niveles" dentro de la página de
  // detalle, para listar los demás cursos del mismo idioma.
  coursesByLanguage(language: string): Course[] {
    return this.courses().filter((c) => c.language === language);
  }

  /**
   * Carga el curso COMPLETO directo por su slug, usando
   * /public/course/details/{slug} como fuente principal (ese endpoint ya
   * trae 'categoria' y 'tipo' bien resueltos desde el backend, a
   * diferencia de /public/course/list que todavía no los incluye).
   *
   * No depende de que el listado general (content.courses()) ya haya
   * cargado, así que funciona igual de bien con una recarga directa de
   * la página (F5) que navegando desde el listado.
   *
   * Si el curso no existe, el observable falla (error real -> "no
   * encontrado"). El temario y el video sí se degradan con gracia si
   * fallan, porque es normal que algún curso aún no los tenga cargados.
   */
  loadCourseBySlug(slug: string): Observable<Course> {
    return forkJoin({
      details: this.crmApi.getCourseDetails(slug),
      temary: this.crmApi.getCourseTemary(slug).pipe(
        catchError((error) => {
          console.error('[La Profe Chris] Error al cargar el temario del curso:', error);
          return of(null);
        })
      ),
      video: this.crmApi.getCoursePreviewVideo(slug).pipe(
        catchError(() => of(undefined)) // Es normal que falte: no todos los cursos tienen preview aún.
      ),
    }).pipe(
      map(({ details, temary, video }): Course => {
        const language = this.mapCategoryToLanguage(details.categoria);
        return {
          language,
          slug: details.slug,
          level: details.tipo ?? '',
          badgeColor: LANGUAGE_BADGE_COLOR[language],
          title: details.nombre,
          price: `S/. ${Number(details.precio).toFixed(2)}`,
          text: details.descripcion || '',
          weeks: '',
          img: this.resolveImageUrl(details.portada_url),
          certificateText: `Al completar el curso ${details.nombre}`,
          video,
          includes: [
            'Acceso de por vida al contenido',
            'Materiales descargables y ejercicios',
            'Comunidad privada de estudiantes',
            'Sesiones de resolución de dudas Q&A',
          ],
          modules: (temary?.modules ?? []).map((m) => ({
            title: m.name,
            lessons: (m.lessons ?? []).map((lesson) => lesson.name),
          })),
        };
      })
    );
  }
}
