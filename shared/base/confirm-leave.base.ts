import { Dialog } from '@angular/cdk/dialog';
import { map, of, take } from 'rxjs';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';
import { DIALOG_WARNING } from '@gsf/ui';
import { Directive, inject, OnDestroy } from '@angular/core';

const DEFAULT_CONFIG = {
  title: 'Leave Screen',
  message: 'Your changes will be lost if you leave this screen. Are you sure you want to proceed?',
  confirmButtonText: 'Close Anyway',
  width: '400px'
};

@Directive()
export abstract class ConfirmLeaveBase implements OnDestroy {
  protected abstract isDirty(): boolean;
  protected abstract markAsPristine(): void;

  protected dialog = inject(Dialog);

  private beforeUnloadHandler!: (e: BeforeUnloadEvent) => void;
  private ignoreLeaveWarning = false;

  constructor() {
    this.registerBeforeUnload();
  }

  canDeactivate() {
    if (this.ignoreLeaveWarning || !this.isDirty()) {
      return of(true);
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        icon: DIALOG_WARNING,
        title: DEFAULT_CONFIG.title,
        desc: DEFAULT_CONFIG.message,
        okText: DEFAULT_CONFIG.confirmButtonText
      },
      width: DEFAULT_CONFIG.width,
      disableClose: true
    });

    return dialogRef.closed.pipe(
      take(1),
      map((result) => {
        const confirmed = Boolean(result);
        if (confirmed) {
          this.markAsPristine();
        }
        return confirmed;
      })
    );
  }

  ngOnDestroy() {
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);
  }

  protected onSaveSuccess() {
    this.ignoreLeaveWarning = true;
    this.markAsPristine();
  }

  private registerBeforeUnload() {
    this.beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      if (this.ignoreLeaveWarning) return;
      if (!this.isDirty()) return;

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }
}
