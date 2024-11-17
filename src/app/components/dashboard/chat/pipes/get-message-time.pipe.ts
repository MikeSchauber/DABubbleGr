import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'getMessageTime',
  standalone: true
})
export class GetMessageTimePipe implements PipeTransform {

  transform(date: Date): string {
    console.log('Called GetMessageTimePipe function');
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
 
}
