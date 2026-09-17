import { Component, EventEmitter, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrmApiService } from '../../core/crm-api.service';

export interface RegisteredUser {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-register-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register-modal.component.html',
  styleUrl: './register-modal.component.css',
})
export class RegisterModalComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();
  @Output() registered = new EventEmitter<RegisteredUser>();

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  private docTypeId: number | null = null;

  readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellido: ['', [Validators.required, Validators.minLength(2)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    email: ['', [Validators.required, Validators.email]],
    celular: ['', [Validators.required, Validators.pattern(/^9\d{8}$/)]],
  });

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

  private generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    return pass;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);

    const { nombre, apellido, dni, email, celular } = this.form.getRawValue();
    const password = this.generatePassword();
    const fullName = `${nombre} ${apellido}`.trim();

    this.crmApi
      .registerAcademyUser({
        name: fullName,
        email: email!,
        phone: celular!,
        password,
        doc_type_id: this.docTypeId,
        number_doc: dni!,
        country: 'Perú',
        // Placeholder: este formulario simplificado no pide fecha de
        // nacimiento. Si tu tabla 'users' exige este campo, cámbialo por
        // un input real; por ahora se manda un valor por defecto.
        birthday: '2000-01-01',
      })
      .subscribe({
        next: (res) => {
          this.submitting.set(false);
          if (res.status === 'success' && res.data) {
            this.registered.emit({
              id: res.data.id,
              name: res.data.name,
              email: res.data.email,
            });
          } else {
            this.errorMessage.set(res.message || 'No se pudo completar el registro.');
          }
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(
            err?.error?.message || 'No se pudo completar el registro. Intenta nuevamente.'
          );
        },
      });
  }

  close(): void {
    if (this.submitting()) return;
    this.closed.emit();
  }
}
