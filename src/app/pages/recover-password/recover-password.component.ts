import { Component, ElementRef, OnDestroy, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CrmApiService } from '../../core/crm-api.service';
import { ContentService } from '../../core/content.service';
import {
  PASSWORD_MIN_LENGTH,
  normalizeBackendText,
  passwordsMatch,
} from '../../shared/password-utils';
import { PasswordFieldComponent } from '../../shared/password-field/password-field.component';
import { PasswordStrengthComponent } from '../../shared/password-strength/password-strength.component';

type Step = 'email' | 'reset' | 'done';

const CODE_LENGTH = 5;
const RESEND_SECONDS = 60;

/** Si el usuario viene del login con el correo ya escrito, lo recibimos por history.state. */
function emailFromNavigationState(): string {
  if (typeof history === 'undefined') return '';
  const email = history.state?.email;
  return typeof email === 'string' ? email : '';
}

@Component({
  selector: 'app-recover-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PasswordFieldComponent, PasswordStrengthComponent],
  templateUrl: './recover-password.component.html',
  styleUrl: './recover-password.component.css',
})
export class RecoverPasswordComponent implements OnDestroy {
  readonly codeLength = CODE_LENGTH;

  readonly step = signal<Step>('email');
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly infoMessage = signal<string | null>(null);
  /** Correo al que se envió el código (el que se usa en el paso 2). */
  readonly email = signal('');
  /** Segundos que faltan para poder reenviar el código. */
  readonly cooldown = signal(0);

  @ViewChild('emailInput') private emailInput?: ElementRef<HTMLInputElement>;
  @ViewChild('codeInput') private codeInput?: ElementRef<HTMLInputElement>;
  @ViewChild('passField') private passField?: PasswordFieldComponent;
  @ViewChild('confirmField') private confirmField?: PasswordFieldComponent;

  private timer: ReturnType<typeof setInterval> | null = null;

  readonly emailForm = this.fb.group({
    email: [emailFromNavigationState(), [Validators.required, Validators.email]],
  });

