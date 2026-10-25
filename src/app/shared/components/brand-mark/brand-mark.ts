import { NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';

/**
 * Logo original de TMT sobre su placa negra. No se recolorea ni se redibuja: en ambos temas se
 * muestra el mismo archivo.
 */
@Component({
  imports: [NgOptimizedImage],
  selector: 'app-brand-mark',
  template: `
    <span class="tmt-brand-plate" [style.width.px]="size()" [style.height.px]="size()">
      <img
        ngSrc="brand/logo-tmt-144.jpeg"
        [width]="size()"
        [height]="size()"
        [alt]="decorative() ? '' : 'TMT'"
        priority
      />
    </span>
  `,
})
export class BrandMark {
  public readonly size = input(44);

  /** Decorativo cuando el texto "TMT" ya aparece al lado (evita doble lectura). */
  public readonly decorative = input(false);
}
