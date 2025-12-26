import { Command, ICommand } from "../../types";

export class CompositeCommand extends Command {
  private commands: ICommand[] = [];

  addCommand(command: ICommand): void {
    this.commands.push(command);
  }

  execute(): void {
    this.commands.forEach((cmd) => cmd.execute());
  }

  undo(): void {
    // Undo in reverse order
    [...this.commands].reverse().forEach((cmd) => cmd.undo());
  }
}
