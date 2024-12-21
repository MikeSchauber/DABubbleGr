

import { Pipe, PipeTransform } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';

@Pipe({
  name: 'shouldShowDateSeperator',
  standalone: true,
})
export class ShouldShowDateSeperatorPipe implements PipeTransform {
  transform(index: number, oldTimestamp: Date | Timestamp | null | undefined, newTimestamp: Date | Timestamp | null | undefined): boolean {

    
      if (!oldTimestamp || !newTimestamp) {
        return false; // Default placeholder for empty timestamp
      }
    // Handle Firestore Timestamps by converting them to Date objects
    const oldDate = oldTimestamp instanceof Timestamp ? oldTimestamp.toDate() : oldTimestamp;
    const newDate = newTimestamp instanceof Timestamp ? newTimestamp.toDate() : newTimestamp;

    // Always show the date separator for the first message
    if (index === 0) {
      return true;
    }

    // Compare only the date part of the timestamps
    const currentMessageDate = newDate.toDateString();
    const previousMessageDate = oldDate.toDateString();

    return currentMessageDate !== previousMessageDate;
  }
}
