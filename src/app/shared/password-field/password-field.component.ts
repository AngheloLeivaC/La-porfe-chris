import { Component, ElementRef, Input, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

/**
 * Campo de contraseña reutilizable: ícono de candado, botón ojo para
 * mostrar/ocultar y estado de error. Los mensajes (errores, ayudas) se
 * proyectan desde el padre con <ng-content>.
 */
@Component({
  selector: 'app-password-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './password-field.component.html',
  styleUrl: './password-field.component.css',
})
export class PasswordFieldComponent {
  @Input({ required: true }) control!: FormControl<string | null>;
  @Input({ required: true }) inputId!: string;
  @Input() label = '';
  @Input() autocomplete = 'new-password';
  @Input() placeholder = 'Escribe tu contraseña';
  /** Para errores que viven en el grupo (ej. "no coinciden") y no en el control. */
  @Input() extraInvalid = false;

  @ViewChild('input') private input?: ElementRef<HTMLInputElement>;

  readonly visible = signal(false);

  get invalid(): boolean {
    return (this.control.invalid && this.control.touched) || this.extraInvalid;
  }

  toggle(): void {
    this.visible.update((v) => !v);
  }

  focus(): void {
    this.input?.nativeElement.focus();
  }
}
