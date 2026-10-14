import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

/**
 * Entrada desde el panel admin (botón "Ver aula").
 * URL: /redirect/<JSON urlencoded> = [email, password, destino, ...]
 * Inicia sesión automáticamente y manda al aula virtual.
 */
@Component({
  selector: 'app-redirect',
  standalone: true,
  template: `<p style="text-align:center;margin-top:20vh;font-family:sans-serif">Abriendo aula virtual…</p>`,
})
export class RedirectComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('data') ?? '';
    let data: any[] = [];
    try {
      data = JSON.parse(raw);
    } catch {
      try {
        data = JSON.parse(decodeURIComponent(raw.replace(/\+/g, ' ')));
      } catch {
        this.router.navigate(['/login']);
        return;
      }
    }

    const [email, password, destination, slugProduct, slugClass] = data;
    if (!email || !password) {
      this.router.navigate(['/login']);
      return;
    }

    this.auth.loginRedirect(email, password).subscribe({
      next: () => {
        if (destination === 'preview' && slugProduct && slugClass && slugClass !== 'No hay clases') {
          this.router.navigate(['/aula-virtual/curso', slugProduct, slugClass]);
        } else {
          this.router.navigate(['/aula-virtual']);
        }
      },
      error: () => this.router.navigate(['/login']),
    });
  }
}
