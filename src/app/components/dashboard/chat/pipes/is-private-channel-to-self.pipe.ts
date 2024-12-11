import { Pipe, PipeTransform } from '@angular/core';
import { Channel } from '../../../../models/channel.model.class';
// Adjust import based on your model

@Pipe({
  name: 'isPrivateChannelToSelf',
  standalone: true, 
})
export class IsPrivateChannelToSelfPipe implements PipeTransform {
  transform(channel: Channel | null, currentUserId: string): boolean {
    if (!channel || !channel.memberIds) return false;
    return channel.memberIds.every((id) => id === currentUserId);
  }
}