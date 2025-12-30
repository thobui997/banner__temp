export interface ICommand {
  execute(): void;
  undo(): void;
  redo(): void;
}

export abstract class Command implements ICommand {
  abstract execute(): void;
  abstract undo(): void;

  redo(): void {
    this.execute();
  }
}
