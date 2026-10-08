import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

/** Destino de las rutas que no existen. */
@Component({
  imports: [MatButtonModule, MatIconModule, RouterLink],
  selector: 'app-not-found-page',
  styleUrl: './not-found-page.scss',
  templateUrl: './not-found-page.html',
})
export class NotFoundPage {}
