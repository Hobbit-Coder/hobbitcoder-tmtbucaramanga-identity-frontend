import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderComponent } from '@shared/components/loader-component/loader-component';
import { ProgressBarComponent } from '@shared/components/progress-bar-component/progress-bar-component';

@Component({
  imports: [RouterOutlet, LoaderComponent, ProgressBarComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('hobbitcoder-tmtbucaramanga-identity');
}
