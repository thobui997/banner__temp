import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ControlContainer, ReactiveFormsModule } from '@angular/forms';
import { AppSelectComponent } from '@gsf/admin/app/shared/components/app-select/app-select.component';
import { fontFamily, fontSizes, fontWeights } from '../../../consts/text-font.const';

@Component({
  selector: 'app-text-font-properties',
  standalone: true,
  template: `
    <div class="flex flex-col gap-2">
      <app-select [options]="fontFamily" placeholder="Select font" formControlName="fontFamily" />
      <div class="grid grid-cols-2 gap-4">
        <app-select [options]="fontWeights" [hasShowTooltip]="true" formControlName="fontWeight" />
        <app-select [options]="fontSizes" formControlName="fontSize" />
      </div>
    </div>
  `,
  imports: [CommonModule, AppSelectComponent, ReactiveFormsModule],
  viewProviders: [
    {
      provide: ControlContainer,
      useFactory: () => inject(ControlContainer, { skipSelf: true })
    }
  ]
})
export class TextFontPropertiesComponent {
  fontFamily = fontFamily;
  fontWeights = fontWeights;
  fontSizes = fontSizes;
}
