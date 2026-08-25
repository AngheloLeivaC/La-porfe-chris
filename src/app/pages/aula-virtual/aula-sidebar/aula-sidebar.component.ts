import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AulaSection = 'mis-cursos' | 'certificaciones' | 'marketplace' | 'inicio' | 'calendario' | 'configuracion';

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

  readonly items: SidebarItem[] = [
    { id: 'mis-cursos', label: 'Mis Cursos' },
    { id: 'certificaciones', label: 'Certificaciones' },
    { id: 'marketplace', label: 'Marketplace' },
    { id: 'inicio', label: 'Inicio' },
    { id: 'calendario', label: 'Calendario' },
    { id: 'configuracion', label: 'Configuración' },
  ];

  select(id: AulaSection): void {
    this.sectionChange.emit(id);
    this.closeMobile.emit();
  }
}
