import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shouldShowDateSeperator',
  standalone: true
})
export class ShouldShowDateSeperatorPipe implements PipeTransform {

  transform(index: number, oldTimestamp: Date, newTimestamp: Date): boolean{
    // console.log('Called ShouldShowDateSeperatorPipe function');
    if (index === 0) {
      return true;
    }
  
    const currentMessageDate = new Date(newTimestamp).toDateString();
    const previousMessageDate = new Date(oldTimestamp).toDateString();
  
    return currentMessageDate !== previousMessageDate;
  }

}
