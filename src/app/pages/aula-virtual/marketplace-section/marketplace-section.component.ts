import { Component, HostListener, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { CrmApiService } from '../../../core/crm-api.service';
import { AuthService } from '../../../core/auth.service';
import { CulqiService } from '../../../core/culqi.service';
import { CrmCourseListItem } from '../../../core/models';
import { environment } from '../../../../environments/environment';

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
  imports: [CommonModule],
  templateUrl: './marketplace-section.component.html',
  styleUrl: './marketplace-section.component.css',
})
export class MarketplaceSectionComponent implements OnInit {
  readonly courses = signal<CrmCourseListItem[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);

  // ids de cursos con una compra en curso (para deshabilitar SOLO esa tarjeta)
  readonly purchasingIds = signal<Set<number>>(new Set());
  readonly purchasedIds = signal<Set<number>>(new Set());
  readonly errorMessage = signal<string | null>(null);

  // "Vista rápida": se abre con CLIC en la imagen (no con hover, eso ya se
  // revirtió antes). El detalle se carga una sola vez por curso y queda
  // en caché para no repetir la petición si se vuelve a abrir.
  readonly quickViewCourse = signal<CrmCourseListItem | null>(null);
  readonly quickViewDetails = signal<Record<number, QuickViewInfo>>({});

  constructor(
    private crmApi: CrmApiService,
    private auth: AuthService,
    private culqi: CulqiService
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

  priceLabel(course: CrmCourseListItem): string {
    return Number(course.precio).toFixed(2);
  }

  isPurchasing(course: CrmCourseListItem): boolean {
    return this.purchasingIds().has(course.id);
  }

  isPurchased(course: CrmCourseListItem): boolean {
    return this.purchasedIds().has(course.id);
  }

  async comprar(course: CrmCourseListItem): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;

    this.errorMessage.set(null);
    this.setPurchasing(course.id, true);

    try {
      const amountInCents = Math.round(Number(course.precio) * 100);

      // 1) Abre el widget de Culqi y obtiene el token de la tarjeta.
      const { id: token, email } = await this.culqi.open(amountInCents, course.nombre);

      // 2) Cobra el monto (mismo flujo/limitación de seguridad que Buy.vue).
      const charge = await firstValueFrom(this.culqi.charge(amountInCents, email, token));

      if (charge.outcome.type !== 'venta_exitosa') {
        this.errorMessage.set('El pago fue rechazado por el banco.');
        return;
      }

      // 3) Registra la compra en el CRM (otorga acceso al curso).
      await firstValueFrom(
        this.crmApi.savePayment({
          user_id: user.id,
          product_id: course.id,
          amount: amountInCents,
          reference_code: charge.reference_code,
          product_type: course.tipo_producto_id,
        })
      );

      this.purchasedIds.update((set) => new Set(set).add(course.id));
    } catch (error: any) {
      console.error(error);
      const cancelled = error?.message === 'El pago fue cancelado.';
      if (!cancelled) {
        this.errorMessage.set('No se pudo completar la compra. Intenta nuevamente.');
      }
    } finally {
      this.setPurchasing(course.id, false);
    }
  }

  private setPurchasing(id: number, value: boolean): void {
    this.purchasingIds.update((set) => {
      const next = new Set(set);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  openQuickView(course: CrmCourseListItem): void {
    this.quickViewCourse.set(course);
    document.body.style.overflow = 'hidden';

    // Ya se pidió antes -> no repetir la petición.
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
    }
  }
}
