import { Component, OnDestroy, OnInit } from '@angular/core';
import { SearchService } from '../../../../core/services/search.service';
import { Observable, of, Subject, takeUntil } from 'rxjs';
import { MemberService } from '../../../../core/services/member.service';
import { User } from '../../../../models/interfaces/user.interface';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../../../../core/services/profile.service';
import { ThreadService } from '../../../../core/services/thread.service';
import { ChatService } from '../../../../core/services/chat.service';

@Component({
  selector: 'app-members-search',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './members-search.component.html',
  styleUrl: './members-search.component.scss',
})
export class MembersSearchComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  channelMembers$!: Observable<User[]>;
  constructor(
    public searchService: SearchService,
    public memberService: MemberService,
    public profileService: ProfileService,
    public chatService: ChatService
  ) {}

  /** Initializes the component and subscribes to the channel members observable.
   * Takes care of memory management with takeUntil. */
  ngOnInit() {
    this.memberService.channelMembers$
      .pipe(takeUntil(this.destroy$))
      .subscribe((members: User[]) => {
        this.channelMembers$ = of(members);
      });
  }
  /** Cleans up resources when the component is destroyed by emitting a value to destroy$. */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
