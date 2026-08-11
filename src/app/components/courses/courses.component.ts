import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../core/content.service';
import { ScrollRevealDirective } from '../../shared/scroll-reveal.directive';
import { CourseLanguage } from '../../core/models';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, RouterLink, ScrollRevealDirective],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.css',
})
export class CoursesComponent {
  selectedLanguage: CourseLanguage = 'frances';

  constructor(public content: ContentService) {}

  selectLanguage(lang: CourseLanguage): void {
    this.selectedLanguage = lang;
  }

  get filteredCourses() {
    return this.content.courses.filter((c) => c.language === this.selectedLanguage);
  }

  get sectionTitle(): string {
    const titles: Record<CourseLanguage, string> = {
      frances: 'Encuentra el nivel perfecto para tu aventura francesa',
      ingles: 'Encuentra el nivel perfecto para tu aventura en inglés',
      espanol: 'Encuentra el nivel perfecto para tu aventura en español',
    };
    return titles[this.selectedLanguage];
  }
}