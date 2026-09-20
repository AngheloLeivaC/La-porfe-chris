import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { CrmApiService } from '../../../core/crm-api.service';
import { ContentService } from '../../../core/content.service';
import { PurchasedCourse, ExamListResponse } from '../../../core/models';
import { environment } from '../../../../environments/environment';

type ExamLevel = 'curso' | 'módulo' | 'clase';

interface ExamRow {
  level: ExamLevel;
  name: string;
  approved: boolean;
  examId?: number;
}

@Component({
  selector: 'app-exams-panel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './exams-panel.component.html',
  styleUrl: './exams-panel.component.css',
})
export class ExamsPanelComponent implements OnInit {
  readonly courses = signal<PurchasedCourse[]>([]);
  readonly coursesLoading = signal(false);
  readonly coursesError = signal(false);

  readonly selectedCourse = signal<PurchasedCourse | null>(null);
  readonly examData = signal<ExamListResponse | null>(null);
  readonly examLoading = signal(false);
  readonly examError = signal(false);

  constructor(private auth: AuthService, private crmApi: CrmApiService, public content: ContentService) {}

  ngOnInit(): void {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    this.coursesLoading.set(true);
    this.crmApi.getPurchasedProducts(userId).subscribe({
      next: (courses) => {
        this.courses.set(courses);
        this.coursesLoading.set(false);
        if (courses.length > 0) {
          this.selectCourse(courses[0]);
        }
      },
      error: () => {
        this.coursesError.set(true);
        this.coursesLoading.set(false);
      },
    });
  }

  selectCourse(course: PurchasedCourse): void {
    if (!course.slug_product) return;
    this.selectedCourse.set(course);
    this.examData.set(null);
    this.examError.set(false);
    this.examLoading.set(true);

    this.crmApi.getExamList(course.slug_product).subscribe({
      next: (data) => {
        this.examData.set(data);
        this.examLoading.set(false);
      },
      error: () => {
        this.examError.set(true);
        this.examLoading.set(false);
      },
    });
  }

  /** Aplana la respuesta del backend (curso + módulos + clases) en filas listas para pintar. */
  readonly rows = computed<ExamRow[]>(() => {
    const data = this.examData();
    if (!data) return [];

    const rows: ExamRow[] = [];

    if (data.exam_course?.exist) {
      rows.push({ level: 'curso', name: data.exam_course.nombre, approved: data.exam_course.approved, examId: data.exam_course.exam_id });
    }
    for (const m of data.exams_module ?? []) {
      if (m.exist) rows.push({ level: 'módulo', name: m.name, approved: m.approved, examId: m.exam_id });
    }
    for (const c of data.exams_class ?? []) {
      if (c.exist) rows.push({ level: 'clase', name: c.name, approved: c.approved, examId: c.exam_id });
    }
    return rows;
  });

  readonly progressLabel = computed(() => {
    const data = this.examData();
    if (!data || data.exam_progress === 'empty') return null;
    return data.exam_progress;
  });

  courseImage(course: PurchasedCourse): string {
    if (!course.portada_url) return this.content.images.hero;
    return course.portada_url.startsWith('http')
      ? course.portada_url
      : `${environment.storageBaseUrl}${course.portada_url.startsWith('/') ? '' : '/'}${course.portada_url}`;
  }
}
