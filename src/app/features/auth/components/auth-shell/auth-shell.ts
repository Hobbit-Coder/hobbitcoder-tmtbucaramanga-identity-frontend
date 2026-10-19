import { NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';
import { BrandMark } from '@shared/components/brand-mark/brand-mark';
import { ThemeToggle } from '@shared/components/theme-toggle/theme-toggle';

/**
 * Contenedor de acceso: en escritorio, la marca negra con un mensaje breve a la izquierda y el
 * formulario (máximo 400 px) a la derecha; en móvil, una columna con el logo. Ingreso, primer ingreso y
 * recuperación comparten este contenedor.
 */
@Component({
  imports: [BrandMark, NgOptimizedImage, ThemeToggle],
  selector: 'app-auth-shell',
  template: `
    <main class="flex min-h-dvh items-stretch justify-center bg-canvas md:items-center md:p-8">
      <div
        [class]="showBrandPanel() ? 'max-w-5xl' : 'max-w-xl'"
        class="flex w-full overflow-hidden bg-surface md:min-h-[40rem] md:rounded-[var(--tmt-radius-panel)] md:border md:border-border-subtle"
      >
        @if (showBrandPanel()) {
          <aside
            class="hidden flex-col justify-center gap-8 bg-black px-12 py-16 text-white md:flex md:w-[45%]"
            aria-hidden="true"
          >
            <img
              ngSrc="brand/logo-tmt.jpeg"
              width="220"
              height="220"
              alt=""
              class="-ml-6"
              priority
            />
            <span class="h-0.5 w-12 bg-[#5eead4]"></span>
            <p class="m-0 text-5xl leading-[1.05] font-bold tracking-tight">
              Organiza.<br />Acompaña.<br />Conecta.
            </p>
            <p class="m-0 max-w-xs text-lg text-white/80">
              Una sola plataforma para tu ministerio. Personas, grupos, seguimientos y más.
            </p>
          </aside>
        }

        <section class="flex flex-1 flex-col px-4 py-6 sm:px-10 md:py-10">
          <div class="flex items-center justify-between gap-4">
            <span [class.md:invisible]="showBrandPanel()"><app-brand-mark [size]="48" /></span>
            <app-theme-toggle />
          </div>

          <div class="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-8">
            <ng-content />
          </div>
        </section>
      </div>
    </main>
  `,
})
export class AuthShell {
  /** El panel negro con la marca solo acompaña el ingreso; los demás pasos usan el logo pequeño. */
  public readonly showBrandPanel = input(true);
}
