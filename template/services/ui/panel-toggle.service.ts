// template/services/ui/panel-toggle.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PanelState {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
}

@Injectable()
export class PanelToggleService {
  private stateSubject = new BehaviorSubject<PanelState>({
    leftPanelOpen: true,
    rightPanelOpen: true
  });

  readonly state$: Observable<PanelState> = this.stateSubject.asObservable();

  /**
   * Toggle left panel
   */
  toggleLeftPanel(): void {
    const current = this.stateSubject.value;
    this.stateSubject.next({
      ...current,
      leftPanelOpen: !current.leftPanelOpen
    });
  }

  /**
   * Toggle right panel
   */
  toggleRightPanel(): void {
    const current = this.stateSubject.value;
    this.stateSubject.next({
      ...current,
      rightPanelOpen: !current.rightPanelOpen
    });
  }

  /**
   * Close left panel
   */
  closeLeftPanel(): void {
    const current = this.stateSubject.value;
    this.stateSubject.next({
      ...current,
      leftPanelOpen: false
    });
  }

  /**
   * Close right panel
   */
  closeRightPanel(): void {
    const current = this.stateSubject.value;
    this.stateSubject.next({
      ...current,
      rightPanelOpen: false
    });
  }

  /**
   * Open left panel
   */
  openLeftPanel(): void {
    const current = this.stateSubject.value;
    this.stateSubject.next({
      ...current,
      leftPanelOpen: true
    });
  }

  /**
   * Open right panel
   */
  openRightPanel(): void {
    const current = this.stateSubject.value;
    this.stateSubject.next({
      ...current,
      rightPanelOpen: true
    });
  }

  /**
   * Get current state
   */
  getState(): PanelState {
    return this.stateSubject.value;
  }

  /**
   * Check if left panel is open
   */
  isLeftPanelOpen(): boolean {
    return this.stateSubject.value.leftPanelOpen;
  }

  /**
   * Check if right panel is open
   */
  isRightPanelOpen(): boolean {
    return this.stateSubject.value.rightPanelOpen;
  }
}
