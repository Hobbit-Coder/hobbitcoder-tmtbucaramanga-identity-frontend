import { Component } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-footer-component',
  styleUrl: './footer-component.scss',
  templateUrl: './footer-component.html',
})
export class FooterComponent {
  protected readonly year = new Date().getFullYear();
}
