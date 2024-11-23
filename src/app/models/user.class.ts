export class User {
  email: string | null;
  authId: string;
  displayName: string;
  userStatus: 'active' | 'away';
  online: boolean;
  avatarUrl: string;
  createdAt: Date;
  updatedAt: Date;
  collectionId?: string;
  memberOfChannels?: string[];
  chatIds?: string[];

  constructor(
    email: string | null,
    authId: string,
    displayName: string,
    userStatus: 'active' | 'away',
    online: boolean,
    avatarUrl: string,
    createdAt: Date,
    updatedAt: Date,
    collectionId?: string,
    memberOfChannels?: string[],
    chatIds?: string[]
  ) {
    // Pflichtfelder
    this.email = email;
    this.authId = authId;
    this.displayName = displayName;
    this.userStatus = userStatus;
    this.online = online;
    this.avatarUrl = avatarUrl;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    // Optionalfelder
    this.collectionId = collectionId || '';
    this.memberOfChannels = memberOfChannels || [];
    this.chatIds = chatIds || [];
  }

  toJson() {
    return {
      email: this.email,
      authId: this.authId,
      collectionId: this.collectionId,
      displayName: this.displayName,
      userStatus: this.userStatus,
      online: this.online,
      avatarUrl: this.avatarUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      memberOfChannels: this.memberOfChannels,
      chatIds: this.chatIds,
    };
  }
}
