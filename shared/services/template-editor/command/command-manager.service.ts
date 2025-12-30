import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ICommand } from '../../../types';

/**
 * Command Manager Service
 *
 * Implements Command Pattern for undo/redo.
 * Maintains two stacks: undo and redo.
 */
@Injectable()
export class CommandManagerService {
  private undoStack: ICommand[] = [];
  private redoStack: ICommand[] = [];
  private maxStackSize = 50;

  private canUndoSubject = new BehaviorSubject<boolean>(false);
  private canRedoSubject = new BehaviorSubject<boolean>(false);

  readonly canUndo$ = this.canUndoSubject.asObservable();
  readonly canRedo$ = this.canRedoSubject.asObservable();

  /**
   * Execute a command and add to undo stack
   */
  execute(command: ICommand): void {
    command.execute();

    this.undoStack.push(command);
    this.redoStack = []; // Clear redo stack on new action

    // Limit stack size
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }

    this.updateState();
  }

  /**
   * Add command to history without executing
   * Used when command has already been executed (e.g., during drag)
   */
  addToHistory(command: ICommand): void {
    this.undoStack.push(command);
    this.redoStack = []; // Clear redo stack on new action

    // Limit stack size
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }

    this.updateState();
  }

  /**
   * Undo last command
   */
  undo(): void {
    const command = this.undoStack.pop();
    if (!command) return;

    command.undo();
    this.redoStack.push(command);
    this.updateState();
  }

  /**
   * Redo last undone command
   */
  redo(): void {
    const command = this.redoStack.pop();
    if (!command) return;

    command.redo();
    this.undoStack.push(command);
    this.updateState();
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.updateState();
  }

  isClean(): boolean {
    return this.undoStack.length === 0;
  }

  private updateState(): void {
    this.canUndoSubject.next(this.undoStack.length > 0);
    this.canRedoSubject.next(this.redoStack.length > 0);
  }
}
