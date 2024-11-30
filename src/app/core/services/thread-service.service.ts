import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
// import { Channel } from '../../models/interfaces/channel.interace';
// import { User } from '../../models/interfaces/user.interface';
import { UserService } from './user.service';
import { ChannelService } from './channel.service';
import { MessagesService } from './messages.service';
import { Channel } from '../../models/channel.model.class';
import { User } from '../../models/interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class ThreadServiceService {

  currentChannel$: Observable<Channel | null>;
  usersCollectionData$: Observable<User[] |null>;

 
  constructor(
    public userService: UserService, 
    public channelService: ChannelService,
    public messagesService: MessagesService) {

this.currentChannel$ = this.channelService.currentChannel$;
this.usersCollectionData$ = this.userService.publicUsers$;
    }


///Enriched messages ... 





  private currentThreadIdSubject = new BehaviorSubject<string | null>(null);
  currentChannelId$ = this.currentThreadIdSubject.asObservable();




    //neu Roman
    setCurrentThread(threadId: string) {
      this.currentThreadIdSubject.next(threadId);
      // console.log(`Channel service: Changed current channel to ${channelId}`);
    }
  
  
  
}
