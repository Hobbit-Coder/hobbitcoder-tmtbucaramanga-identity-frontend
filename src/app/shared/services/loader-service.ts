import { Service, signal } from '@angular/core';

@Service()
export class LoaderService {
  public readonly isLoading = signal<boolean>(false);

  public show(): void {
    this.isLoading.set(true);
  }

  public hide(): void {
    this.isLoading.set(false);
  }
}
