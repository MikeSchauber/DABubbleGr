export class User {
  email: string | null;
  authId: string;
  displayName: string;
  userStatus: boolean | string;
  avatarUrl: string;
  createdAt: Date;
  updatedAt: Date;
  memberOfChannels?: string[];
  chatIds?: string[];

  constructor(
    email: string | null,
    authId: string,
    displayName: string,
    userStatus: boolean | string,
    avatarUrl: string,
    createdAt: Date,
    updatedAt: Date,
    memberOfChannels?: string[],
    chatIds?: string[]
  ) {
    // Pflichtfelder
    this.email = email;
    this.authId = authId;
    this.displayName = displayName;
    this.userStatus = userStatus;
    this.avatarUrl = avatarUrl;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    // Optionalfelder
    this.memberOfChannels = memberOfChannels || [];
    this.chatIds = chatIds || [];
  }
  toJson() {
    return {
      email: this.email,
      authId: this.authId,
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