  readonly resetForm = this.fb.group(
    {
      code: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
      password: ['', [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH)]],
      confirm: ['', [Validators.required]],
    },
    { validators: [passwordsMatch('password', 'confirm')] }
  );

  constructor(
    private fb: FormBuilder,
    private crmApi: CrmApiService,
    private router: Router,
    public content: ContentService
  ) {}

  ngOnDestroy(): void {
    this.stopCooldown();
  }

  // ---------- Estado derivado para la plantilla ----------

  get emailInvalid(): boolean {
    const c = this.emailForm.controls.email;
    return c.invalid && c.touched;
  }

  get passwordValue(): string {
    return this.resetForm.controls.password.value ?? '';
  }

  get mismatch(): boolean {
    return this.resetForm.hasError('mismatch') && this.resetForm.controls.confirm.dirty;
  }

  get matches(): boolean {
    const { password, confirm } = this.resetForm.controls;
    return !!password.value && !!confirm.value && !this.resetForm.hasError('mismatch');
  }

  get codeInvalid(): boolean {
    const c = this.resetForm.controls.code;
    return c.invalid && c.touched;
  }

  passwordError(error: 'required' | 'minlength'): boolean {
    const c = this.resetForm.controls.password;
    return c.touched && c.hasError(error);
  }

  get confirmRequired(): boolean {
    const c = this.resetForm.controls.confirm;
    return c.touched && c.hasError('required');
  }

  // ---------- Paso 1: pedir el código ----------

  submitEmail(): void {
    if (this.loading()) return;

    const ctrl = this.emailForm.controls.email;
    if (ctrl.invalid) {
      ctrl.markAsTouched();
      this.emailInput?.nativeElement.focus();
      return;
    }
    this.requestCode((ctrl.value ?? '').trim(), false);
  }

  resend(): void {
    if (this.loading() || this.cooldown() > 0) return;
    this.requestCode(this.email(), true);
  }

  private requestCode(email: string, isResend: boolean): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    this.crmApi.sendRecoveryEmail(email).subscribe({
      next: (response) => {
        this.loading.set(false);
        // El backend responde 200 siempre; hay que leer el texto.
        const text = normalizeBackendText(response);

        if (text.includes('no registrado')) {
          this.errorMessage.set(
            'No encontramos ninguna cuenta con ese correo. Revisa que esté bien escrito.'
          );
        } else if (text.includes('enviado')) {
          this.email.set(email);
          this.startCooldown();
          if (isResend) {
            this.infoMessage.set('Te enviamos un código nuevo. El anterior ya no sirve.');
            this.resetForm.controls.code.reset('');
            this.focusLater(() => this.codeInput);
          } else {
            this.step.set('reset');
            this.focusLater(() => this.codeInput);
          }
        } else {
          this.errorMessage.set('No pudimos enviar el correo. Intenta de nuevo en un momento.');
        }
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set(
          'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.'
        );
      },
    });
  }

  backToEmail(): void {
    this.errorMessage.set(null);
    this.infoMessage.set(null);
    this.resetForm.reset({ code: '', password: '', confirm: '' });
    this.step.set('email');
    this.focusLater(() => this.emailInput);
  }

  // ---------- Paso 2: código + nueva contraseña ----------

  /** El código son solo dígitos: descarta letras/espacios (también al pegar). */
  onCodeInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const digits = el.value.replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (digits !== el.value) el.value = digits;
    this.resetForm.controls.code.setValue(digits);
  }

  submitReset(): void {
    if (this.loading()) return;

    this.resetForm.markAllAsTouched();
    if (this.resetForm.invalid) {
      this.focusFirstInvalid();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    const { code, password } = this.resetForm.getRawValue();

    this.crmApi
      .recoverPassword({ email: this.email(), code: code!, password: password! })
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          const text = normalizeBackendText(response);

          if (text.includes('reestablecida')) {
            this.stopCooldown();
            this.resetForm.reset({ code: '', password: '', confirm: '' });
            this.step.set('done');
          } else if (text.includes('maximo de intentos')) {
            // El código quedó bloqueado: hay que pedir uno nuevo desde el paso 1.
            this.resetForm.reset({ code: '', password: '', confirm: '' });
            this.step.set('email');
            this.errorMessage.set(
              'Superaste el máximo de intentos. Pide un código nuevo para continuar.'
            );
          } else if (text.includes('incorrecto')) {
            const match = /intentos restantes:\s*(\d+)/.exec(text);
            const left = match ? Number(match[1]) : null;
            const detail =
              left === null ? '' : left === 1 ? ' Te queda 1 intento.' : ` Te quedan ${left} intentos.`;
            this.errorMessage.set(`El código no es correcto.${detail}`);
            this.resetForm.controls.code.reset('');
            this.focusLater(() => this.codeInput);
          } else if (text.includes('no esta registrado')) {
            this.step.set('email');
            this.errorMessage.set('Ese correo ya no está registrado. Revisa que esté bien escrito.');
          } else {
            this.errorMessage.set(
              (response ?? '').trim() || 'No pudimos restablecer tu contraseña. Intenta de nuevo.'
            );
          }
        },
        error: () => {
          this.loading.set(false);
          this.errorMessage.set(
            'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.'
          );
        },
      });
  }

  goToLogin(): void {
    // Llevamos el correo para que el login ya lo tenga escrito.
    this.router.navigate(['/login'], { state: { email: this.email() } });
  }

  // ---------- Utilidades ----------

  private focusFirstInvalid(): void {
    const { code, password } = this.resetForm.controls;
    if (code.invalid) this.codeInput?.nativeElement.focus();
    else if (password.invalid) this.passField?.focus();
    else this.confirmField?.focus();
  }

  private focusLater(target: () => ElementRef<HTMLInputElement> | undefined): void {
    // El campo puede no existir aún (lo crea un *ngIf): esperamos al siguiente ciclo.
    setTimeout(() => target()?.nativeElement.focus(), 0);
  }

  private startCooldown(): void {
    this.stopCooldown();
    this.cooldown.set(RESEND_SECONDS);
    this.timer = setInterval(() => {
      const next = this.cooldown() - 1;
      this.cooldown.set(Math.max(next, 0));
      if (next <= 0) this.stopCooldown(false);
    }, 1000);
  }

  private stopCooldown(resetCounter = true): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (resetCounter) this.cooldown.set(0);
  }
}
