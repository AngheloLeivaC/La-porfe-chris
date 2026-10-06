import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, catchError, forkJoin, map, of } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { CrmApiService } from '../../core/crm-api.service';
import {
  ClassResource,
  CourseContent,
  CourseLesson,
  CourseModuleContent,
  ExamListResponse,
} from '../../core/models';

type PlayerStatus = 'loading' | 'ready' | 'error' | 'expired';
type VideoState = 'loading' | 'ready' | 'none';
type PlayerTab = 'descripcion' | 'recursos' | 'enlaces' | 'examenes';

interface Loadable<T> {
  status: 'idle' | 'loading' | 'ready' | 'error';
  data: T | null;
}
const idle = <T>(): Loadable<T> => ({ status: 'idle', data: null });

export interface PlayerExamRow {
  level: 'curso' | 'módulo' | 'clase';
  name: string;
  approved: boolean;
  examId: number;
  /** true si es el examen de la clase que se está viendo. */
  isCurrent: boolean;
}

/** Cada cuántos milisegundos de reproducción se guarda el avance. */
const SAVE_EVERY_MS = 20_000;

/** Tiempo máximo esperando los metadatos del video antes de mostrar un aviso. */
const SLOW_LOAD_MS = 12_000;

@Component({
  selector: 'app-course-player',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './course-player.component.html',
  styleUrl: './course-player.component.css',
})
export class CoursePlayerComponent implements OnInit, OnDestroy {
  readonly rates = [0.75, 1, 1.25, 1.5, 2];
  readonly tabs: { id: PlayerTab; label: string }[] = [
    { id: 'descripcion', label: 'Descripción' },
    { id: 'recursos', label: 'Recursos' },
    { id: 'enlaces', label: 'Enlaces' },
    { id: 'examenes', label: 'Exámenes' },
  ];

  // ---------- Estado ----------
  readonly status = signal<PlayerStatus>('loading');
  readonly errorText = signal('');
  readonly content = signal<CourseContent | null>(null);
  readonly productId = signal<number | null>(null);
  readonly currentId = signal<number | null>(null);

  readonly videoUrl = signal<string | null>(null);
  readonly videoState = signal<VideoState>('loading');
  readonly resumeNotice = signal<string | null>(null);
  /** Motivo por el que el video no arranca (error del navegador o demora excesiva). */
  readonly videoError = signal<string | null>(null);
  readonly ended = signal(false);
  readonly rate = signal(1);

  readonly tab = signal<PlayerTab>('descripcion');
  readonly resources = signal<Loadable<ClassResource[]>>(idle());
  readonly links = signal<Loadable<string>>(idle());
  readonly examData = signal<Loadable<ExamListResponse>>(idle());
  readonly downloading = signal<ReadonlySet<number>>(new Set());
  readonly downloadError = signal<string | null>(null);
  readonly openModules = signal<ReadonlySet<number>>(new Set());

  // ---------- Derivados ----------
  readonly lessons = computed<CourseLesson[]>(
    () => this.content()?.modules.flatMap((m) => m.lessons) ?? []
  );
  readonly current = computed<CourseLesson | null>(
    () => this.lessons().find((l) => l.id === this.currentId()) ?? null
  );
  readonly currentIndex = computed(() => this.lessons().findIndex((l) => l.id === this.currentId()));
  readonly prevLesson = computed<CourseLesson | null>(() => this.lessons()[this.currentIndex() - 1] ?? null);
  readonly nextLesson = computed<CourseLesson | null>(() => {
    const i = this.currentIndex();
    return i >= 0 ? this.lessons()[i + 1] ?? null : null;
  });
  readonly total = computed(() => this.lessons().length);
  readonly completed = computed(() => this.lessons().filter((l) => l.checkpoint).length);
  readonly percent = computed(() =>
    this.total() ? Math.round((this.completed() / this.total()) * 100) : 0
  );
  readonly currentModuleName = computed(() => {
    const id = this.currentId();
    return this.content()?.modules.find((m) => m.lessons.some((l) => l.id === id))?.name ?? '';
  });
  readonly daysLeft = computed<number | null>(() => {
    const end = this.content()?.fechaVencimiento;
    return end ? daysBetweenToday(end) : null;
  });

