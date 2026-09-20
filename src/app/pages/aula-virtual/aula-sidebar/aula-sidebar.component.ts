import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type AulaSection = 'mis-cursos' | 'certificaciones' | 'marketplace' | 'examenes' | 'calendario';

interface SidebarItem {
  id: AulaSection;
  label: string;
}

@Component({
  selector: 'app-aula-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aula-sidebar.component.html',
  styleUrl: './aula-sidebar.component.css',
})
export class AulaSidebarComponent {
  @Input() active: AulaSection = 'mis-cursos';
  @Input() mobileOpen = false;
  @Output() sectionChange = new EventEmitter<AulaSection>();
  @Output() closeMobile = new EventEmitter<void>();

  // Colapsado por defecto (solo íconos). Al pasar el mouse por encima se
  // expande (con texto) y el contenido se achica; al sacar el mouse,
  // vuelve a colapsarse y el contenido se agranda de nuevo.
  readonly expanded = signal(false);

  readonly items: SidebarItem[] = [
    { id: 'mis-cursos', label: 'Mis Cursos' },
    { id: 'certificaciones', label: 'Certificaciones' },
    { id: 'marketplace', label: 'Marketplace' },
    { id: 'examenes', label: 'Exámenes' },
    { id: 'calendario', label: 'Calendario' },
  ];

  select(id: AulaSection): void {
    this.sectionChange.emit(id);
    this.closeMobile.emit();
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.expanded.set(true);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.expanded.set(false);
  }
}
