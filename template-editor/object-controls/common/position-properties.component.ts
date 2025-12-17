import { Component, EventEmitter, inject, Output } from '@angular/core';
import { ControlContainer, ReactiveFormsModule } from '@angular/forms';
import { AlignmentType, TransformType } from '@gsf/admin/app/shared/types';
import {
  ICON_ALIGN_BOTTOM,
  ICON_ALIGN_HORIZONTALLY,
  ICON_ALIGN_LEFT,
  ICON_ALIGN_RIGHT,
  ICON_ALIGN_TOP,
  ICON_ALIGN_VERTICAL,
  ICON_FLIP_HORIZONTAL,
  ICON_FLIP_VERTICAL,
  ICON_ROTATE_RIGHT,
  ICON_ROTATION,
  IconSvgComponent,
  InputDirective,
  InputGroupComponent,
  InputNumberDirective
} from '@gsf/ui';

@Component({
  selector: 'app-position-properties',
  standalone: true,
  template: `
    <div class="grid grid-cols-2 gap-3" formGroupName="position">
      <!-- Horizontal Alignment -->
      <div
        class="grid grid-cols-3 place-items-center bg-fill-surface-container-secondary rounded-lg"
      >
        <button class="p-3 border-r-[2px] border-white" (click)="onAlign('left')">
          <gsf-icon-svg [icon]="ICON_ALIGN_LEFT" />
        </button>
        <button class="p-3 border-r-[2px] border-white" (click)="onAlign('center-h')">
          <gsf-icon-svg [icon]="ICON_ALIGN_HORIZONTALLY" />
        </button>
        <button class="p-3" (click)="onAlign('right')">
          <gsf-icon-svg [icon]="ICON_ALIGN_RIGHT" />
        </button>
      </div>

      <!-- Vertical Alignment -->
      <div
        class="grid grid-cols-3 place-items-center bg-fill-surface-container-secondary rounded-lg"
      >
        <button class="p-3 border-r-[2px] border-white" (click)="onAlign('top')">
          <gsf-icon-svg [icon]="ICON_ALIGN_TOP" />
        </button>
        <button class="p-3 border-r-[2px] border-white" (click)="onAlign('center-v')">
          <gsf-icon-svg [icon]="ICON_ALIGN_VERTICAL" />
        </button>
        <button class="p-3" (click)="onAlign('bottom')">
          <gsf-icon-svg [icon]="ICON_ALIGN_BOTTOM" />
        </button>
      </div>

      <!-- X Position -->
      <gsf-input-group [appPrefix]="xPrefix">
        <input
          gsfInput
          gsfInputNumber
          [hasFormat]="false"
          appSize="sm"
          formControlName="x"
          class="text-right"
          [allowNegative]="true"
        />
      </gsf-input-group>

      <!-- Y Position -->
      <gsf-input-group [appPrefix]="yPrefix">
        <input
          gsfInput
          gsfInputNumber
          [hasFormat]="false"
          appSize="sm"
          formControlName="y"
          class="text-right"
          [allowNegative]="true"
        />
      </gsf-input-group>

      <!-- Rotation -->
      <gsf-input-group [appPrefix]="rotationPrefix">
        <input
          gsfInput
          gsfInputNumber
          appSize="sm"
          formControlName="angle"
          [hasFormat]="false"
          [min]="0"
          [max]="360"
          class="text-right"
        />
      </gsf-input-group>

      <!-- Transform Controls -->
      <div
        class="grid grid-cols-3 place-items-center bg-fill-surface-container-secondary rounded-lg"
      >
        <button class="p-3 border-r-[2px] border-white" (click)="onTransform('rotate')">
          <gsf-icon-svg [icon]="ICON_ROTATE_RIGHT" />
        </button>
        <button class="p-3 border-r-[2px] border-white" (click)="onTransform('flip-h')">
          <gsf-icon-svg [icon]="ICON_FLIP_HORIZONTAL" />
        </button>
        <button class="p-3" (click)="onTransform('flip-v')">
          <gsf-icon-svg [icon]="ICON_FLIP_VERTICAL" />
        </button>
      </div>

      <ng-template #xPrefix>
        <span class="text-text-tertiary">X</span>
      </ng-template>

      <ng-template #yPrefix>
        <span class="text-text-tertiary">Y</span>
      </ng-template>

      <ng-template #rotationPrefix>
        <gsf-icon-svg [icon]="ICON_ROTATION" />
      </ng-template>
    </div>
  `,
  imports: [
    ReactiveFormsModule,
    IconSvgComponent,
    InputGroupComponent,
    InputDirective,
    InputNumberDirective
  ],
  viewProviders: [
    {
      provide: ControlContainer,
      useFactory: () => inject(ControlContainer, { skipSelf: true })
    }
  ]
})
export class PositionPropertiesComponent {
  @Output() align = new EventEmitter<AlignmentType>();
  @Output() transform = new EventEmitter<TransformType>();

  ICON_ALIGN_LEFT = ICON_ALIGN_LEFT;
  ICON_ALIGN_HORIZONTALLY = ICON_ALIGN_HORIZONTALLY;
  ICON_ALIGN_RIGHT = ICON_ALIGN_RIGHT;
  ICON_ALIGN_TOP = ICON_ALIGN_TOP;
  ICON_ALIGN_VERTICAL = ICON_ALIGN_VERTICAL;
  ICON_ALIGN_BOTTOM = ICON_ALIGN_BOTTOM;
  ICON_ROTATION = ICON_ROTATION;
  ICON_ROTATE_RIGHT = ICON_ROTATE_RIGHT;
  ICON_FLIP_HORIZONTAL = ICON_FLIP_HORIZONTAL;
  ICON_FLIP_VERTICAL = ICON_FLIP_VERTICAL;

  onAlign(type: AlignmentType) {
    this.align.emit(type);
  }

  onTransform(type: TransformType) {
    this.transform.emit(type);
  }
}
