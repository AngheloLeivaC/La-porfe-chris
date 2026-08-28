import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContentService } from '../../core/content.service';
import { Course } from '../../core/models';
import { EnrollmentModalComponent } from '../../shared/enrollment-modal/enrollment-modal.component';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, EnrollmentModalComponent],
  templateUrl: './course-detail.component.html',
  styleUrl: './course-detail.component.css',
})
export class CourseDetailComponent implements OnInit {
  @ViewChild('previewVideo') previewVideoRef?: ElementRef<HTMLVideoElement>;

  course?: Course;
  notFound = false;
  loadingDetail = false;
  videoPlaying = false;
  openModuleIndex: number | null = 0;
  showEnrollmentModal = false;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public content: ContentService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug') ?? '';

      this.notFound = false;
      this.course = undefined;
      this.loadingDetail = true;

      // Carga el curso DIRECTO por su slug (endpoint /course/details/{slug},
      // que ya trae 'categoria' y 'tipo' correctamente desde el backend).
      // Antes dependía de que el listado general (/course/list) ya hubiera
      // cargado y tuviera el idioma bien mapeado — eso lo hacía frágil ante
      // recargas directas de página (F5) y dependía de un bug del backend
      // en /course/list que no traía 'categoria'.
      this.content.loadCourseBySlug(slug).subscribe({
        next: (course: Course) => {
          this.course = course;
          this.loadingDetail = false;
        },
        error: () => {
          this.notFound = true;
          this.loadingDetail = false;
        },
      });

      this.videoPlaying = false;
      this.openModuleIndex = 0;
      window.scrollTo({ top: 0 });
    });
  }

  get languageLabel(): string {
    return (
      this.content.languageTabs.find((tab) => tab.id === this.course?.language)?.label ?? ''
    );
  }

  get siblingCourses(): Course[] {
    if (!this.course) return [];
    return this.content.coursesByLanguage(this.course.language);
  }

  onLevelChange(slug: string): void {
    if (!this.course || slug === this.course.slug) return;
    this.router.navigate(['/curso', this.course.language, slug]);
  }

  toggleModule(i: number): void {
    this.openModuleIndex = this.openModuleIndex === i ? null : i;
  }

  toggleVideo(): void {
    const video = this.previewVideoRef?.nativeElement;
    if (!video) return;
    if (video.paused) {
      video.play();
      this.videoPlaying = true;
    } else {
      video.pause();
      this.videoPlaying = false;
    }
  }

  openEnrollmentModal(): void {
    this.showEnrollmentModal = true;
  }

  closeEnrollmentModal(): void {
    this.showEnrollmentModal = false;
  }
}