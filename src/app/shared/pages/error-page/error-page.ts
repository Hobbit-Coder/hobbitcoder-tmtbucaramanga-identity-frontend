import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

/** Destino de los errores que no se pueden resolver en la página donde ocurrieron. */
@Component({
  imports: [MatButtonModule, MatIconModule, RouterLink],
  selector: 'app-error-page',
  styleUrl: './error-page.scss',
  templateUrl: './error-page.html',
})
export class ErrorPage {}
