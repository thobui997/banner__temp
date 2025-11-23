import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-property-section',
  standalone: true,
  template: `
    <div class="px-6">
      <span class="text-text-secondary text-sm font-medium mb-[6px] inline-block">
        {{ label }}
      </span>
      <ng-content></ng-content>
    </div>
  `,
  imports: [CommonModule]
})
export class PropertySectionComponent {
  @Input() label = '';
}
