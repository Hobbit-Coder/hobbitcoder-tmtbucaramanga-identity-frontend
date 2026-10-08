import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

/** Destino de `accessRoleGuard` cuando el usuario no tiene ninguno de los roles de la ruta. */
@Component({
  imports: [MatButtonModule, MatIconModule, RouterLink],
  selector: 'app-unauthorized-page',
  styleUrl: './unauthorized-page.scss',
  templateUrl: './unauthorized-page.html',
})
export class UnauthorizedPage {}
