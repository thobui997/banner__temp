import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ControlContainer, ReactiveFormsModule } from '@angular/forms';
import { AppSelectComponent } from '@gsf/admin/app/shared/components/app-select/app-select.component';
import { fontFamily, fontSizes } from '@gsf/admin/app/shared/consts';
import { FontWeightManagerService } from '@gsf/admin/app/shared/services/font-weight-manager.service';
import { Option } from '@gsf/ui';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-text-font-properties',
  standalone: true,
  template: `
    <div class="flex flex-col gap-2">
      <app-select [options]="fontFamily" placeholder="Select font" formControlName="fontFamily" />
      <div class="grid [grid-template-columns:2fr_1fr] gap-4">
        <app-select
          formControlName="fontWeight"
          [options]="availableFontWeights"
          [hasShowTooltip]="true"
          [showSearchOrCheck]="false"
        />
        <app-select [options]="fontSizes" formControlName="fontSize" [showSearchOrCheck]="false" />
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
export class TextFontPropertiesComponent implements OnInit, OnDestroy {
  private fontWeightManager = inject(FontWeightManagerService);
  private controlContainer = inject(ControlContainer, { skipSelf: true });
  private destroy$ = new Subject<void>();

  fontFamily = fontFamily;
  fontSizes = fontSizes;
  availableFontWeights: Option<number>[] = [];

  ngOnInit(): void {
    const parentForm = this.controlContainer.control;
    if (!parentForm) return;

    const fontFamilyControl = parentForm.get('fontFamily');
    const fontWeightControl = parentForm.get('fontWeight');

    if (!fontFamilyControl || !fontWeightControl) return;

    // Initialize weights based on current font family
    const currentFontFamily = fontFamilyControl.value?.[0]?.value || fontFamily[0].value;
    this.updateAvailableWeights(currentFontFamily, fontWeightControl.value?.[0]?.value);

    // Listen to font family changes
    fontFamilyControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value: Option<string>[]) => {
        if (value && value.length > 0) {
          const selectedFont = value[0].value;
          const currentWeight = fontWeightControl.value?.[0]?.value;
          this.updateAvailableWeights(selectedFont, currentWeight);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateAvailableWeights(fontFamily: string, currentWeight?: number): void {
    this.availableFontWeights = this.fontWeightManager.getAvailableWeights(fontFamily);

    if (currentWeight) {
      const isAvailable = this.fontWeightManager.isWeightAvailable(fontFamily, currentWeight);

      if (!isAvailable) {
        const closestWeight = this.fontWeightManager.getClosestAvailableWeight(
          fontFamily,
          currentWeight
        );

        const parentForm = this.controlContainer.control;
        const fontWeightControl = parentForm?.get('fontWeight');

        if (fontWeightControl) {
          const newWeightOption = this.availableFontWeights.find((w) => w.value === closestWeight);
          if (newWeightOption) {
            fontWeightControl.setValue([newWeightOption], { emitEvent: true });
          }
        }
      }
    }
  }
}
