
import { Pipe, PipeTransform } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore'; // Import Firestore Timestamp

@Pipe({
  name: 'dateSeperator',
  standalone: true,
})
export class DateSeperatorPipe implements PipeTransform {
  transform(value: Date | Timestamp | null | undefined): string {
    if (!value) {
      return '--:--'; // Default placeholder for empty timestamp
    }

    let date: Date;

    // Safely handle Firestore Timestamp conversion
    try {
      date = value instanceof Timestamp ? value.toDate() : new Date(value);
    } catch (error) {
      console.error('Invalid date value in dateSeperator:', value);
      return '--:--'; // Fallback for invalid dates
    }

    // Safeguard against invalid date instances
    if (isNaN(date.getTime())) {
      return '--:--';
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (inputDate.getTime() === today.getTime()) {
      return 'Heute';
    } else if (inputDate.getTime() === yesterday.getTime()) {
      return 'Gestern';
    } else {
      return inputDate.toLocaleDateString(); // Returns formatted date
    }
  }
}
