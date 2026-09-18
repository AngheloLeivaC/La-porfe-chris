import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { CrmApiService } from '../../core/crm-api.service';
import { Course } from '../../core/models';

/**
 * Datos del paso 1 (formulario de registro), todavía SIN persistir en el
 * backend. Se guardan solo en memoria hasta que el pago del paso 2 se
 * confirme: recién ahí el backend crea la cuenta real (ver
 * stripe-checkout-modal.component.ts y create-payment-intent en la API).
 */
export interface PendingRegistration {
  name: string;
  email: string;
  phone: string;
  password: string;
  doc_type_id: number | null;
  number_doc: string;
  country: string;
  birthday: string;
}

export interface CountryOption {
  iso2: string;
  name: string;
  dialCode: string;
  flag: string;
}

/**
 * Lista corta de países (los más relevantes para el público de la
 * academia). Se usa solo para el selector de código de celular; si más
 * adelante necesitas la lista completa, el backend ya expone
 * '/public/listCountry' (ver CrmApiService.listCountry).
 */
export const COUNTRY_OPTIONS: CountryOption[] = [
  { iso2: 'PE', name: 'Perú', dialCode: '+51', flag: '🇵🇪' },
  { iso2: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
  { iso2: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨' },
  { iso2: 'BO', name: 'Bolivia', dialCode: '+591', flag: '🇧🇴' },
  { iso2: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  { iso2: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { iso2: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽' },
  { iso2: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪' },
  { iso2: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷' },
  { iso2: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾' },
  { iso2: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾' },
  { iso2: 'PA', name: 'Panamá', dialCode: '+507', flag: '🇵🇦' },
  { iso2: 'CR', name: 'Costa Rica', dialCode: '+506', flag: '🇨🇷' },
  { iso2: 'GT', name: 'Guatemala', dialCode: '+502', flag: '🇬🇹' },
  { iso2: 'HN', name: 'Honduras', dialCode: '+504', flag: '🇭🇳' },
  { iso2: 'SV', name: 'El Salvador', dialCode: '+503', flag: '🇸🇻' },
  { iso2: 'NI', name: 'Nicaragua', dialCode: '+505', flag: '🇳🇮' },
  { iso2: 'DO', name: 'República Dominicana', dialCode: '+1', flag: '🇩🇴' },
  { iso2: 'ES', name: 'España', dialCode: '+34', flag: '🇪🇸' },
  { iso2: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
];

/** Exige que 'password' y 'confirmPassword' sean iguales. */
function passwordsMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword
      ? { passwordMismatch: true }
      : null;
  };
}

@Component({
  selector: 'app-register-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register-modal.component.html',
  styleUrl: './register-modal.component.css',
})
export class RegisterModalComponent implements OnInit {
  @Input() course: Course | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() registered = new EventEmitter<PendingRegistration>();

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly countries = COUNTRY_OPTIONS;
  private docTypeId: number | null = null;

  readonly form = this.fb.group(
    {
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      email: ['', [Validators.required, Validators.email]],
      countryIso: ['PE', [Validators.required]],
      // Solo el número local (sin código de país); el '+código' se arma
      // con lo elegido en 'countryIso' al momento de enviar.
      celular: ['', [Validators.required, Validators.pattern(/^[0-9]{5,12}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator() }
  );

  constructor(private fb: FormBuilder, private crmApi: CrmApiService) {}

  ngOnInit(): void {
    // Trae el ID real de "DNI" del catálogo de tipos de documento, en vez
    // de asumir un número fijo (puede variar entre entornos).
    this.crmApi.listDocumentTypes().subscribe({
      next: (types) => {
        const dni = types.find((t) => t.name.toUpperCase().includes('DNI'));
        this.docTypeId = dni ? dni.id : types[0]?.id ?? null;
      },
      error: () => {
        // Si falla, se sigue intentando registrar sin doc_type_id; el
        // backend simplemente lo guardará vacío.
      },
    });
  }

  // Paso 1: solo valida el formulario y pasa los datos al paso 2 (pago).
  // IMPORTANTE: aquí NO se llama al backend ni se crea la cuenta todavía.
  // La cuenta se crea recién cuando Stripe confirma el pago (ver
  // stripe-checkout-modal + webhook en el backend). Así evitamos guardar
  // usuarios que nunca llegan a pagar.
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);

    const { nombre, apellido, dni, email, celular, password, countryIso } = this.form.getRawValue();
    const fullName = `${nombre} ${apellido}`.trim();
    const country = this.countries.find((c) => c.iso2 === countryIso) ?? this.countries[0];

    this.registered.emit({
      name: fullName,
      email: email!,
      phone: `${country.dialCode}${celular}`,
      password: password!,
      doc_type_id: this.docTypeId,
      number_doc: dni!,
      country: country.name,
      // Placeholder: este formulario simplificado no pide fecha de
      // nacimiento. Si tu tabla 'users' exige este campo, cámbialo por
      // un input real; por ahora se manda un valor por defecto.
      birthday: '2000-01-01',
    });
  }

  close(): void {
    if (this.submitting()) return;
    this.closed.emit();
  }
}
