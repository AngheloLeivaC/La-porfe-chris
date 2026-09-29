import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Largo mínimo que exige el aula virtual (mismo criterio que el CRM antiguo). */
export const PASSWORD_MIN_LENGTH = 8;

export interface PasswordCheck {
  id: 'length' | 'case' | 'digit' | 'symbol';
  label: string;
  /** true = se exige para poder guardar; false = solo se recomienda. */
  required: boolean;
  passed: boolean;
}

export type StrengthLevel = 'empty' | 'weak' | 'medium' | 'strong';

export interface PasswordEvaluation {
  checks: PasswordCheck[];
  level: StrengthLevel;
  label: string;
}

/**
 * Evalúa una contraseña para el medidor y la lista de requisitos.
 * Solo el largo mínimo bloquea el envío; el resto es una guía para el usuario.
 */
export function evaluatePassword(value: string): PasswordEvaluation {
  const v = value ?? '';
  const checks: PasswordCheck[] = [
    { id: 'length', label: `Mínimo ${PASSWORD_MIN_LENGTH} caracteres`, required: true, passed: v.length >= PASSWORD_MIN_LENGTH },
    { id: 'case', label: 'Mayúsculas y minúsculas', required: false, passed: /[a-z]/.test(v) && /[A-Z]/.test(v) },
    { id: 'digit', label: 'Al menos un número', required: false, passed: /\d/.test(v) },
    { id: 'symbol', label: 'Al menos un símbolo (! @ # $ …)', required: false, passed: /[^A-Za-z0-9]/.test(v) },
  ];

  if (!v) return { checks, level: 'empty', label: '' };

  const points = checks.filter((c) => c.passed).length + (v.length >= 12 ? 1 : 0);

  // Con menos del largo mínimo nunca puede pasar de "débil".
  if (!checks[0].passed || points <= 2) return { checks, level: 'weak', label: 'Débil' };
  if (points === 3) return { checks, level: 'medium', label: 'Media' };
  return { checks, level: 'strong', label: 'Fuerte' };
}

/** Error `mismatch` en el grupo si los dos campos tienen valor y no coinciden. */
export function passwordsMatch(newKey: string, repeatKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const a = group.get(newKey)?.value;
    const b = group.get(repeatKey)?.value;
    return a && b && a !== b ? { mismatch: true } : null;
  };
}

/** Error `sameAsCurrent` en el grupo si la nueva contraseña es igual a la actual. */
export function differsFrom(newKey: string, currentKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const a = group.get(newKey)?.value;
    const b = group.get(currentKey)?.value;
    return a && b && a === b ? { sameAsCurrent: true } : null;
  };
}

/** Quita tildes, signos y mayúsculas para comparar los textos que devuelve el backend. */
export function normalizeBackendText(text: string): string {
  return (text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/["!¡]/g, '')
    .toLowerCase()
    .trim();
}
