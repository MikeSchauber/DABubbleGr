

import { Pipe, PipeTransform } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';

@Pipe({
  name: 'getMessageTime',
  standalone: true
})
export class GetMessageTimePipe implements PipeTransform {
  transform(date: Date | Timestamp | null | undefined): string {
    if (!date) {
      return '--:--'; // Default placeholder for empty timestamp
    }
    // Convert Firestore Timestamp to Date if necessary
    const actualDate = date instanceof Timestamp ? date.toDate() : date;

    // Format the time (e.g., "10:15 AM")
    return actualDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

