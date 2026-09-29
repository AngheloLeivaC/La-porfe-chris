import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PasswordEvaluation, evaluatePassword } from '../password-utils';

/**
 * Medidor de fortaleza y/o lista de requisitos en vivo.
 *  - 'meter'     → barra de 3 segmentos + etiqueta (junto al campo)
 *  - 'checklist' → lista de requisitos con check verde al cumplirse
 *  - 'both'      → ambos
 */
@Component({
  selector: 'app-password-strength',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './password-strength.component.html',
  styleUrl: './password-strength.component.css',
})
export class PasswordStrengthComponent implements OnChanges {
  @Input() value: string | null = '';
  @Input() show: 'meter' | 'checklist' | 'both' = 'both';

  result: PasswordEvaluation = evaluatePassword('');

  ngOnChanges(): void {
    this.result = evaluatePassword(this.value ?? '');
  }

  /** Cuántos segmentos de la barra se pintan (0–3). */
  get filled(): number {
    return { empty: 0, weak: 1, medium: 2, strong: 3 }[this.result.level];
  }
}
