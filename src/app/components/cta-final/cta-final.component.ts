import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ContentService } from '../../core/content.service';
import { ScrollRevealDirective } from '../../shared/scroll-reveal.directive';
import { CourseLanguage } from '../../core/models';

interface EnrollmentForm {
  name: string;
  email: string;
  language: CourseLanguage | '';
  courseTitle: string;
  message: string;
}

@Component({
  selector: 'app-cta-final',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollRevealDirective],
  templateUrl: './cta-final.component.html',
  styleUrl: './cta-final.component.css',
})
export class CtaFinalComponent {
  constructor(public content: ContentService) {}

  model: EnrollmentForm = {
    name: '',
    email: '',
    language: '',
    courseTitle: '',
    message: '',
  };

  submitted = false;

  // Cursos disponibles para el idioma elegido en el formulario. Se recalcula
  // solo (no hay que tocar nada más al agregar cursos nuevos en content.service.ts).
  get coursesForSelectedLanguage() {
    if (!this.model.language) return [];
    return this.content.courses.filter((c) => c.language === this.model.language);
  }

  onLanguageChange(): void {
    this.model.courseTitle = '';
  }

  // No hay backend todavía: al enviar, armamos el mensaje con los datos
  // del formulario y abrimos WhatsApp con todo pre-escrito. Cuando haya
  // un backend real, reemplazar esto por una llamada HTTP (por ejemplo
  // this.http.post('/api/inscripciones', this.model)).
 onSubmit(form: NgForm): void {
  if (form.invalid) {
    Object.values(form.controls).forEach((control) => control.markAsTouched());
    return;
  }

const lines = [
    '¡Hola! Quiero inscribirme',
    `Nombre: ${this.model.name}`,
    `Correo: ${this.model.email}`,
    this.model.language ? `Idioma: ${this.model.language}` : null,
    this.model.courseTitle ? `Curso: ${this.model.courseTitle}` : null,
    this.model.message ? `Mensaje: ${this.model.message}` : null,
  ].filter(Boolean);

    const message = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/${this.content.whatsappNumber}?text=${message}`, '_blank', 'noopener');

    this.submitted = true;
    form.resetForm();
  }
}