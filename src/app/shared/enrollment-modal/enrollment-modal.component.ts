import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ContentService } from '../../core/content.service';

@Component({
  selector: 'app-enrollment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './enrollment-modal.component.html',
  styleUrl: './enrollment-modal.component.css',
})
export class EnrollmentModalComponent {
  // Nombre del curso a inscribirse, se muestra de solo lectura en el formulario.
  @Input({ required: true }) courseTitle!: string;
  @Output() closed = new EventEmitter<void>();

  constructor(public content: ContentService) {}

  fullName = '';
  documentId = '';
  email = '';
  phone = '';
  proofFileName = '';
  submitted = false;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.proofFileName = input.files?.[0]?.name ?? '';
  }

  close(): void {
    this.closed.emit();
  }

  // No hay backend todavía: los archivos NO se pueden adjuntar automáticamente
  // a un link de WhatsApp (restricción de seguridad del navegador, no es algo
  // que se pueda evitar desde el código). Por eso armamos el mensaje con los
  // datos y le pedimos a la persona que adjunte la captura manualmente en el
  // chat que se abre. Cuando haya un backend real, este método se reemplaza
  // por un envío del formulario + el archivo a un endpoint propio.
  onSubmit(form: NgForm): void {
    if (form.invalid) {
      Object.values(form.controls).forEach((control) => control.markAsTouched());
      return;
    }

    const lines = [
      '¡Hola! Quiero confirmar mi inscripción 📝',
      `Curso: ${this.courseTitle}`,
      `Nombre: ${this.fullName}`,
      `Documento: ${this.documentId}`,
      `Correo: ${this.email}`,
      this.phone ? `Teléfono: ${this.phone}` : null,
      this.proofFileName
        ? `Ya hice el pago, adjunto mi comprobante (${this.proofFileName}) en este chat.`
        : 'Voy a enviar mi comprobante de pago en este chat.',
    ].filter(Boolean);

    const message = encodeURIComponent(lines.join('\n'));
    window.open(
      `https://wa.me/${this.content.whatsappNumber}?text=${message}`,
      '_blank',
      'noopener'
    );
     this.submitted = true;
  }
}
