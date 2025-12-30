import { Pipe, PipeTransform } from "@angular/core";

@Pipe({ name: 'recordOrder', standalone: true })
export class RecordOrderPipe implements PipeTransform {
  transform(i: number, page: number, pageSize: number): number {
    return (page - 1) * pageSize + (i + 1);
  }
}