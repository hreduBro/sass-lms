import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-filter-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-2.5">
      @if (title()) {
        <label class="text-xs font-bold text-text-primary block tracking-tight">
          {{ title() }}
        </label>
      }
      <ng-content></ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class FilterSectionComponent {
  title = input<string>('');
}
