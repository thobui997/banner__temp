import { Component, inject } from '@angular/core';
import { ControlContainer, ReactiveFormsModule } from '@angular/forms';
import { InputDirective, InputGroupComponent, InputNumberDirective } from '@gsf/ui';

@Component({
  selector: 'app-appearance',
  standalone: true,
  template: `
    <div class="grid grid-cols-2 gap-2">
      <gsf-input-group class="w-full" [appSuffix]="suffix">
        <input
          gsfInput
          gsfInputNumber
          appSize="sm"
          formControlName="opacity"
          class="w-full"
          [hasFormat]="false"
          [min]="0"
          [max]="100"
        />
      </gsf-input-group>

      <gsf-input-group class="w-full">
        <input
          gsfInput
          gsfInputNumber
          [hasFormat]="false"
          appSize="sm"
          formControlName="cornerRadius"
          class="w-full"
        />
      </gsf-input-group>
    </div>

    <ng-template #suffix> % </ng-template>
  `,
  imports: [
    ReactiveFormsModule,
    InputGroupComponent,
    InputDirective,
    InputNumberDirective,
    InputGroupComponent
  ],
  viewProviders: [
    {
      provide: ControlContainer,
      useFactory: () => inject(ControlContainer, { skipSelf: true })
    }
  ]
})
export class AppearanceComponent {}
