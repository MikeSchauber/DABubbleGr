import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateSeperator',
  standalone: true
})
export class DateSeperatorPipe implements PipeTransform {

  transform(date: Date): string {
    // console.log('Called DateSeperatorPipe function');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (inputDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (inputDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return inputDate.toLocaleDateString(); // Returns formatted date
    }
  }

}
