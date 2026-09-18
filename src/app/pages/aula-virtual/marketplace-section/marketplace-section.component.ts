import { Component, HostListener, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CrmApiService } from '../../../core/crm-api.service';
import { AuthService } from '../../../core/auth.service';
import { CartService } from '../../../core/cart.service';
import { CrmCourseListItem } from '../../../core/models';
import { environment } from '../../../../environments/environment';
import {
  StripeCheckoutModalComponent,
  StripeCartItem,
} from '../../../shared/stripe-checkout-modal/stripe-checkout-modal.component';

// Paleta fija: cada categoría recibe un color consistente según su nombre,
// sin depender de que el CRM defina un color (no existe esa columna).
const BADGE_PALETTE = [
  '#0d6efd', // azul
  '#198754', // verde
  '#fd7e14', // naranja
  '#d63384', // rosa/rojo
  '#0dcaf0', // celeste
  '#212529', // negro
  '#6f42c1', // morado
];

function colorForCategory(name: string): string {
  const hash = Array.from(name || '').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return BADGE_PALETTE[hash % BADGE_PALETTE.length];
}

interface QuickViewInfo {
  status: 'loading' | 'ready' | 'error';
  modules?: string[];
}

@Component({
  selector: 'app-marketplace-section',
  standalone: true,
  imports: [CommonModule, StripeCheckoutModalComponent],
  templateUrl: './marketplace-section.component.html',
  styleUrl: './marketplace-section.component.css',
})
export class MarketplaceSectionComponent implements OnInit {
  readonly courses = signal<CrmCourseListItem[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);

  readonly purchasingIds = signal<Set<number>>(new Set());
  readonly purchasedIds = signal<Set<number>>(new Set());
  readonly errorMessage = signal<string | null>(null);

  readonly quickViewCourse = signal<CrmCourseListItem | null>(null);
  readonly quickViewDetails = signal<Record<number, QuickViewInfo>>({});

  readonly cartOpen = signal(false);
  readonly cartCheckingOut = signal(false);

  // Modal de pago embebido (Stripe Elements)
  readonly payingItems = signal<StripeCartItem[] | null>(null);
  readonly payingTotalLabel = signal('');

  constructor(
    private crmApi: CrmApiService,
    public auth: AuthService,
    public cart: CartService
  ) {}

  ngOnInit(): void {
    this.crmApi.getCourses().subscribe({
      next: (courses) => {
        this.courses.set(courses);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  courseImage(course: CrmCourseListItem): string {
    if (!course.portada_url) return '';
    return course.portada_url.startsWith('http')
      ? course.portada_url
      : `${environment.storageBaseUrl}${course.portada_url.startsWith('/') ? '' : '/'}${course.portada_url}`;
  }

  badgeColor(course: CrmCourseListItem): string {
    return colorForCategory(course.categoria);
  }

  buttonGradient(course: CrmCourseListItem): string {
    const color = this.badgeColor(course);
    return `linear-gradient(135deg, ${color}, ${this.shade(color, -18)})`;
  }

  private shade(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const clamp = (v: number) => Math.max(0, Math.min(255, v));
    const r = clamp((num >> 16) + amt);
    const g = clamp(((num >> 8) & 0x00ff) + amt);
    const b = clamp((num & 0x0000ff) + amt);
    return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
  }

  priceLabel(course: CrmCourseListItem): string {
    return Number(course.precio).toFixed(2);
  }

  isPurchasing(course: CrmCourseListItem): boolean {
    return this.purchasingIds().has(course.id);
  }

  isPurchased(course: CrmCourseListItem): boolean {
    return this.purchasedIds().has(course.id);
  }

  /** Compra directa e inmediata de UN solo curso (no pasa por el carrito). */
  comprar(course: CrmCourseListItem): void {
    const user = this.auth.currentUser();
    if (!user) return;

    this.errorMessage.set(null);
    this.payingTotalLabel.set(`$ ${this.priceLabel(course)}`);
    this.payingItems.set([
      { product_id: course.id, product_type: course.tipo_producto_id },
    ]);
  }

  private setPurchasing(id: number, value: boolean): void {
    this.purchasingIds.update((set) => {
      const next = new Set(set);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  // ---------- Carrito ----------

  toggleCart(course: CrmCourseListItem): void {
    this.cart.toggle(course);
  }

  openCartPanel(): void {
    this.cartOpen.set(true);
  }

  closeCartPanel(): void {
    this.cartOpen.set(false);
  }

  removeFromCart(courseId: number): void {
    this.cart.remove(courseId);
  }

  checkoutCart(): void {
    const user = this.auth.currentUser();
    if (!user || this.cart.count === 0) return;

    this.errorMessage.set(null);
    this.payingTotalLabel.set(`$ ${this.cart.total.toFixed(2)}`);
    this.payingItems.set(
      this.cart.items().map((c) => ({
        product_id: c.id,
        product_type: c.tipo_producto_id,
      }))
    );
    this.closeCartPanel();
  }

  onPaymentSuccess(): void {
    const items = this.payingItems();
    if (items) {
      // Marca como comprados los cursos que se acaban de pagar, para que
      // el botón cambie a "Comprado" sin esperar a recargar la página.
      this.purchasedIds.update((set) => {
        const next = new Set(set);
        items.forEach((i) => next.add(i.product_id));
        return next;
      });
      // Si venían del carrito, límpialo.
      items.forEach((i) => this.cart.remove(i.product_id));
    }
    this.payingItems.set(null);
  }

  closePaymentModal(): void {
    this.payingItems.set(null);
  }

  // ---------- Vista rápida ----------

  openQuickView(course: CrmCourseListItem): void {
    this.quickViewCourse.set(course);
    document.body.style.overflow = 'hidden';

    if (this.quickViewDetails()[course.id]) return;

    this.quickViewDetails.update((map) => ({
      ...map,
      [course.id]: { status: 'loading' },
    }));

    this.crmApi.getCourseTemary(course.slug).subscribe({
      next: (temary) => {
        const modules = (temary.modules ?? []).map((m) => m.name);
        this.quickViewDetails.update((map) => ({
          ...map,
          [course.id]: { status: 'ready', modules },
        }));
      },
      error: () => {
        this.quickViewDetails.update((map) => ({
          ...map,
          [course.id]: { status: 'error' },
        }));
      },
    });
  }

  closeQuickView(): void {
    this.quickViewCourse.set(null);
    document.body.style.overflow = '';
  }

  quickViewInfo(course: CrmCourseListItem): QuickViewInfo | undefined {
    return this.quickViewDetails()[course.id];
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.quickViewCourse()) {
      this.closeQuickView();
    } else if (this.cartOpen()) {
      this.closeCartPanel();
    }
  }
}