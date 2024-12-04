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
  onEmojiSelected(emoji: string) {
    console.log(emoji);
    this.emojiSelected.emit(emoji);
  }
}
