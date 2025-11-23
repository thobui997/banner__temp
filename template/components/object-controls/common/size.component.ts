import { Component, inject } from '@angular/core';
import { ControlContainer, ReactiveFormsModule } from '@angular/forms';
import { InputDirective, InputGroupComponent, InputNumberDirective } from '@gsf/ui';

@Component({
  selector: 'app-size',
  standalone: true,
  template: `
    <div class="grid grid-cols-2 gap-2">
      <gsf-input-group class="w-full" [appPrefix]="wPrefix">
        <input
          gsfInput
          gsfInputNumber
          [hasFormat]="false"
          appSize="sm"
          formControlName="width"
          class="w-full"
        />
      </gsf-input-group>

      <gsf-input-group class="w-full" [appPrefix]="hPrefix">
        <input
          gsfInput
          gsfInputNumber
          [hasFormat]="false"
          appSize="sm"
          formControlName="height"
          class="w-full"
        />
      </gsf-input-group>
    </div>

    <ng-template #wPrefix>
      <span class="text-text-tertiary">W</span>
    </ng-template>

    <ng-template #hPrefix>
      <span class="text-text-tertiary">H</span>
    </ng-template>
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
export class SizeComponent {}
