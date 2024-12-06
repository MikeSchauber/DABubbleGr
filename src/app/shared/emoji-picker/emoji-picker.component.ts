import {
  Component,
  EventEmitter,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { EmojiPicker } from 'ngx-easy-emoji-picker';
@Component({
  selector: 'app-emoji-picker',
  standalone: true,
  imports: [EmojiPicker],
  templateUrl: './emoji-picker.component.html',
  styleUrl: './emoji-picker.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class EmojiPickerComponent {
  @Output() emojiSelected = new EventEmitter<string>();
  onEmojiSelected(emoji: string): void {
    const decodedEmoji = this.decodeHtmlEntity(emoji);
    this.emojiSelected.emit(decodedEmoji);
  }

  decodeHtmlEntity(input: string): string {
    const parser = new DOMParser();
    const decoded = parser.parseFromString(input, 'text/html').documentElement
      .textContent;
    return decoded || input;
  }
}
