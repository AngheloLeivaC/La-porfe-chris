import { Component, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrmApiService } from '../../../core/crm-api.service';
import {
  PASSWORD_MIN_LENGTH,
  differsFrom,
  normalizeBackendText,
  passwordsMatch,
} from '../../../shared/password-utils';
import { PasswordFieldComponent } from '../../../shared/password-field/password-field.component';
import { PasswordStrengthComponent } from '../../../shared/password-strength/password-strength.component';

/** Respuesta del backend (ya normalizada: sin tildes ni signos) cuando todo sale bien. */
const BACKEND_SUCCESS = 'cambio de contrasena exitoso';

@Component({
  selector: 'app-password-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PasswordFieldComponent, PasswordStrengthComponent],
  templateUrl: './password-panel.component.html',
  styleUrl: './password-panel.component.css',
})
export class PasswordPanelComponent {
  readonly loading = signal(false);
  readonly done = signal(false);
  readonly errorBanner = signal<string | null>(null);

  @ViewChild('actualField') private actualField?: PasswordFieldComponent;
  @ViewChild('newField') private newField?: PasswordFieldComponent;
  @ViewChild('repeatField') private repeatField?: PasswordFieldComponent;

  readonly form = this.fb.group(
    {
      // Sin minLength en la actual: una contraseña vieja podría ser más corta
      // que la regla actual y el alumno no podría cambiarla.
      actualPass: ['', [Validators.required]],
      newPass: ['', [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH)]],
      repeatPass: ['', [Validators.required]],
    },
    {
      validators: [
        passwordsMatch('newPass', 'repeatPass'),
        differsFrom('newPass', 'actualPass'),
      ],
    }
  );

  constructor(private fb: FormBuilder, private crmApi: CrmApiService) {}

  // ---------- Estado derivado para la plantilla ----------

  get newValue(): string {
    return this.form.controls.newPass.value ?? '';
  }

  /** "Repetir" ya tiene texto y no coincide (feedback en vivo, sin esperar al blur). */
  get mismatch(): boolean {
    return this.form.hasError('mismatch') && this.form.controls.repeatPass.dirty;
  }

  get matches(): boolean {
    const { newPass, repeatPass } = this.form.controls;
    return !!newPass.value && !!repeatPass.value && !this.form.hasError('mismatch');
  }

  get sameAsCurrent(): boolean {
    return this.form.hasError('sameAsCurrent') && this.form.controls.newPass.dirty;
  }

  newError(error: 'required' | 'minlength'): boolean {
    const c = this.form.controls.newPass;
    return c.touched && c.hasError(error);
  }

  get repeatRequired(): boolean {
    const c = this.form.controls.repeatPass;
    return c.touched && c.hasError('required');
  }

  // ---------- Acciones ----------

  submit(): void {
    if (this.loading()) return;

    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.focusFirstInvalid();
      return;
    }

    this.loading.set(true);
    this.errorBanner.set(null);

    const { actualPass, newPass, repeatPass } = this.form.getRawValue();

    this.crmApi
      .changePassword({
        actual_pass: actualPass!,
        new_pass: newPass!,
        repeat_pass: repeatPass!,
      })
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          // El backend responde 200 en todos los casos: hay que leer el texto.
          const text = normalizeBackendText(response);

          if (text === BACKEND_SUCCESS) {
            this.form.reset({ actualPass: '', newPass: '', repeatPass: '' });
            this.done.set(true);
          } else if (text.includes('contrasena actual')) {
            const actual = this.form.controls.actualPass;
            actual.setErrors({ wrong: true });
            actual.markAsTouched();
            this.actualField?.focus();
          } else {
            this.errorBanner.set(
              (response ?? '').trim() || 'No pudimos cambiar tu contraseña. Intenta de nuevo.'
            );
          }
        },
        error: () => {
          this.loading.set(false);
          this.errorBanner.set(
            'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.'
          );
        },
      });
  }

  again(): void {
    this.errorBanner.set(null);
    this.done.set(false);
  }

  private focusFirstInvalid(): void {
    const { actualPass, newPass } = this.form.controls;
    if (actualPass.invalid) this.actualField?.focus();
    else if (newPass.invalid || this.form.hasError('sameAsCurrent')) this.newField?.focus();
    else this.repeatField?.focus();
  }
}
