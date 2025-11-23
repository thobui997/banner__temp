# Canvas Editor - Angular + Fabric.js v6

> Professional Canvas Editor với đầy đủ tính năng quản lý layers, undo/redo, và dynamic frame ratios.

## ✨ Features

### Core Features
- ✅ **Add Objects**: Text (editable), Image (URL/File upload), Button (clickable)
- ✅ **Object Operations**: Select, Move, Scale, Rotate với Fabric.js controls
- ✅ **Layer Management**:
  - Danh sách layers realtime
  - Drag & Drop reordering (Angular CDK)
  - Toggle visibility
  - Delete layers
  - Select by click
- ✅ **Undo/Redo**: Command Pattern cho all actions (add, delete, move, scale, rotate, visibility, reorder)
- ✅ **Reactive Forms**: 2-way sync giữa form controls và canvas objects
- ✅ **Frame System**:
  - Bắt buộc có frame nền
  - Tỉ lệ mặc định 1:2 (width:height)
  - Thay đổi tỉ lệ: 1:2, 16:9, 4:3, 9:16, 1:1, custom
  - Auto-scale content khi thay đổi frame ratio
- ✅ **Object Constraints**: Objects không thể ra ngoài frame (Figma-style clamping)
- ✅ **Button Events**: Click buttons để navigate links

### Architecture
- **Angular 17+**: Standalone components
- **Fabric.js v6**: Canvas rendering
- **RxJS**: Reactive state management
- **Angular CDK**: Drag & Drop
- **Command Pattern**: Undo/Redo system
- **SOLID Principles**: Clean architecture
- **DRY**: Code reusability

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install @angular/cdk fabric rxjs nanoid
```

### 2. Setup Providers

```typescript
// In your main editor component
import { CanvasFacadeService } from './template/services/canvas/canvas-facade.service';
import { FrameRatioService } from './template/services/frame/frame-ratio.service';
import { CommandManagerService } from './template/services/command/command-manager.service';

@Component({
  selector: 'app-editor',
  standalone: true,
  providers: [
    CanvasFacadeService,
    FrameRatioService,
    CommandManagerService
  ],
  // ...
})
export class EditorComponent {}
```

### 3. Use Components

```typescript
import { TemplateCanvasWorkspaceComponent } from './template/components/layouts/template-canvas-workspace.component';
import { LayersPanelComponent } from './template/components/layers/layers-panel.component';
import { FrameRatioSelectorComponent } from './template/components/frame/frame-ratio-selector.component';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [
    TemplateCanvasWorkspaceComponent,
    LayersPanelComponent,
    FrameRatioSelectorComponent
  ],
  template: `
    <div class="editor-layout">
      <!-- Left: Frame Ratio Controls -->
      <aside class="sidebar-left">
        <app-frame-ratio-selector />
      </aside>

      <!-- Center: Canvas -->
      <main class="workspace">
        <app-template-canvas-workspace />
      </main>

      <!-- Right: Layers Panel -->
      <aside class="sidebar-right">
        <app-layers-panel />
      </aside>
    </div>
  `
})
```

## 📚 Usage Examples

### Add Objects

```typescript
import { CanvasFacadeService } from './template/services/canvas/canvas-facade.service';

export class MyComponent {
  private canvas = inject(CanvasFacadeService);

  addText(): void {
    this.canvas.addText('Hello World');
  }

  addImageFromURL(): void {
    this.canvas.addImage('https://example.com/image.jpg');
  }

  addImageFromFile(file: File): void {
    this.canvas.addImageFromFile(file);
  }

  addButton(): void {
    this.canvas.addButton('Click Me');
  }
}
```

### Change Frame Ratio

```typescript
import { FrameRatioService } from './template/services/frame/frame-ratio.service';

export class MyComponent {
  private ratioService = inject(FrameRatioService);

  changeToWidescreen(): void {
    this.ratioService.changeFrameRatio('16:9');
  }

  changeToCustom(): void {
    this.ratioService.setCustomDimensions({ width: 1024, height: 768 });
  }
}
```

### Undo/Redo

```typescript
import { CommandManagerService } from './template/services/command/command-manager.service';

export class MyComponent {
  private commands = inject(CommandManagerService);

  undo(): void {
    this.commands.undo();
  }

  redo(): void {
    this.commands.redo();
  }

  // Keyboard shortcuts already implemented:
  // Ctrl+Z / Cmd+Z - Undo
  // Ctrl+Y / Cmd+Y - Redo
}
```

### Upload Image

```html
<input
  type="file"
  accept="image/*"
  (change)="onFileSelected($event)"
  hidden
  #fileInput
/>
<button (click)="fileInput.click()">Upload Image</button>
```

```typescript
onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (file) {
    this.canvasService.addImageFromFile(file);
  }
}
```

## 🏗️ Project Structure

```
template/
├── services/
│   ├── canvas/               # Canvas core services
│   │   ├── canvas-facade.service.ts
│   │   ├── canvas-state.service.ts
│   │   ├── canvas-initialization.service.ts
│   │   └── canvas-event-handler.service.ts
│   ├── objects/              # Object operations
│   │   ├── object-creation.service.ts
│   │   ├── object-update.service.ts
│   │   └── object-constraint.service.ts
│   ├── layers/               # Layer management
│   │   └── layer-management.service.ts
│   ├── command/              # Undo/Redo
│   │   └── command-manager.service.ts
│   ├── frame/                # Frame ratio management
│   │   └── frame-ratio.service.ts
│   └── image/                # Image upload
│       └── image-upload.service.ts
├── commands/                 # Command pattern implementations
│   ├── add-object.command.ts
│   ├── delete-object.command.ts
│   ├── update-object.command.ts
│   ├── visibility-toggle.command.ts
│   └── reorder-layers.command.ts
├── components/
│   ├── layouts/              # Main layout components
│   │   ├── template-canvas-workspace.component.ts
│   │   └── template-editor-header.component.ts
│   ├── layers/               # Layers panel
│   │   └── layers-panel.component.ts
│   ├── frame/                # Frame controls
│   │   └── frame-ratio-selector.component.ts
│   └── properties-panel/     # Object property panels
└── types/                    # TypeScript definitions
    ├── canvas-object.type.ts
    ├── layer.type.ts
    ├── frame-ratio.type.ts
    └── command.type.ts
