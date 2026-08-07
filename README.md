# La Profe Chris — Landing Page (Angular)

Landing page para una academia de francés, construida con **Angular 17 (standalone components)**, con animaciones al hacer scroll y un **chatbot** que redirige a WhatsApp o a la sección de inscripción.

## Estructura del proyecto

```
laprofechris-angular/
├── angular.json
├── package.json
├── src/
│   ├── index.html            # Incluye la fuente Google Fonts
│   ├── styles.css             # Variables de diseño (colores, tipografía) + animaciones globales
│   ├── main.ts                # Punto de entrada (bootstrap)
│   └── app/
│       ├── app.component.ts   # Componente raíz: compone todas las secciones
│       ├── app.config.ts      # Configuración de la app (providers)
│       ├── core/
│       │   ├── models.ts          # Interfaces TypeScript (Course, Testimonial, Faq, ChatStep...)
│       │   └── content.service.ts # TODO el contenido: textos, precios, imágenes y el flujo del chatbot
│       ├── shared/
│       │   └── scroll-reveal.directive.ts  # Directiva reutilizable: anima elementos al entrar en el viewport
│       └── components/
│           ├── header/            # Navbar fija + menú móvil
│           ├── hero/               # Sección principal con animaciones de entrada escalonadas
│           ├── value-props/        # 3 tarjetas de propuesta de valor (con scroll reveal)
│           ├── courses/            # Tarjetas de cursos A1 / A2 / B1 (con scroll reveal)
│           ├── about-me/           # Sección "Sobre mí"
│           ├── testimonials/       # Testimonios de alumnos
│           ├── faq/                # Acordeón de preguntas frecuentes
│           ├── cta-final/          # Llamado a la acción final (conectado a WhatsApp)
│           ├── footer/             # Pie de página
│           └── chatbot/            # 🤖 Widget de chat flotante con flujo conversacional
```

## Cómo correrlo

```bash
npm install
npm start
```
(`npm start` ejecuta `ng serve`)

Abre tu navegador en `http://localhost:4200`.

## Build de producción

```bash
npm run build
```

Genera los archivos listos para desplegar en `dist/laprofechris-angular/`.

## El Chatbot 🤖

- Está en `src/app/components/chatbot/`.
- Es un widget flotante (burbuja abajo a la derecha) con un flujo de conversación simple definido en `content.service.ts` → propiedad `chatFlow`.
- Cada paso del chat (`ChatStep`) tiene un mensaje del bot y varias opciones (`ChatOption`). Cada opción puede:
  - Llevar a otro paso de la conversación (`next`)
  - Ejecutar una acción (`action`): abrir WhatsApp con un mensaje predefinido (`whatsapp`), o hacer scroll suave hasta la sección de cursos (`scroll-cursos`) o inscripción (`scroll-inscripcion`)
- **Para editar las preguntas/respuestas del chatbot**, solo modifica el objeto `chatFlow` en `src/app/core/content.service.ts` — no hace falta tocar el componente.
- **Importante:** cambia el número de WhatsApp de prueba por el real del cliente en `content.service.ts`:
  ```ts
  readonly whatsappNumber = '51999999999'; // <-- reemplazar
  ```
  El formato debe ser código de país + número, sin espacios ni símbolos (ej. `51987654321`).

## Animaciones

- **Al cargar la página:** el Hero tiene una animación de entrada escalonada (fade + slide) definida directamente en `hero.component.css` con `@keyframes lpc-fade-up`.
- **Al hacer scroll:** las demás secciones usan la directiva `appScrollReveal` (en `shared/scroll-reveal.directive.ts`), que usa `IntersectionObserver` para detectar cuándo un elemento entra en el viewport y agregarle una animación de aparición. Se puede añadir a cualquier elemento nuevo así:
  ```html
  <div appScrollReveal [revealDelay]="100">...</div>
  ```
- Los badges flotantes del Hero tienen animaciones continuas (`lpc-bounce`, `lpc-pulse`) definidas en `styles.css`.

## Contenido editable

Todo el texto, precios e imágenes del sitio viven en **un solo archivo**: `src/app/core/content.service.ts`. Ideal para que el cliente pida cambios de textos/precios sin tocar el HTML de los componentes.

## Próximos pasos sugeridos

- Reemplazar las imágenes de placeholder (actualmente alojadas en Google) por las fotos reales del cliente.
- Configurar el número real de WhatsApp.
- Si el cliente pide más secciones (ej. blog, login de alumnos), se pueden agregar como nuevos componentes standalone dentro de `src/app/components/`.
