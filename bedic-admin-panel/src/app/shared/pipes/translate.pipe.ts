import { Pipe, PipeTransform, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { LanguageService } from '../../core/services/language.service';
import { Subscription } from 'rxjs';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private subscription: Subscription;

  constructor(
    private languageService: LanguageService,
    private cdr: ChangeDetectorRef
  ) {
    this.subscription = this.languageService.language$.subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  transform(key: string): string {
    if (!key) {
      return '';
    }
    return this.languageService.translate(key);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
