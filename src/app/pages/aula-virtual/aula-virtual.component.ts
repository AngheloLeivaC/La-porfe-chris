import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { CrmApiService } from '../../core/crm-api.service';
import { ContentService } from '../../core/content.service';
import { PurchasedCourse } from '../../core/models';
import { environment } from '../../../environments/environment';
import { AulaSidebarComponent, AulaSection } from './aula-sidebar/aula-sidebar.component';
import { MarketplaceSectionComponent } from './marketplace-section/marketplace-section.component';
import { ActivitiesPanelComponent } from './activities-panel/activities-panel.component';
import { CalendarPanelComponent } from './calendar-panel/calendar-panel.component';
import { ExamsPanelComponent } from './exams-panel/exams-panel.component';

@Component({
  selector: 'app-aula-virtual',
  standalone: true,
  imports: [CommonModule, RouterLink, AulaSidebarComponent, MarketplaceSectionComponent, ActivitiesPanelComponent, CalendarPanelComponent, ExamsPanelComponent],
  templateUrl: './aula-virtual.component.html',
  styleUrl: './aula-virtual.component.css',
})
export class AulaVirtualComponent implements OnInit {
  readonly courses = signal<PurchasedCourse[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);

  readonly activeSection = signal<AulaSection>('mis-cursos');
  readonly mobileSidebarOpen = signal(false);
  readonly stripeMessage = signal<{ type: 'success' | 'cancelled'; text: string } | null>(null);

  constructor(
    public auth: AuthService,
    private crmApi: CrmApiService,
    public content: ContentService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (!user) return;

    // Vuelta desde Stripe Checkout (?stripe=success | ?stripe=cancelled).
    // El acceso real al curso lo otorga el webhook del backend, no esto
    // — este mensaje es solo para avisarle al alumno qué pasó.
    this.route.queryParamMap.subscribe((params) => {
      const stripeResult = params.get('stripe');
      if (stripeResult === 'success') {
        this.stripeMessage.set({
          type: 'success',
          text: '¡Pago recibido! Tu curso puede tardar unos segundos en aparecer en "Mis Cursos".',
        });
      } else if (stripeResult === 'cancelled') {
        this.stripeMessage.set({
          type: 'cancelled',
          text: 'Cancelaste el pago con Stripe. No se realizó ningún cargo.',
        });
      }
    });

    this.crmApi.getPurchasedProducts(user.id).subscribe({
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

  courseImage(course: PurchasedCourse): string {
    if (!course.portada_url) return this.content.images.hero;
    return course.portada_url.startsWith('http')
      ? course.portada_url
      : `${environment.storageBaseUrl}${course.portada_url.startsWith('/') ? '' : '/'}${course.portada_url}`;
  }

  /** Insignia de estado del curso, basada en datos reales (no inventados). */
  courseStatus(course: PurchasedCourse): { label: string; className: string } {
    if (course.is_blocked === 1) {
      return { label: 'Bloqueado', className: 'status-blocked' };
    }
    if (course.fechaVencimiento && new Date(course.fechaVencimiento) < new Date()) {
      return { label: 'Vencido', className: 'status-expired' };
    }
    return { label: 'Activo', className: 'status-active' };
  }

  logout(): void {
    this.auth.logout();
  }

  userInitials(name: string): string {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const second = parts.length > 1 ? parts[1][0] : '';
    return (first + second).toUpperCase();
  }
}