  readonly examRows = computed<PlayerExamRow[]>(() => {
    const d = this.examData().data;
    if (!d) return [];
    const currentId = this.current()?.id;
    const rows: PlayerExamRow[] = [];

    if (d.exam_course?.exist && d.exam_course.exam_id != null) {
      rows.push({ level: 'curso', name: d.exam_course.nombre, approved: d.exam_course.approved, examId: d.exam_course.exam_id, isCurrent: false });
    }
    for (const m of d.exams_module ?? []) {
      if (m.exist && m.exam_id != null) {
        rows.push({ level: 'módulo', name: m.name, approved: m.approved, examId: m.exam_id, isCurrent: false });
      }
    }
    for (const c of d.exams_class ?? []) {
      if (c.exist && c.exam_id != null) {
        rows.push({ level: 'clase', name: c.name, approved: c.approved, examId: c.exam_id, isCurrent: c.class_id === currentId });
      }
    }
    // El examen de la clase actual primero; el resto conserva el orden curso → módulo → clase.
    return [...rows].sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent));
  });
  readonly currentExam = computed(() => this.examRows().find((r) => r.isCurrent) ?? null);

  @ViewChild('video') private videoRef?: ElementRef<HTMLVideoElement>;

  private sub?: Subscription;
  private productSlug = '';
  private resumeAt = 0;
  private lastSavedAt = 0;
  private lastTick = 0;
  private noticeTimer: ReturnType<typeof setTimeout> | null = null;
  private slowTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private crmApi: CrmApiService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe((params) => {
      const productSlug = params.get('productSlug');
      if (!productSlug) return;
      this.onRoute(productSlug, params.get('classSlug'));
    });
  }

  ngOnDestroy(): void {
    this.saveProgress();
    this.sub?.unsubscribe();
    if (this.noticeTimer) clearTimeout(this.noticeTimer);
    this.clearSlowTimer();
  }

  /** Celulares: al cambiar de app o bloquear la pantalla, guarda el punto exacto. */
  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (document.visibilityState === 'hidden') this.saveProgress();
  }

  /** Al cerrar la pestaña: envío "best effort" que sobrevive a la descarga de la página. */
  @HostListener('window:pagehide')
  onPageHide(): void {
    this.saveProgress(true);
  }

  // ---------- Navegación entre curso y clases ----------

  private onRoute(productSlug: string, classSlug: string | null): void {
    // Antes de cambiar de clase (o de curso) se guarda dónde quedó la anterior.
    this.saveProgress();

    if (productSlug !== this.productSlug) {
      this.productSlug = productSlug;
      this.resetCourse();
      this.loadCourse(productSlug, classSlug);
    } else {
      this.selectLesson(classSlug);
    }
  }

  private resetCourse(): void {
    this.content.set(null);
    this.productId.set(null);
    this.currentId.set(null);
    this.videoUrl.set(null);
    this.examData.set(idle());
    this.resources.set(idle());
    this.links.set(idle());
    this.openModules.set(new Set());
    this.status.set('loading');
  }

  private loadCourse(slug: string, classSlug: string | null): void {
    forkJoin({
      content: this.crmApi.getCourseContent(slug),
      product: this.crmApi.getCourseProduct(slug),
    }).subscribe({
      next: ({ content, product }) => {
        if (this.productSlug !== slug) return; // el alumno ya se fue a otro curso
        if (!content?.modules || !product?.id) {
          this.fail('No encontramos este curso en tu cuenta.');
          return;
        }
        this.productId.set(product.id);
        this.content.set(content);

        if (isExpired(content.fechaVencimiento)) {
          this.status.set('expired');
          return;
        }
        this.status.set('ready');
        this.selectLesson(classSlug);
      },
      error: () => this.fail('No pudimos cargar el curso. Intenta de nuevo en unos minutos.'),
    });
  }

  private selectLesson(classSlug: string | null): void {
    if (this.status() !== 'ready') return;
    const lessons = this.lessons();
    if (!lessons.length) return;

    // "Continuar" llega sin clase: retoma la última que el alumno empezó.
    if (!classSlug) {
      this.router.navigate(['/aula-virtual/curso', this.productSlug, this.resumeLesson().slug], {
        replaceUrl: true,
      });
      return;
    }

    const lesson = lessons.find((l) => l.slug === classSlug);
    if (!lesson) {
      // Enlace viejo o clase inexistente: en vez de un error, volvemos al inicio del curso.
      this.router.navigate(['/aula-virtual/curso', this.productSlug], { replaceUrl: true });
      return;
    }
    this.startLesson(lesson);
  }

  private resumeLesson(): CourseLesson {
    const lessons = this.lessons();
    const started = lessons.filter((l) => l.checkpoint);
    return started.length ? started[started.length - 1] : lessons[0];
  }

  private startLesson(lesson: CourseLesson): void {
    this.currentId.set(lesson.id);
    this.ended.set(false);
    this.resumeNotice.set(null);
    this.videoError.set(null);
    this.clearSlowTimer();
    this.videoUrl.set(null);
    this.videoState.set('loading');
    this.resumeAt = 0;
    this.lastSavedAt = 0;
    this.lastTick = Date.now();
    this.resources.set(idle());
    this.links.set(idle());
    this.downloadError.set(null);

    this.openModuleOf(lesson.id);
    this.loadMedia(lesson);
    this.ensureTab();

    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        // entornos sin scroll: irrelevante
      }
    }
  }

  private fail(message: string): void {
    this.errorText.set(message);
    this.status.set('error');
  }

  goTo(lesson: CourseLesson): void {
    if (lesson.id === this.currentId()) return;
    this.router.navigate(['/aula-virtual/curso', this.productSlug, lesson.slug]);
  }

  // ---------- Video y progreso ----------

  private loadMedia(lesson: CourseLesson): void {
    const productId = this.productId();
    if (productId === null) return;

    // Solo se pide el minuto guardado si la clase ya tiene avance (si no, el backend da error).
    const time$ = lesson.checkpoint
      ? this.crmApi.getClassTime(productId, lesson.id).pipe(
          map((r) => Number(r?.time) || 0),
          catchError(() => of(0))
        )
      : of(0);
    const url$ = this.crmApi.getClassVideoUrl(lesson.slug, productId).pipe(
      map((u) => (u ?? '').trim()),
      catchError(() => of(''))
    );

    forkJoin({ url: url$, time: time$ }).subscribe(({ url, time }) => {
      if (this.currentId() !== lesson.id) return; // respuesta de una clase anterior
      if (!/^https?:\/\//i.test(url)) {
        this.videoState.set('none');
        return;
      }
      this.resumeAt = time;
      this.lastSavedAt = Math.floor(time);
      this.videoUrl.set(url);
      this.videoState.set('ready');
      this.armSlowTimer();
    });
  }

  /** Si en 12 s el navegador no logró leer ni los metadatos, avisamos en vez de dejar la pantalla negra. */
  private armSlowTimer(): void {
    this.clearSlowTimer();
    this.slowTimer = setTimeout(() => {
      this.slowTimer = null;
      if (!this.videoError()) {
        this.videoError.set('El video está tardando más de lo normal en cargar.');
      }
    }, SLOW_LOAD_MS);
  }

  private clearSlowTimer(): void {
    if (this.slowTimer) {
      clearTimeout(this.slowTimer);
      this.slowTimer = null;
    }
  }

  /** El <video> avisa de un fallo: traducimos el código del navegador a un mensaje útil. */
  onVideoError(): void {
    const code = this.videoRef?.nativeElement.error?.code;
    if (code === 1) return; // el propio navegador abortó (cambio de clase): no es un fallo
    this.clearSlowTimer();
    const messages: Record<number, string> = {
      2: 'Se cortó la descarga del video. Revisa tu conexión e intenta de nuevo.',
      3: 'El navegador no pudo decodificar este video (formato o códec no compatible).',
    };
    this.videoError.set(
      (code && messages[code]) ||
        'El navegador no pudo abrir este video: el archivo puede no existir o no tener permiso de acceso.'
    );
  }

  /** Vuelve a pedir la URL y a cargar el video de la clase actual. */
  retryVideo(): void {
    const lesson = this.current();
    if (!lesson) return;
    this.clearSlowTimer();
    this.videoError.set(null);
    this.videoUrl.set(null);
    this.videoState.set('loading');
    this.loadMedia(lesson);
  }

  onLoadedMetadata(): void {
    const video = this.videoRef?.nativeElement;
    if (!video) return;
    this.clearSlowTimer();
    this.videoError.set(null);
    video.playbackRate = this.rate();

    // Retoma donde se quedó, salvo que ya estuviera casi al final.
    if (this.resumeAt > 3 && isFinite(video.duration) && video.duration - this.resumeAt > 5) {
      video.currentTime = this.resumeAt;
      this.resumeNotice.set(`Retomamos donde lo dejaste (${formatClock(this.resumeAt)})`);
    }
    this.resumeAt = 0;
  }

  onPlay(): void {
    this.ended.set(false);
    if (this.resumeNotice() && !this.noticeTimer) {
      this.noticeTimer = setTimeout(() => {
        this.resumeNotice.set(null);
        this.noticeTimer = null;
      }, 5000);
    }
  }

  onTimeUpdate(): void {
    const now = Date.now();
    if (now - this.lastTick >= SAVE_EVERY_MS) {
      this.lastTick = now;
      this.saveProgress();
    }
  }

  onPause(): void {
    this.saveProgress();
  }

  onEnded(): void {
    this.saveProgress();
    this.ended.set(true);
  }

  setRate(rate: number): void {
    this.rate.set(rate);
    const video = this.videoRef?.nativeElement;
    if (video) video.playbackRate = rate;
  }

  private saveProgress(onExit = false): void {
    const video = this.videoRef?.nativeElement;
    const lesson = this.current();
    const productId = this.productId();
    if (!video || !lesson || productId === null || this.videoState() !== 'ready') return;

    const seconds = Math.floor(video.currentTime || 0);
    if (seconds < 1 || Math.abs(seconds - this.lastSavedAt) < 1) return;

    const previous = this.lastSavedAt;
    this.lastSavedAt = seconds;

    if (onExit) {
      const token = this.auth.token;
      if (token) this.crmApi.saveClassTimeOnExit(productId, lesson.id, seconds, token);
      return;
    }

    this.crmApi.saveClassTime(productId, lesson.id, seconds).subscribe({
      next: () => this.markSeen(lesson.id),
      error: () => {
        // Sin conexión: se reintenta en el próximo guardado.
        this.lastSavedAt = previous;
      },
    });
  }

  private markSeen(lessonId: number): void {
    this.content.update((c) =>
      c
        ? {
            ...c,
            modules: c.modules.map((m) => ({
              ...m,
              lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, checkpoint: true } : l)),
            })),
          }
        : c
    );
  }

  // ---------- Temario ----------

  isOpen(index: number): boolean {
    return this.openModules().has(index);
  }

  toggleModule(index: number): void {
    const next = new Set(this.openModules());
    if (next.has(index)) next.delete(index);
    else next.add(index);
    this.openModules.set(next);
  }

  private openModuleOf(lessonId: number): void {
    const index = this.content()?.modules.findIndex((m) => m.lessons.some((l) => l.id === lessonId)) ?? -1;
    if (index >= 0 && !this.openModules().has(index)) {
      this.openModules.set(new Set(this.openModules()).add(index));
    }
  }

  moduleDone(module: CourseModuleContent): number {
    return module.lessons.filter((l) => l.checkpoint).length;
  }

  lessonDuration(time?: string | null): string {
    return formatLessonTime(time);
  }

  // ---------- Pestañas ----------

  setTab(tab: PlayerTab): void {
    this.tab.set(tab);
    this.ensureTab();
  }

  private ensureTab(): void {
    const lesson = this.current();
    if (!lesson) return;
    switch (this.tab()) {
      case 'recursos':
        if (this.resources().status === 'idle') this.loadResources(lesson);
        break;
      case 'enlaces':
        if (this.links().status === 'idle') this.loadLinks(lesson);
        break;
      case 'examenes': {
        const s = this.examData().status;
        if (s === 'idle' || s === 'error') this.loadExams();
        break;
      }
    }
  }

  hasDescription(lesson: CourseLesson): boolean {
    return hasVisibleContent(lesson.description);
  }

  retry(tab: 'recursos' | 'enlaces' | 'examenes'): void {
    if (tab === 'recursos') this.resources.set(idle());
    else if (tab === 'enlaces') this.links.set(idle());
    else this.examData.set(idle());
    this.ensureTab();
  }

  private loadResources(lesson: CourseLesson): void {
    this.resources.set({ status: 'loading', data: null });
    this.crmApi.getClassResources(lesson.slug).subscribe({
      next: (data) => {
        if (this.currentId() !== lesson.id) return;
        this.resources.set({ status: 'ready', data: data ?? [] });
      },
      error: () => {
        if (this.currentId() === lesson.id) this.resources.set({ status: 'error', data: null });
      },
    });
  }

  private loadLinks(lesson: CourseLesson): void {
    this.links.set({ status: 'loading', data: null });
    this.crmApi.getClassLinks(this.productSlug, lesson.slug).subscribe({
      next: (res) => {
        if (this.currentId() !== lesson.id) return;
        const html = (res?.external_links ?? '').trim();
        // El editor del CRM guarda "<p><br></p>" cuando no hay enlaces.
        const empty = !hasVisibleContent(html) && !/<a\s/i.test(html);
        this.links.set({ status: 'ready', data: empty ? '' : html });
      },
      error: () => {
        if (this.currentId() === lesson.id) this.links.set({ status: 'error', data: null });
      },
    });
  }

  private loadExams(): void {
    this.examData.set({ status: 'loading', data: null });
    this.crmApi.getExamList(this.productSlug).subscribe({
      next: (data) => this.examData.set({ status: 'ready', data }),
      error: () => this.examData.set({ status: 'error', data: null }),
    });
  }

  /** Los enlaces externos son HTML del CRM: se abren siempre en pestaña nueva y sin referrer. */
  onLinksClick(event: MouseEvent): void {
    const anchor = (event.target as HTMLElement | null)?.closest?.('a');
    const href = anchor?.getAttribute('href');
    if (anchor && href) {
      event.preventDefault();
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  }

  download(resource: ClassResource): void {
    if (this.downloading().has(resource.id)) return;
    this.downloadError.set(null);
    this.downloading.set(new Set(this.downloading()).add(resource.id));

    const done = () => {
      const next = new Set(this.downloading());
      next.delete(resource.id);
      this.downloading.set(next);
    };

    this.crmApi.downloadClassResource(resource.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = resource.filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
        done();
      },
      error: () => {
        this.downloadError.set(`No pudimos descargar "${resource.filename}". Intenta de nuevo.`);
        done();
      },
    });
  }
}

// ---------- Utilidades ----------

function hasVisibleContent(html?: string | null): boolean {
  return !!html && html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0;
}

/** "00:12:34" → "12:34"; "01:02:03" → "1:02:03"; vacío → "". */
export function formatLessonTime(time?: string | null): string {
  if (!time) return '';
  const [h, m, s] = time.split(':').map((n) => parseInt(n, 10));
  if ([h, m, s].some((n) => Number.isNaN(n)) || (h === 0 && m === 0 && s === 0)) return '';
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

/** Segundos → "m:ss" (o "h:mm:ss"). */
export function formatClock(total: number): string {
  const t = Math.max(0, Math.floor(total));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** El acceso vence cuando la fecha de vencimiento (YYYY-MM-DD) ya quedó atrás. */
export function isExpired(fechaVencimiento?: string | null): boolean {
  return !!fechaVencimiento && fechaVencimiento < todayIso();
}

function daysBetweenToday(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map((n) => parseInt(n, 10));
  const end = new Date(y, (m || 1) - 1, d || 1).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((end - today) / 86_400_000);
}
