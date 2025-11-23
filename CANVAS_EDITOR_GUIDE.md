# Canvas Editor - Hướng Dẫn Sử Dụng Chi Tiết

## 📋 Mục Lục

1. [Tổng Quan](#tổng-quan)
2. [Cài Đặt](#cài-đặt)
3. [Kiến Trúc](#kiến-trúc)
4. [Tính Năng](#tính-năng)
5. [Sử Dụng Components](#sử-dụng-components)
6. [API Reference](#api-reference)
7. [Testing](#testing)
8. [Best Practices](#best-practices)

---

## 🎯 Tổng Quan

Canvas Editor là một ứng dụng Angular + Fabric.js v6 cho phép tạo và chỉnh sửa các object trên canvas với đầy đủ tính năng:

### ✅ Tính Năng Đã Implement

- **✅ Thêm Objects**: Text, Image (từ URL hoặc File), Button
- **✅ Quản Lý Layers**: Drag & drop, toggle visibility, delete, select
- **✅ Undo/Redo**: Đầy đủ cho tất cả actions
- **✅ Reactive Forms**: Sync 2 chiều giữa form và canvas
- **✅ Frame Bắt Buộc**: Tỉ lệ 1:2 mặc định, có thể thay đổi (16:9, 4:3, 9:16, 1:1, custom)
- **✅ Object Constraints**: Không cho objects ra ngoài frame (với rotation support)
- **✅ Button Click Events**: Mở link khi click button

### 🏗️ Kiến Trúc

```
Angular Standalone Components
├── Services (DI)
│   ├── Canvas Services
│   ├── Object Services
│   ├── Layer Management
│   ├── Command Pattern (Undo/Redo)
│   ├── Frame Ratio Management
│   └── Image Upload
├── Components
│   ├── Canvas Workspace
│   ├── Layers Panel (CDK Drag & Drop)
│   ├── Frame Ratio Selector
│   └── Properties Panels
└── Types & Interfaces
```

---

## 📦 Cài Đặt

### 1. Dependencies

Đảm bảo các dependencies sau đã được cài đặt:

```json
{
  "dependencies": {
    "@angular/core": "^17.x",
    "@angular/common": "^17.x",
    "@angular/forms": "^17.x",
    "@angular/cdk": "^17.x",
    "fabric": "^6.x",
    "rxjs": "^7.x",
    "nanoid": "^5.x"
  }
}
```

### 2. Cài đặt Angular CDK (nếu chưa có)

```bash
npm install @angular/cdk
```

### 3. Import Required Modules

Trong `app.config.ts` hoặc module chính:

```typescript
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    // ... other providers
  ]
};
```

---

## 🏛️ Kiến Trúc Chi Tiết

### Services Architecture

#### 1. **CanvasFacadeService** (Facade Pattern)
```typescript
// template/services/canvas/canvas-facade.service.ts

// Unified API cho tất cả canvas operations
class CanvasFacadeService {
  // Canvas lifecycle
  initCanvas(element: HTMLCanvasElement, width: number, height: number): void
  disposeCanvas(): void

  // Object creation
  addFrame(width: number, height: number): void
  addText(text?: string, colorPreset?: Set<string>): void
  addImage(src: string): void
  addImageFromFile(file: File): void
  addButton(text?: string): void

  // Object updates
  updateObjectProperties(properties: Partial<CanvasObjectProperties>): void

  // Layer management
  syncLayers(): void
  selectLayer(layerId: string): void
  toggleLayerVisibility(layerId: string): void
  deleteLayer(layerId: string): void
  reorderLayers(previousIndex: number, currentIndex: number): void

  // Observables
  layers$: Observable<Layer[]>
  selectedObject$: Observable<FabricObject | null>
  selectedObjectProperties$: Observable<CanvasObjectProperties | null>
}
```

#### 2. **FrameRatioService** (Ratio Management)
```typescript
// template/services/frame/frame-ratio.service.ts

class FrameRatioService {
  // Change frame ratio và scale content
  changeFrameRatio(newRatioType: FrameRatioType, customDimensions?: FrameDimensions): void

  // Set custom dimensions
  setCustomDimensions(dimensions: FrameDimensions): void

  // Get available ratios
  getAllRatios(): FrameRatio[]

  // Observables
  currentRatio$: Observable<FrameRatioType>
  customDimensions$: Observable<FrameDimensions | null>
}
```

#### 3. **LayerManagementService** (Layer Operations)
```typescript
// template/services/layers/layer-management.service.ts

class LayerManagementService {
  // Sync layers from canvas
  syncLayers(): void

  // Layer operations
  selectLayer(layerId: string): void
  toggleVisibility(layerId: string): void
  deleteLayer(layerId: string): void
  reorderLayers(previousIndex: number, currentIndex: number): void

  // Observables
  layers$: Observable<Layer[]>
  selectedLayerId$: Observable<string | null>
}
```

#### 4. **CommandManagerService** (Undo/Redo)
```typescript
// template/services/command/command-manager.service.ts

class CommandManagerService {
  executeCommand(command: ICommand): void
  undo(): void
  redo(): void
  clear(): void

  // Observables
  canUndo$: Observable<boolean>
  canRedo$: Observable<boolean>
}
```

#### 5. **ImageUploadService** (File Upload)
```typescript
// template/services/image/image-upload.service.ts

class ImageUploadService {
  uploadImage(file: File): Observable<string>
  uploadMultipleImages(files: File[]): Observable<string[]>
  getAllowedTypesString(): string
  formatFileSize(bytes: number): string
}
```

### Commands (Command Pattern)

```typescript
// template/commands/

1. AddObjectCommand        - Add new object
2. DeleteObjectCommand     - Delete object
3. UpdatePropertiesCommand - Update object properties
4. MoveObjectCommand       - Move object
5. VisibilityToggleCommand - Toggle visibility (NEW)
6. ReorderLayersCommand    - Reorder layers (NEW)
7. CompositeCommand        - Multiple commands
```

---

## 🚀 Tính Năng Chi Tiết

### 1. Frame với Tỉ Lệ Động

#### Sử Dụng FrameRatioService

```typescript
import { FrameRatioService } from './services/frame/frame-ratio.service';

@Component({
  // ...
  providers: [FrameRatioService]
})
export class MyComponent {
  private ratioService = inject(FrameRatioService);

  changeToWidescreen(): void {
    // Thay đổi sang 16:9
    this.ratioService.changeFrameRatio('16:9');
  }

  changeToCustom(): void {
    // Custom dimensions
    this.ratioService.setCustomDimensions({
      width: 1024,
      height: 768
    });
  }
}
```

#### Tích Hợp Frame Ratio Selector Component

```typescript
// In your layout component

import { FrameRatioSelectorComponent } from './components/frame/frame-ratio-selector.component';
import { FrameRatioService } from './services/frame/frame-ratio.service';

@Component({
  selector: 'app-editor-layout',
  standalone: true,
  imports: [FrameRatioSelectorComponent],
  providers: [FrameRatioService],  // Important: Provide service
  template: `
    <div class="editor-sidebar">
      <app-frame-ratio-selector />
    </div>
  `
})
```

**Available Ratios:**
- `1:2` - Portrait (300x600) - Default
- `16:9` - Landscape (800x450)
- `4:3` - Standard (600x450)
- `9:16` - Mobile (450x800)
- `1:1` - Square (500x500)
- `custom` - User-defined

### 2. Upload Image từ Local

#### Sử Dụng ImageUploadService

```typescript
import { ImageUploadService } from './services/image/image-upload.service';

@Component({
  // ...
})
export class ImageUploadComponent {
  private uploadService = inject(ImageUploadService);
  private canvasService = inject(CanvasFacadeService);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.uploadService.uploadImage(file).subscribe({
        next: (dataUrl) => {
          // Add image to canvas
          this.canvasService.addImage(dataUrl);
        },
        error: (error) => {
          console.error('Upload failed:', error);
        }
      });
    }
  }
}
```

#### Template với File Input

```html
<input
  type="file"
  [accept]="uploadService.getAllowedTypesString()"
  (change)="onFileSelected($event)"
  hidden
  #fileInput
/>
<button (click)="fileInput.click()">Upload Image</button>
```

**Hoặc sử dụng direct method:**

```typescript
onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (file) {
    // Direct method - không cần upload service
    this.canvasService.addImageFromFile(file);
  }
}
```

### 3. Layers Panel với Drag & Drop

#### Tích Hợp Layers Panel

```typescript
import { LayersPanelComponent } from './components/layers/layers-panel.component';

@Component({
  selector: 'app-editor-layout',
  standalone: true,
  imports: [LayersPanelComponent],
  template: `
    <div class="editor-layout">
      <!-- Left sidebar -->
      <div class="sidebar-left">
        <!-- Template properties -->
      </div>

      <!-- Canvas workspace -->
      <div class="workspace">
        <app-template-canvas-workspace />
      </div>

      <!-- Right sidebar with Layers Panel -->
      <div class="sidebar-right">
        <app-layers-panel />
      </div>
    </div>
  `,
  styles: [`
    .editor-layout {
      display: flex;
      height: 100vh;
    }

    .sidebar-left,
    .sidebar-right {
      width: 300px;
      overflow-y: auto;
    }

    .workspace {
      flex: 1;
      overflow: hidden;
    }
  `]
})
```

**Layers Panel Features:**
- ✅ Drag & drop để reorder (Angular CDK)
- ✅ Toggle visibility (eye icon)
- ✅ Delete layer (trash icon)
- ✅ Select layer (click)
- ✅ Layer types: Text, Image, Button, Frame
- ✅ Frame luôn ở bottom, không thể move

### 4. Undo/Redo với Keyboard Shortcuts

Undo/Redo đã được wire trong `template-editor-header.component.ts`:

**Keyboard Shortcuts:**
- `Ctrl+Z` / `Cmd+Z` - Undo
- `Ctrl+Y` / `Cmd+Y` - Redo
- `Ctrl+Shift+Z` / `Cmd+Shift+Z` - Redo (alternative)

**Programmatic Usage:**

```typescript
import { CommandManagerService } from './services/command/command-manager.service';

@Component({
  // ...
})
export class MyComponent {
  private commandManager = inject(CommandManagerService);

  canUndo$ = this.commandManager.canUndo$;
  canRedo$ = this.commandManager.canRedo$;

  undo(): void {
    this.commandManager.undo();
  }

  redo(): void {
    this.commandManager.redo();
  }
}
```

**Available Commands:**
- Add/Delete objects
- Move objects
- Update properties
- Toggle visibility
- Reorder layers

### 5. Button Click Events

Buttons tự động có event handler. Khi user click vào button:
- Nếu button có `link`, sẽ mở URL trong tab mới
- URL tự động thêm `https://` nếu thiếu
- Security: `noopener,noreferrer` flags

#### Tạo Button với Link

```typescript
import { ObjectCreationService } from './services/objects/object-creation.service';

@Component({
  // ...
})
export class MyComponent {
  private objectCreation = inject(ObjectCreationService);

  addButtonWithLink(): void {
    // Note: addButton method cần được update để accept link parameter
    // hoặc update link sau khi tạo button
    this.canvasService.addButton('Visit Website');

    // Update link via properties
    this.canvasService.updateObjectProperties({
      type: 'button',
      customData: {
        metadata: {
          link: 'https://example.com'
        }
      }
    });
  }
}
```

### 6. Object Constraints (Figma-style Clamping)

Objects không thể move, scale, hoặc rotate ra ngoài frame:

#### Constraint Behaviors:

1. **Move**: Object bị clamp tại biên frame
2. **Scale**: Object không thể scale lớn hơn frame
3. **Rotate**: Bounding box của rotated object vẫn trong frame
4. **Frame Resize**: Objects tự động scale/reposition khi frame thay đổi

#### Customize Constraints

```typescript
import { ObjectConstraintService } from './services/objects/object-constraint.service';

@Component({
  // ...
})
export class MyComponent {
  private constraintService = inject(ObjectConstraintService);

  applyCustomConstraints(obj: FabricObject): void {
    // Apply frame constraints
    this.constraintService.applyFrameConstraints(obj);

    // Apply rotation constraints
    this.constraintService.applyRotationConstraints(obj);

    // Apply scale constraints
    this.constraintService.applyScaleConstraints(obj);
  }
}
```

### 7. Reactive Form Sync (2-way Binding)

Forms tự động sync với canvas:

#### Form → Canvas

```typescript
// In TextPropertiesComponent

protected setupFormSubscriptions(): void {
  // Debounced changes (300ms)
  this.formService.subscribeToChanges((formValues) => {
    if (!this.syncingFromCanvas) {
      const canvasProps = this.mapper.toCanvasProperties(formValues);
      this.updateObject(canvasProps);
    }
  });

  // Immediate changes (no debounce)
  this.formService.subscribeToImmediateChanges(
    ['textColor', 'textAlignment'],
    (formValues) => {
      if (!this.syncingFromCanvas) {
        this.updateObject({
          type: 'text',
          textColor: formValues.textColor,
          textAlignment: formValues.textAlignment
        });
      }
    }
  );
}
```

#### Canvas → Form

```typescript
protected setupCanvasSubscriptions(): void {
  this.baseService.subscribeToCanvasChanges<TextProperties, TextPropertiesFormValues>(
    this.form,
    'text',
    (canvasProps) => this.mapper.toFormValues(canvasProps),
    (canvasProps) => {
      // Custom logic khi receive properties
      if (canvasProps.customData?.colorPreset) {
        this.colorPresets = canvasProps.customData.colorPreset;
      }
    }
  );
}
```

**Prevent Circular Updates:**
- Sử dụng `syncingFromCanvas` flag
- Sử dụng `{ emitEvent: false }` khi patch form values

---

## 📚 API Reference

### CanvasFacadeService

```typescript
// Initialization
initCanvas(element: HTMLCanvasElement, width: number, height: number): void
disposeCanvas(): void

// Object Creation
addFrame(width: number, height: number): void
addText(text?: string, colorPreset?: Set<string>): void
addImage(src: string): void
addImageFromFile(file: File): void
addButton(text?: string): void

// Object Updates
updateObjectProperties(properties: Partial<CanvasObjectProperties>, skipRender?: boolean): void
updateImageProperties(properties: Partial<ImageProperties>, skipRender?: boolean): void
updateButtonProperties(properties: Partial<ButtonProperties>, skipRender?: boolean): void
updateFrameProperties(properties: Partial<FrameProperties>, skipRender?: boolean): void

// Layer Management
syncLayers(): void
selectLayer(layerId: string): void
toggleLayerVisibility(layerId: string): void
deleteLayer(layerId: string): void
reorderLayers(previousIndex: number, currentIndex: number): void

// Queries
getFrameBounds(): { left: number; top: number; width: number; height: number } | null
hasFrame(): boolean
getCanvasDimensions(): { width: number; height: number }
getCanvas(): Canvas

// Observables
readonly layers$: Observable<Layer[]>
readonly selectedObject$: Observable<FabricObject | null>
readonly selectedObjectProperties$: Observable<CanvasObjectProperties | null>
```

### FrameRatioService

```typescript
// Change Ratio
changeFrameRatio(newRatioType: FrameRatioType, customDimensions?: FrameDimensions): void
setCustomDimensions(dimensions: FrameDimensions): void

// Queries
getCurrentRatio(): FrameRatioType
getFrameRatio(type: FrameRatioType): FrameRatio
getAllRatios(): FrameRatio[]
calculateRatioFromDimensions(width: number, height: number): string

// Observables
readonly currentRatio$: Observable<FrameRatioType>
readonly customDimensions$: Observable<FrameDimensions | null>
```

### CommandManagerService

```typescript
// Command Execution
executeCommand(command: ICommand): void
undo(): void
redo(): void
clear(): void

// Observables
canUndo$: Observable<boolean>
canRedo$: Observable<boolean>
```

### ImageUploadService

```typescript
// Upload
uploadImage(file: File): Observable<string>
uploadMultipleImages(files: File[]): Observable<string[]>

// Utilities
getAllowedTypesString(): string
formatFileSize(bytes: number): string
```

---

## 🧪 Testing

### Unit Tests

#### Test FrameRatioService

```typescript
import { TestBed } from '@angular/core/testing';
import { FrameRatioService } from './frame-ratio.service';
import { CanvasStateService } from '../canvas/canvas-state.service';

describe('FrameRatioService', () => {
  let service: FrameRatioService;
  let canvasStateSpy: jasmine.SpyObj<CanvasStateService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('CanvasStateService', [
      'getCanvas',
      'getFrameObject',
      'updateFrameObject'
    ]);

    TestBed.configureTestingModule({
      providers: [
        FrameRatioService,
        { provide: CanvasStateService, useValue: spy }
      ]
    });

    service = TestBed.inject(FrameRatioService);
    canvasStateSpy = TestBed.inject(CanvasStateService) as jasmine.SpyObj<CanvasStateService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return all available ratios', () => {
    const ratios = service.getAllRatios();
    expect(ratios.length).toBe(6); // 1:2, 16:9, 4:3, 9:16, 1:1, custom
  });

  it('should calculate ratio from dimensions', () => {
    const ratio = service.calculateRatioFromDimensions(800, 450);
    expect(ratio).toBe('16:9');
  });
});
```

#### Test LayerManagementService

```typescript
import { TestBed } from '@angular/core/testing';
import { LayerManagementService } from './layer-management.service';

describe('LayerManagementService', () => {
  let service: LayerManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LayerManagementService]
    });
    service = TestBed.inject(LayerManagementService);
  });

  it('should sync layers from canvas', () => {
    service.syncLayers();
    // Verify layers are synced
  });

  it('should not allow frame layer deletion', () => {
    const canDelete = service.canDeleteLayer('frame-id');
    expect(canDelete).toBeFalse();
  });
});
```

### Manual Testing Checklist

#### ✅ Frame Ratio
- [ ] Khởi tạo frame 1:2 (300x600)
- [ ] Thay đổi sang 16:9 - content scale đúng
- [ ] Thay đổi sang 4:3 - content scale đúng
- [ ] Thay đổi sang custom (1024x768) - content scale đúng
- [ ] Objects vẫn trong frame sau khi đổi ratio

#### ✅ Image Upload
- [ ] Upload image từ file (< 5MB)
- [ ] Upload image lớn hơn 5MB - hiển thị error
- [ ] Upload file không phải image - hiển thị error
- [ ] Image fit vào frame sau upload
- [ ] Image center trong frame

#### ✅ Layers Panel
- [ ] Drag layer lên trên - object z-index thay đổi
- [ ] Drag layer xuống dưới - object z-index thay đổi
- [ ] Toggle visibility - object ẩn/hiện trên canvas
- [ ] Delete layer - object bị xóa khỏi canvas
- [ ] Click layer - object được select trên canvas
- [ ] Frame luôn ở cuối list
- [ ] Không thể drag frame

#### ✅ Undo/Redo
- [ ] Add object → Undo → object disappears
- [ ] Delete object → Undo → object reappears
- [ ] Move object → Undo → object về vị trí cũ
- [ ] Toggle visibility → Undo → visibility restored
- [ ] Reorder layers → Undo → order restored
- [ ] Keyboard shortcuts: Ctrl+Z, Ctrl+Y work

#### ✅ Object Constraints
- [ ] Move object tới edge - không thể ra ngoài frame
- [ ] Scale object quá lớn - bị limit bởi frame size
- [ ] Rotate object - bounding box vẫn trong frame
- [ ] Resize frame nhỏ hơn - objects tự động scale
- [ ] Resize frame lớn hơn - objects giữ nguyên position

#### ✅ Button Click
- [ ] Click button có link - mở URL trong tab mới
- [ ] Click button không có link - log "No link"
- [ ] Link không có https:// - tự động thêm
- [ ] Link mở với noopener,noreferrer

#### ✅ Reactive Form Sync
- [ ] Thay đổi text color trong form - object color updates
- [ ] Move object trên canvas - form position updates
- [ ] Rotate object trên canvas - form angle updates
- [ ] Scale object trên canvas - form width/height updates
- [ ] Không có circular updates (form ↔ canvas)

---

## ✨ Best Practices

### 1. Service Providers

**✅ DO:** Provide services at component level khi cần instance riêng

```typescript
@Component({
  // ...
  providers: [FrameRatioService, LayerManagementService]
})
export class EditorComponent {
  // Component có instance riêng của services
}
```

**❌ DON'T:** Provide singleton services nhiều nơi

### 2. Memory Management

**✅ DO:** Always unsubscribe observables

```typescript
@Component({
  // ...
})
export class MyComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.canvasService.layers$
      .pipe(takeUntil(this.destroy$))
      .subscribe(/* ... */);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**✅ DO:** Dispose canvas khi component destroy

```typescript
ngOnDestroy(): void {
  this.canvasService.disposeCanvas();
}
```

### 3. Command Pattern Usage

**✅ DO:** Sử dụng commands cho tất cả canvas operations

```typescript
// Good
const command = new AddObjectCommand(canvas, object);
this.commandManager.executeCommand(command);

// Bad
canvas.add(object);  // Không có undo/redo
```

### 4. Form Sync

**✅ DO:** Prevent circular updates với flag

```typescript
private syncingFromCanvas = false;

setupFormSubscriptions(): void {
  this.formService.subscribeToChanges((values) => {
    if (!this.syncingFromCanvas) {
      this.updateObject(values);
    }
  });
}

setupCanvasSubscriptions(): void {
  this.canvasService.selectedObjectProperties$.subscribe((props) => {
    this.syncingFromCanvas = true;
    this.form.patchValue(props, { emitEvent: false });
    this.syncingFromCanvas = false;
  });
}
```

### 5. Error Handling

**✅ DO:** Handle errors gracefully

```typescript
this.imageUploadService.uploadImage(file).subscribe({
  next: (dataUrl) => {
    this.canvasService.addImage(dataUrl);
  },
  error: (error) => {
    console.error('Upload failed:', error);
    this.showErrorMessage(error.message);
  }
});
```

---

## 🚀 Quick Start Example

### Complete Editor Setup

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CanvasFacadeService } from './services/canvas/canvas-facade.service';
import { FrameRatioService } from './services/frame/frame-ratio.service';
import { CommandManagerService } from './services/command/command-manager.service';
import { TemplateCanvasWorkspaceComponent } from './components/layouts/template-canvas-workspace.component';
import { LayersPanelComponent } from './components/layers/layers-panel.component';
import { FrameRatioSelectorComponent } from './components/frame/frame-ratio-selector.component';

@Component({
  selector: 'app-canvas-editor',
  standalone: true,
  imports: [
    TemplateCanvasWorkspaceComponent,
    LayersPanelComponent,
    FrameRatioSelectorComponent
  ],
  providers: [
    CanvasFacadeService,
    FrameRatioService,
    CommandManagerService
  ],
  template: `
    <div class="editor-container">
      <!-- Left Sidebar: Frame Ratio Selector -->
      <div class="sidebar-left">
        <app-frame-ratio-selector />
      </div>

      <!-- Center: Canvas Workspace -->
      <div class="workspace">
        <app-template-canvas-workspace />
      </div>

      <!-- Right Sidebar: Layers Panel -->
      <div class="sidebar-right">
        <app-layers-panel />
      </div>
    </div>
  `,
  styles: [`
    .editor-container {
      display: flex;
      height: 100vh;
      background: #f5f5f5;
    }

    .sidebar-left,
    .sidebar-right {
      width: 320px;
      background: white;
      overflow-y: auto;
      border-right: 1px solid #e5e7eb;
    }

    .workspace {
      flex: 1;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class CanvasEditorComponent implements OnInit, OnDestroy {
  private canvasService = inject(CanvasFacadeService);
  private commandManager = inject(CommandManagerService);

  ngOnInit(): void {
    // Canvas sẽ được init bởi TemplateCanvasWorkspaceComponent
  }

  ngOnDestroy(): void {
    this.canvasService.disposeCanvas();
    this.commandManager.clear();
  }
}
```

---

## 📝 Notes

### Known Limitations

1. **Rotation Constraints**: Complex rotated shapes có thể cần fine-tuning
2. **Frame Resize Performance**: Với nhiều objects, có thể lag khi resize frame
3. **Undo/Redo Stack**: Unlimited stack - cân nhắc add limit nếu cần

### Future Enhancements

1. **Multi-select**: Select multiple objects cùng lúc
2. **Grouping**: Group/ungroup objects
3. **Alignment Tools**: Align to center, distribute evenly
4. **Snapping**: Snap to grid, snap to objects
5. **Export**: Export to PNG, SVG, PDF
6. **Templates**: Save/load templates
7. **Collaboration**: Real-time collaborative editing

---

## 🆘 Troubleshooting

### Issue: Canvas không hiển thị

**Solution:**
```typescript
// Ensure CanvasFacadeService is provided
@Component({
  providers: [CanvasFacadeService]  // Add this
})
```

### Issue: Layers không update khi add object

**Solution:**
```typescript
// Call syncLayers sau khi add object
this.canvasService.addText();
this.canvasService.syncLayers();
```

### Issue: Undo/Redo không hoạt động

**Solution:**
```typescript
// Ensure sử dụng commands thay vì direct canvas operations
// Bad:
canvas.add(object);

// Good:
const command = new AddObjectCommand(canvas, object);
this.commandManager.executeCommand(command);
```

### Issue: Objects vượt ra ngoài frame

**Solution:**
```typescript
// Ensure ObjectConstraintService được inject và sử dụng
// Check CanvasEventHandlerService có wire constraints đúng không
```

---

## 📞 Support

Nếu có vấn đề hoặc câu hỏi:
1. Kiểm tra console logs
2. Verify tất cả services được provide đúng
3. Check network tab (nếu có image upload issues)
4. Review Angular CDK documentation cho drag & drop issues

---

## 🎉 Conclusion

Canvas Editor hiện đã có đầy đủ tính năng theo yêu cầu:
- ✅ Add objects (Text, Image, Button)
- ✅ Layer management với drag & drop
- ✅ Undo/Redo đầy đủ
- ✅ Reactive form sync 2 chiều
- ✅ Frame với dynamic aspect ratios
- ✅ Object constraints (Figma-style)
- ✅ Button click events

Enjoy coding! 🚀
