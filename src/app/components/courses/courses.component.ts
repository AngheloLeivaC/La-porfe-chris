import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../core/content.service';
import { Course, CourseLanguage } from '../../core/models';
import {
  RegisterModalComponent,
  RegisteredUser,
} from '../../shared/register-modal/register-modal.component';
import {
  StripeCheckoutModalComponent,
  StripeCartItem,
} from '../../shared/stripe-checkout-modal/stripe-checkout-modal.component';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, RouterLink, RegisterModalComponent, StripeCheckoutModalComponent],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.css',
})
export class CoursesComponent implements AfterViewChecked, OnDestroy {
  selectedLanguage: CourseLanguage = 'frances';

  // ---- Carrusel de cursos ----
  @ViewChild('track') private trackRef?: ElementRef<HTMLDivElement>;
  readonly atStart = signal(true);
  readonly atEnd = signal(false);
  readonly hasOverflow = signal(false);

  // ---- Flujo de compra: registro -> pago ----
  readonly buyingCourse = signal<Course | null>(null);
  readonly registeredUser = signal<RegisteredUser | null>(null);
  readonly purchaseDone = signal(false);

  constructor(public content: ContentService) {}

  get filteredCourses() {
    return this.content
      .courses()
      .filter((c) => c.language === this.selectedLanguage);
  }

  get loading(): boolean {
    return this.content.coursesLoading();
  }

  get loadError(): boolean {
    return this.content.coursesError();
  }

  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private observedEl?: HTMLDivElement;

  ngAfterViewChecked(): void {
    // El carrusel vive detrás de un *ngIf que depende de que los cursos
    // terminen de cargar (async), así que el elemento puede no existir
    // todavía cuando Angular llama a ngAfterViewInit. Por eso revisamos
    // en cada ciclo si ya apareció (o cambió, p. ej. al cambiar de
    // idioma) y recién ahí conectamos los observadores.
    const el = this.trackEl;
    if (el && el !== this.observedEl) {
      this.attachObservers(el);
    }
  }

  private attachObservers(el: HTMLDivElement): void {
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
    this.observedEl = el;
    this.updateScrollState();

    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => this.updateScrollState());
      this.resizeObserver.observe(el);
    }

    // Detecta cuando las tarjetas se agregan/reemplazan en el DOM: cubre
    // tanto la primera carga (los cursos llegan async del backend) como
    // el cambio de idioma, sin depender de un timing manual.
    this.mutationObserver = new MutationObserver(() => this.updateScrollState());
    this.mutationObserver.observe(el, { childList: true });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
  }

  private get trackEl(): HTMLDivElement | undefined {
    return this.trackRef?.nativeElement;
  }

  updateScrollState(): void {
    const el = this.trackEl;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    this.hasOverflow.set(maxScroll > 4);
    this.atStart.set(el.scrollLeft <= 4);
    this.atEnd.set(el.scrollLeft >= maxScroll - 4);
  }

  scroll(direction: 1 | -1): void {
    const el = this.trackEl;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('.course-card');
    const gapValue = parseFloat(getComputedStyle(el).columnGap || '0') || 0;
    const step = card ? card.getBoundingClientRect().width + gapValue : el.clientWidth;
    el.scrollBy({ left: step * direction, behavior: 'smooth' });
  }

  setLanguage(lang: CourseLanguage): void {
    this.selectedLanguage = lang;
    // Espera a que Angular re-renderice las tarjetas del nuevo idioma
    // antes de resetear el scroll y recalcular el estado del carrusel.
    setTimeout(() => {
      this.trackEl?.scrollTo({ left: 0 });
      this.updateScrollState();
    });
  }

  // Paso 1: abre el modal de registro para este curso
  comprar(course: Course): void {
    this.purchaseDone.set(false);
    this.buyingCourse.set(course);
  }

  // Paso 2: cuando el registro termina bien, pasa al pago
  onRegistered(user: RegisteredUser): void {
    this.registeredUser.set(user);
  }

  // Items para el modal de Stripe, a partir del curso que se está comprando
  get paymentItems(): StripeCartItem[] {
    const course = this.buyingCourse();
    if (!course?.id || !course?.tipoProductoId) return [];
    return [{ product_id: course.id, product_type: course.tipoProductoId }];
  }

  get paymentTotalLabel(): string {
    return this.buyingCourse()?.price ?? '';
  }

  onPaymentSuccess(): void {
    this.purchaseDone.set(true);
    this.buyingCourse.set(null);
    this.registeredUser.set(null);
  }

  closeBuyFlow(): void {
    this.buyingCourse.set(null);
    this.registeredUser.set(null);
  }
}