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
}

/** Convierte un código ISO2 ('PE', 'US', ...) en el emoji de bandera correspondiente. */
export function flagFromIso2(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

/**
 * Lista completa de países (ISO 3166-1 + código de marcado), para que
 * cualquier alumno pueda registrar su celular sin importar su país. Los
 * más usados por la academia van primero; el resto, en orden alfabético.
 */
export const COUNTRY_OPTIONS: CountryOption[] = [
  { iso2: 'PE', name: 'Perú', dialCode: '+51' },
  { iso2: 'CO', name: 'Colombia', dialCode: '+57' },
  { iso2: 'EC', name: 'Ecuador', dialCode: '+593' },
  { iso2: 'BO', name: 'Bolivia', dialCode: '+591' },
  { iso2: 'CL', name: 'Chile', dialCode: '+56' },
  { iso2: 'AR', name: 'Argentina', dialCode: '+54' },
  { iso2: 'MX', name: 'México', dialCode: '+52' },
  { iso2: 'VE', name: 'Venezuela', dialCode: '+58' },
  { iso2: 'BR', name: 'Brasil', dialCode: '+55' },
  { iso2: 'PY', name: 'Paraguay', dialCode: '+595' },
  { iso2: 'UY', name: 'Uruguay', dialCode: '+598' },
  { iso2: 'PA', name: 'Panamá', dialCode: '+507' },
  { iso2: 'CR', name: 'Costa Rica', dialCode: '+506' },
  { iso2: 'GT', name: 'Guatemala', dialCode: '+502' },
  { iso2: 'HN', name: 'Honduras', dialCode: '+504' },
  { iso2: 'SV', name: 'El Salvador', dialCode: '+503' },
  { iso2: 'NI', name: 'Nicaragua', dialCode: '+505' },
  { iso2: 'DO', name: 'República Dominicana', dialCode: '+1' },
  { iso2: 'ES', name: 'España', dialCode: '+34' },
  { iso2: 'US', name: 'Estados Unidos', dialCode: '+1' },
  { iso2: 'AF', name: 'Afganistán', dialCode: '+93' },
  { iso2: 'AL', name: 'Albania', dialCode: '+355' },
  { iso2: 'DE', name: 'Alemania', dialCode: '+49' },
  { iso2: 'AD', name: 'Andorra', dialCode: '+376' },
  { iso2: 'AO', name: 'Angola', dialCode: '+244' },
  { iso2: 'AI', name: 'Anguila', dialCode: '+1' },
  { iso2: 'AG', name: 'Antigua y Barbuda', dialCode: '+1' },
  { iso2: 'SA', name: 'Arabia Saudí', dialCode: '+966' },
  { iso2: 'DZ', name: 'Argelia', dialCode: '+213' },
  { iso2: 'AM', name: 'Armenia', dialCode: '+374' },
  { iso2: 'AW', name: 'Aruba', dialCode: '+297' },
  { iso2: 'AU', name: 'Australia', dialCode: '+61' },
  { iso2: 'AT', name: 'Austria', dialCode: '+43' },
  { iso2: 'AZ', name: 'Azerbaiyán', dialCode: '+994' },
  { iso2: 'BS', name: 'Bahamas', dialCode: '+1' },
  { iso2: 'BD', name: 'Bangladés', dialCode: '+880' },
  { iso2: 'BB', name: 'Barbados', dialCode: '+1' },
  { iso2: 'BH', name: 'Baréin', dialCode: '+973' },
  { iso2: 'BZ', name: 'Belice', dialCode: '+501' },
  { iso2: 'BJ', name: 'Benín', dialCode: '+229' },
  { iso2: 'BM', name: 'Bermudas', dialCode: '+1' },
  { iso2: 'BY', name: 'Bielorrusia', dialCode: '+375' },
  { iso2: 'BA', name: 'Bosnia y Herzegovina', dialCode: '+387' },
  { iso2: 'BW', name: 'Botsuana', dialCode: '+267' },
  { iso2: 'BN', name: 'Brunéi', dialCode: '+673' },
  { iso2: 'BG', name: 'Bulgaria', dialCode: '+359' },
  { iso2: 'BF', name: 'Burkina Faso', dialCode: '+226' },
  { iso2: 'BI', name: 'Burundi', dialCode: '+257' },
  { iso2: 'BT', name: 'Bután', dialCode: '+975' },
  { iso2: 'BE', name: 'Bélgica', dialCode: '+32' },
  { iso2: 'CV', name: 'Cabo Verde', dialCode: '+238' },
  { iso2: 'KH', name: 'Camboya', dialCode: '+855' },
  { iso2: 'CM', name: 'Camerún', dialCode: '+237' },
  { iso2: 'CA', name: 'Canadá', dialCode: '+1' },
  { iso2: 'BQ', name: 'Caribe neerlandés', dialCode: '+599' },
  { iso2: 'QA', name: 'Catar', dialCode: '+974' },
  { iso2: 'TD', name: 'Chad', dialCode: '+235' },
  { iso2: 'CZ', name: 'Chequia', dialCode: '+420' },
  { iso2: 'CN', name: 'China', dialCode: '+86' },
  { iso2: 'CY', name: 'Chipre', dialCode: '+357' },
  { iso2: 'VA', name: 'Ciudad del Vaticano', dialCode: '+39' },
  { iso2: 'KM', name: 'Comoras', dialCode: '+269' },
  { iso2: 'KP', name: 'Corea del Norte', dialCode: '+850' },
  { iso2: 'KR', name: 'Corea del Sur', dialCode: '+82' },
  { iso2: 'CI', name: 'Costa de Marfil', dialCode: '+225' },
  { iso2: 'HR', name: 'Croacia', dialCode: '+385' },
  { iso2: 'CU', name: 'Cuba', dialCode: '+53' },
  { iso2: 'CW', name: 'Curazao', dialCode: '+599' },
  { iso2: 'DK', name: 'Dinamarca', dialCode: '+45' },
  { iso2: 'DM', name: 'Dominica', dialCode: '+1' },
  { iso2: 'EG', name: 'Egipto', dialCode: '+20' },
  { iso2: 'AE', name: 'Emiratos Árabes Unidos', dialCode: '+971' },
  { iso2: 'ER', name: 'Eritrea', dialCode: '+291' },
  { iso2: 'SK', name: 'Eslovaquia', dialCode: '+421' },
  { iso2: 'SI', name: 'Eslovenia', dialCode: '+386' },
  { iso2: 'SS', name: 'Estado de Palestina', dialCode: '+970' },
  { iso2: 'EE', name: 'Estonia', dialCode: '+372' },
  { iso2: 'SZ', name: 'Esuatini', dialCode: '+268' },
  { iso2: 'ET', name: 'Etiopía', dialCode: '+251' },
  { iso2: 'PH', name: 'Filipinas', dialCode: '+63' },
  { iso2: 'FI', name: 'Finlandia', dialCode: '+358' },
  { iso2: 'FJ', name: 'Fiyi', dialCode: '+679' },
  { iso2: 'FR', name: 'Francia', dialCode: '+33' },
  { iso2: 'GA', name: 'Gabón', dialCode: '+241' },
  { iso2: 'GM', name: 'Gambia', dialCode: '+220' },
  { iso2: 'GE', name: 'Georgia', dialCode: '+995' },
  { iso2: 'GH', name: 'Ghana', dialCode: '+233' },
  { iso2: 'GI', name: 'Gibraltar', dialCode: '+350' },
  { iso2: 'GD', name: 'Granada', dialCode: '+1' },
  { iso2: 'GR', name: 'Grecia', dialCode: '+30' },
  { iso2: 'GL', name: 'Groenlandia', dialCode: '+299' },
  { iso2: 'GP', name: 'Guadalupe', dialCode: '+590' },
  { iso2: 'GU', name: 'Guam', dialCode: '+1' },
  { iso2: 'GG', name: 'Guernsey', dialCode: '+44' },
  { iso2: 'GN', name: 'Guinea', dialCode: '+224' },
  { iso2: 'GQ', name: 'Guinea Ecuatorial', dialCode: '+240' },
  { iso2: 'GW', name: 'Guinea-Bisáu', dialCode: '+245' },
  { iso2: 'GY', name: 'Guyana', dialCode: '+592' },
  { iso2: 'GF', name: 'Guyana Francesa', dialCode: '+594' },
  { iso2: 'HT', name: 'Haití', dialCode: '+509' },
  { iso2: 'NL', name: 'Países Bajos', dialCode: '+31' },
  { iso2: 'IN', name: 'India', dialCode: '+91' },
  { iso2: 'ID', name: 'Indonesia', dialCode: '+62' },
  { iso2: 'IQ', name: 'Irak', dialCode: '+964' },
  { iso2: 'IR', name: 'Irán', dialCode: '+98' },
  { iso2: 'IE', name: 'Irlanda', dialCode: '+353' },
  { iso2: 'BV', name: 'Isla Bouvet', dialCode: '+47' },
  { iso2: 'IM', name: 'Isla de Man', dialCode: '+44' },
  { iso2: 'CX', name: 'Isla de Navidad', dialCode: '+61' },
  { iso2: 'NF', name: 'Isla Norfolk', dialCode: '+672' },
  { iso2: 'IS', name: 'Islandia', dialCode: '+354' },
  { iso2: 'KY', name: 'Islas Caimán', dialCode: '+1' },
  { iso2: 'CC', name: 'Islas Cocos', dialCode: '+61' },
  { iso2: 'CK', name: 'Islas Cook', dialCode: '+682' },
  { iso2: 'FO', name: 'Islas Feroe', dialCode: '+298' },
  { iso2: 'FK', name: 'Islas Malvinas', dialCode: '+500' },
  { iso2: 'MP', name: 'Islas Marianas del Norte', dialCode: '+1' },
  { iso2: 'MH', name: 'Islas Marshall', dialCode: '+692' },
  { iso2: 'PN', name: 'Islas Pitcairn', dialCode: '+64' },
  { iso2: 'SB', name: 'Islas Salomón', dialCode: '+677' },
  { iso2: 'TC', name: 'Islas Turcas y Caicos', dialCode: '+1' },
  { iso2: 'UM', name: 'Islas Ultramarinas de EE. UU.', dialCode: '+1' },
  { iso2: 'VG', name: 'Islas Vírgenes Británicas', dialCode: '+1' },
  { iso2: 'VI', name: 'Islas Vírgenes de EE. UU.', dialCode: '+1' },
  { iso2: 'IL', name: 'Israel', dialCode: '+972' },
  { iso2: 'IT', name: 'Italia', dialCode: '+39' },
  { iso2: 'JM', name: 'Jamaica', dialCode: '+1' },
  { iso2: 'JP', name: 'Japón', dialCode: '+81' },
  { iso2: 'JE', name: 'Jersey', dialCode: '+44' },
  { iso2: 'JO', name: 'Jordania', dialCode: '+962' },
  { iso2: 'KZ', name: 'Kazajistán', dialCode: '+7' },
  { iso2: 'KE', name: 'Kenia', dialCode: '+254' },
  { iso2: 'KG', name: 'Kirguistán', dialCode: '+996' },
  { iso2: 'KI', name: 'Kiribati', dialCode: '+686' },
  { iso2: 'KW', name: 'Kuwait', dialCode: '+965' },
  { iso2: 'LA', name: 'Laos', dialCode: '+856' },
  { iso2: 'LS', name: 'Lesoto', dialCode: '+266' },
  { iso2: 'LV', name: 'Letonia', dialCode: '+371' },
  { iso2: 'LB', name: 'Líbano', dialCode: '+961' },
  { iso2: 'LR', name: 'Liberia', dialCode: '+231' },
  { iso2: 'LY', name: 'Libia', dialCode: '+218' },
  { iso2: 'LI', name: 'Liechtenstein', dialCode: '+423' },
  { iso2: 'LT', name: 'Lituania', dialCode: '+370' },
  { iso2: 'LU', name: 'Luxemburgo', dialCode: '+352' },
  { iso2: 'MO', name: 'Macao', dialCode: '+853' },
  { iso2: 'MK', name: 'Macedonia del Norte', dialCode: '+389' },
  { iso2: 'MG', name: 'Madagascar', dialCode: '+261' },
  { iso2: 'MY', name: 'Malasia', dialCode: '+60' },
  { iso2: 'MW', name: 'Malaui', dialCode: '+265' },
  { iso2: 'MV', name: 'Maldivas', dialCode: '+960' },
  { iso2: 'ML', name: 'Malí', dialCode: '+223' },
  { iso2: 'MT', name: 'Malta', dialCode: '+356' },
  { iso2: 'MA', name: 'Marruecos', dialCode: '+212' },
  { iso2: 'MQ', name: 'Martinica', dialCode: '+596' },
  { iso2: 'MU', name: 'Mauricio', dialCode: '+230' },
  { iso2: 'MR', name: 'Mauritania', dialCode: '+222' },
  { iso2: 'YT', name: 'Mayotte', dialCode: '+262' },
  { iso2: 'FM', name: 'Micronesia', dialCode: '+691' },
  { iso2: 'MD', name: 'Moldavia', dialCode: '+373' },
  { iso2: 'MC', name: 'Mónaco', dialCode: '+377' },
  { iso2: 'MN', name: 'Mongolia', dialCode: '+976' },
  { iso2: 'ME', name: 'Montenegro', dialCode: '+382' },
  { iso2: 'MS', name: 'Montserrat', dialCode: '+1' },
  { iso2: 'MZ', name: 'Mozambique', dialCode: '+258' },
  { iso2: 'MM', name: 'Myanmar (Birmania)', dialCode: '+95' },
  { iso2: 'NA', name: 'Namibia', dialCode: '+264' },
  { iso2: 'NR', name: 'Nauru', dialCode: '+674' },
  { iso2: 'NP', name: 'Nepal', dialCode: '+977' },
  { iso2: 'NE', name: 'Níger', dialCode: '+227' },
  { iso2: 'NG', name: 'Nigeria', dialCode: '+234' },
  { iso2: 'NU', name: 'Niue', dialCode: '+683' },
  { iso2: 'NO', name: 'Noruega', dialCode: '+47' },
  { iso2: 'NC', name: 'Nueva Caledonia', dialCode: '+687' },
  { iso2: 'NZ', name: 'Nueva Zelanda', dialCode: '+64' },
  { iso2: 'OM', name: 'Omán', dialCode: '+968' },
  { iso2: 'PK', name: 'Pakistán', dialCode: '+92' },
  { iso2: 'PW', name: 'Palaos', dialCode: '+680' },
  { iso2: 'PG', name: 'Papúa Nueva Guinea', dialCode: '+675' },
  { iso2: 'PF', name: 'Polinesia Francesa', dialCode: '+689' },
  { iso2: 'PL', name: 'Polonia', dialCode: '+48' },
  { iso2: 'PT', name: 'Portugal', dialCode: '+351' },
  { iso2: 'PR', name: 'Puerto Rico', dialCode: '+1' },
  { iso2: 'GB', name: 'Reino Unido', dialCode: '+44' },
  { iso2: 'CF', name: 'República Centroafricana', dialCode: '+236' },
  { iso2: 'CG', name: 'República del Congo', dialCode: '+242' },
  { iso2: 'CD', name: 'República Democrática del Congo', dialCode: '+243' },
  { iso2: 'RE', name: 'Reunión', dialCode: '+262' },
  { iso2: 'RW', name: 'Ruanda', dialCode: '+250' },
  { iso2: 'RO', name: 'Rumanía', dialCode: '+40' },
  { iso2: 'RU', name: 'Rusia', dialCode: '+7' },
  { iso2: 'EH', name: 'Sahara Occidental', dialCode: '+212' },
  { iso2: 'WS', name: 'Samoa', dialCode: '+685' },
  { iso2: 'AS', name: 'Samoa Americana', dialCode: '+1' },
  { iso2: 'BL', name: 'San Bartolomé', dialCode: '+590' },
  { iso2: 'KN', name: 'San Cristóbal y Nieves', dialCode: '+1' },
  { iso2: 'SM', name: 'San Marino', dialCode: '+378' },
  { iso2: 'MF', name: 'San Martín', dialCode: '+590' },
  { iso2: 'PM', name: 'San Pedro y Miquelón', dialCode: '+508' },
  { iso2: 'VC', name: 'San Vicente y las Granadinas', dialCode: '+1' },
  { iso2: 'SH', name: 'Santa Elena', dialCode: '+290' },
  { iso2: 'LC', name: 'Santa Lucía', dialCode: '+1' },
  { iso2: 'ST', name: 'Santo Tomé y Príncipe', dialCode: '+239' },
  { iso2: 'SN', name: 'Senegal', dialCode: '+221' },
  { iso2: 'RS', name: 'Serbia', dialCode: '+381' },
  { iso2: 'SC', name: 'Seychelles', dialCode: '+248' },
  { iso2: 'SL', name: 'Sierra Leona', dialCode: '+232' },
  { iso2: 'SG', name: 'Singapur', dialCode: '+65' },
  { iso2: 'SX', name: 'Sint Maarten', dialCode: '+1' },
  { iso2: 'SY', name: 'Siria', dialCode: '+963' },
  { iso2: 'SO', name: 'Somalia', dialCode: '+252' },
  { iso2: 'LK', name: 'Sri Lanka', dialCode: '+94' },
  { iso2: 'ZA', name: 'Sudáfrica', dialCode: '+27' },
  { iso2: 'SD', name: 'Sudán', dialCode: '+249' },
  { iso2: 'SE', name: 'Suecia', dialCode: '+46' },
  { iso2: 'CH', name: 'Suiza', dialCode: '+41' },
  { iso2: 'SR', name: 'Surinam', dialCode: '+597' },
  { iso2: 'TH', name: 'Tailandia', dialCode: '+66' },
  { iso2: 'TW', name: 'Taiwán', dialCode: '+886' },
  { iso2: 'TZ', name: 'Tanzania', dialCode: '+255' },
  { iso2: 'TJ', name: 'Tayikistán', dialCode: '+992' },
  { iso2: 'IO', name: 'Territorio Británico del Océano Índico', dialCode: '+246' },
  { iso2: 'TF', name: 'Territorios Australes Franceses', dialCode: '+262' },
  { iso2: 'TL', name: 'Timor Oriental', dialCode: '+670' },
  { iso2: 'TG', name: 'Togo', dialCode: '+228' },
  { iso2: 'TK', name: 'Tokelau', dialCode: '+690' },
  { iso2: 'TO', name: 'Tonga', dialCode: '+676' },
  { iso2: 'TT', name: 'Trinidad y Tobago', dialCode: '+1' },
  { iso2: 'TN', name: 'Túnez', dialCode: '+216' },
  { iso2: 'TM', name: 'Turkmenistán', dialCode: '+993' },
  { iso2: 'TR', name: 'Turquía', dialCode: '+90' },
  { iso2: 'TV', name: 'Tuvalu', dialCode: '+688' },
  { iso2: 'UA', name: 'Ucrania', dialCode: '+380' },
  { iso2: 'UG', name: 'Uganda', dialCode: '+256' },
  { iso2: 'UZ', name: 'Uzbekistán', dialCode: '+998' },
  { iso2: 'VU', name: 'Vanuatu', dialCode: '+678' },
  { iso2: 'WF', name: 'Wallis y Futuna', dialCode: '+681' },
  { iso2: 'YE', name: 'Yemen', dialCode: '+967' },
  { iso2: 'DJ', name: 'Yibuti', dialCode: '+253' },
  { iso2: 'ZM', name: 'Zambia', dialCode: '+260' },
  { iso2: 'ZW', name: 'Zimbabue', dialCode: '+263' },
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
  readonly flagOf = flagFromIso2;
  private docTypeId: number | null = null;

  readonly form = this.fb.group(
    {
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      // Acepta documentos de identidad de cualquier país (DNI, cédula,
      // pasaporte, CURP, etc.): letras, números, espacios y guiones,
      // entre 5 y 20 caracteres. Ya no se limita al DNI peruano de 8 dígitos.
      dni: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9](?:[A-Za-z0-9 .-]{3,18})[A-Za-z0-9]$/)]],
      email: ['', [Validators.required, Validators.email]],
      countryIso: ['FR', [Validators.required]],
      // Solo el número local (sin código de país); el '+código' se arma
      // con lo elegido en 'countryIso' al momento de enviar. El rango
      // 4-15 dígitos cubre los números de celular de cualquier país
      // (estándar internacional E.164).
      celular: ['', [Validators.required, Validators.pattern(/^[0-9]{4,15}$/)]],
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
