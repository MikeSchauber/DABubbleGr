export class User {
  email: string | null;
  displayName: string | null;
  userStatus: 'online' | 'away' | 'offline';
  avatarUrl: string;
  createdAt: Date;
  updatedAt: Date;
  publicUserId?: string;
  memberOfChannels?: string[];
  chatIds?: string[];

  constructor(
    email: string | null,
    displayName: string | null,
    userStatus: 'online' | 'away' | 'offline',
    avatarUrl: string,
    createdAt: Date,
    updatedAt: Date,
    publicUserId?: string,
    memberOfChannels?: string[],
    chatIds?: string[]
  ) {
    // Pflichtfelder
    this.email = email;
    this.displayName = displayName;
    this.userStatus = userStatus;
    this.avatarUrl = avatarUrl;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    // Optionalfelder
    this.publicUserId = publicUserId || '';
    this.memberOfChannels = memberOfChannels || [];
    this.chatIds = chatIds || [];
  }

  toJson() {
    return {
      email: this.email,
      publicUserId: this.publicUserId,
      displayName: this.displayName,
      userStatus: this.userStatus,
      avatarUrl: this.avatarUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      memberOfChannels: this.memberOfChannels,
      chatIds: this.chatIds,
    };
  }
}
