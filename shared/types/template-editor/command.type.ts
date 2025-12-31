export interface ICommand {
  execute(): void | Promise<void>;
  undo(): void | Promise<void>;
  redo(): void | Promise<void>;
}

export abstract class Command implements ICommand {
  abstract execute(): void | Promise<void>;
  abstract undo(): void | Promise<void>;

  redo(): void | Promise<void> {
    return this.execute();
  }
}