```

## 🎯 Key Services

### CanvasFacadeService
Unified API cho tất cả canvas operations.
```typescript
- initCanvas()
- addText() / addImage() / addButton()
- updateObjectProperties()
- syncLayers() / selectLayer() / deleteLayer()
- layers$ / selectedObject$
```

### FrameRatioService
Quản lý aspect ratios của frame.
```typescript
- changeFrameRatio('16:9')
- setCustomDimensions({ width, height })
- currentRatio$ observable
```

### LayerManagementService
Quản lý layers và z-index.
```typescript
- syncLayers()
- reorderLayers()
- toggleVisibility()
- layers$ observable
```

### CommandManagerService
Undo/Redo system.
```typescript
- executeCommand()
- undo() / redo()
- canUndo$ / canRedo$
```

## 🧪 Testing

### Manual Testing Checklist

**Frame Ratio:**
- [ ] Khởi tạo frame 1:2 (300x600)
- [ ] Thay đổi sang 16:9, 4:3, 9:16, 1:1
- [ ] Custom dimensions
- [ ] Content scale tự động

**Image Upload:**
- [ ] Upload từ local file (< 5MB)
- [ ] Validation: file size, file type
- [ ] Image fit vào frame

**Layers:**
- [ ] Drag & drop reorder
- [ ] Toggle visibility
- [ ] Delete layer
- [ ] Select layer
- [ ] Frame không thể move/delete

**Undo/Redo:**
- [ ] Add → Undo → Redo
- [ ] Delete → Undo → Redo
- [ ] Move → Undo → Redo
- [ ] Visibility → Undo → Redo
- [ ] Keyboard shortcuts (Ctrl+Z, Ctrl+Y)

**Constraints:**
- [ ] Objects không thể ra ngoài frame
- [ ] Rotation clamping
- [ ] Scale limiting
- [ ] Frame resize auto-scale

## 📖 Documentation

Xem [CANVAS_EDITOR_GUIDE.md](./CANVAS_EDITOR_GUIDE.md) cho:
- API Reference chi tiết
- Architecture deep-dive
- Best practices
- Troubleshooting
- Examples

## 🔧 Configuration

### Frame Ratios

Định nghĩa trong `template/types/frame-ratio.type.ts`:

```typescript
export const FRAME_RATIOS = {
  '1:2': { width: 300, height: 600 },
  '16:9': { width: 800, height: 450 },
  '4:3': { width: 600, height: 450 },
  '9:16': { width: 450, height: 800 },
  '1:1': { width: 500, height: 500 },
  custom: { width: 400, height: 400 }
};
```

### Image Upload Limits

Trong `template/services/image/image-upload.service.ts`:

```typescript
private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
private readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
```

## 🚨 Important Notes

### Providers

Services phải được provide tại component level:

```typescript
@Component({
  providers: [
    CanvasFacadeService,
    FrameRatioService,
    // ... other services
  ]
})
```

### Memory Management

Always cleanup trong `ngOnDestroy`:

```typescript
ngOnDestroy(): void {
  this.canvasService.disposeCanvas();
  this.commandManager.clear();
  this.destroy$.next();
  this.destroy$.complete();
}
```

### Command Pattern

Tất cả canvas modifications phải qua Command Pattern để có undo/redo:

```typescript
// ✅ Good
const command = new AddObjectCommand(canvas, object);
this.commandManager.executeCommand(command);

// ❌ Bad - No undo/redo
canvas.add(object);
```

## 🔍 Conventions

### SOLID Principles
- **S**: Single Responsibility - Mỗi service có 1 nhiệm vụ rõ ràng
- **O**: Open/Closed - Có thể extend qua inheritance
- **L**: Liskov Substitution - Command pattern implementations
- **I**: Interface Segregation - Type-safe interfaces
- **D**: Dependency Injection - Angular DI system

### DRY (Don't Repeat Yourself)
- Extracted common logic vào base services
- Reusable components
- Shared types và interfaces

### Angular Best Practices
- Standalone components (no NgModules)
- Reactive Forms
- RxJS Observables
- OnPush change detection ready
- Type-safe với TypeScript

## 🎨 Styling

Components sử dụng Tailwind CSS classes và custom styles. Customize trong component styles hoặc global styles.

## 🐛 Known Issues

1. **Performance**: Nhiều objects (>100) có thể lag khi resize frame
2. **Rotation**: Complex shapes cần fine-tuning constraints
3. **Undo Stack**: Unlimited - cân nhắc add limit

## 🚀 Future Enhancements

- [ ] Multi-select objects
- [ ] Group/Ungroup
- [ ] Alignment tools
- [ ] Grid snapping
- [ ] Export (PNG, SVG, PDF)
- [ ] Templates system
- [ ] Real-time collaboration

## 📄 License

MIT License (hoặc theo license của project)

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

---

**Built with ❤️ using Angular + Fabric.js**

For detailed documentation, see [CANVAS_EDITOR_GUIDE.md](./CANVAS_EDITOR_GUIDE.md)
