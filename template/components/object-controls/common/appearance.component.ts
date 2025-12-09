import { Component, inject } from '@angular/core';
import { ControlContainer, ReactiveFormsModule } from '@angular/forms';
import {
  ICON_MAXIMIZE_2,
  ICON_OPACITY,
  IconSvgComponent,
  InputDirective,
  InputGroupComponent,
  InputNumberDirective
} from '@gsf/ui';

@Component({
  selector: 'app-appearance',
  standalone: true,
  template: `
    <div class="grid grid-cols-2 gap-2">
      <gsf-input-group class="w-full" [appSuffix]="suffix" [appPrefix]="opacity">
        <input
          gsfInput
          gsfInputNumber
          appSize="sm"
          formControlName="opacity"
          class="w-full text-right"
          [hasFormat]="false"
          [min]="0"
          [max]="100"
        />
      </gsf-input-group>

      <gsf-input-group class="w-full" [appPrefix]="radius">
        <input
          gsfInput
          gsfInputNumber
          appSize="sm"
          formControlName="cornerRadius"
          class="w-full text-right"
          [hasFormat]="false"
          [min]="0"
        />
      </gsf-input-group>
    </div>

    <ng-template #suffix> % </ng-template>

    <ng-template #opacity>
      <gsf-icon-svg [icon]="ICON_OPACITY" />
    </ng-template>

    <ng-template #radius>
      <gsf-icon-svg [icon]="ICON_MAXIMIZE_2" />
    </ng-template>
  `,
  imports: [
    ReactiveFormsModule,
    InputGroupComponent,
    InputDirective,
    InputNumberDirective,
    InputGroupComponent,
    IconSvgComponent
  ],
  viewProviders: [
    {
      provide: ControlContainer,
      useFactory: () => inject(ControlContainer, { skipSelf: true })
    }
  ]
})
export class AppearanceComponent {
  ICON_OPACITY = ICON_OPACITY;
  ICON_MAXIMIZE_2 = ICON_MAXIMIZE_2;
}
