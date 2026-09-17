import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { loadStripe, Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';
import { CrmApiService } from '../../core/crm-api.service';
import { environment } from '../../../environments/environment';

export interface StripeCartItem {
  product_id: number;
  product_type: number;
}

@Component({
  selector: 'app-stripe-checkout-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stripe-checkout-modal.component.html',
  styleUrl: './stripe-checkout-modal.component.css',
})
export class StripeCheckoutModalComponent implements OnInit {
  @Input({ required: true }) userId!: number;
  @Input({ required: true }) items: StripeCartItem[] = [];
  @Input() totalLabel = '';

  @Output() closed = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  @ViewChild('paymentElementRef') paymentElementRef!: ElementRef<HTMLDivElement>;

  readonly loadingForm = signal(true);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly paidSuccessfully = signal(false);

  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private paymentElement: StripePaymentElement | null = null;

  constructor(private crmApi: CrmApiService) {}

  ngOnInit(): void {
    this.crmApi.createStripePaymentIntent(this.userId, this.items).subscribe({
      next: async ({ clientSecret }) => {
        this.stripe = await loadStripe(environment.stripePublishableKey);
        if (!this.stripe) {
          this.errorMessage.set('No se pudo cargar el formulario de pago.');
          this.loadingForm.set(false);
          return;
        }

        this.elements = this.stripe.elements({ clientSecret });
        this.paymentElement = this.elements.create('payment');
        this.paymentElement.mount(this.paymentElementRef.nativeElement);
        this.loadingForm.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo iniciar el pago. Intenta nuevamente.');
        this.loadingForm.set(false);
      },
    });
  }

  async pagar(): Promise<void> {
    if (!this.stripe || !this.elements || this.submitting()) return;

    this.submitting.set(true);
    this.errorMessage.set(null);

    // 'redirect: if_required' mantiene todo dentro del modal para la
    // gran mayoría de tarjetas. Algunas tarjetas igual pueden requerir
    // una breve autenticación extra (3D Secure) por exigencia del banco
    // — eso lo maneja Stripe automáticamente si llega a hacer falta.
    const result = await this.stripe.confirmPayment({
      elements: this.elements,
      redirect: 'if_required',
    });

    if (result.error) {
      this.errorMessage.set(result.error.message ?? 'El pago fue rechazado. Intenta con otra tarjeta.');
      this.submitting.set(false);
      return;
    }

    if (result.paymentIntent?.status === 'succeeded') {
      this.paidSuccessfully.set(true);
      this.submitting.set(false);
      setTimeout(() => this.success.emit(), 1400);
    } else {
      this.errorMessage.set('El pago no se pudo confirmar. Intenta nuevamente.');
      this.submitting.set(false);
    }
  }

  close(): void {
    if (this.submitting()) return;
    this.closed.emit();
  }
}
