export class UserClass {
  accountEmail: string;
  displayEmail: string;
  displayName: string;
  userStatus: 'online' | 'away' | 'offline';
  avatarUrl: string;
  createdAt: Date;
  updatedAt: Date;
  publicUserId: string;

  constructor(
    accountEmail: string,
    displayEmail: string,
    displayName: string,
    userStatus: 'online' | 'away' | 'offline',
    avatarUrl: string,
    createdAt: Date,
    updatedAt: Date,
    publicUserId: string,
  ) {
    // Pflichtfelder
    this.accountEmail = accountEmail;
    this.displayEmail = displayEmail;
    this.displayName = displayName;
    this.userStatus = userStatus;
    this.avatarUrl = avatarUrl;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    // Optionalfelder
    this.publicUserId = publicUserId;
  }

  toJson() {
    return {
      accountEmail: this.accountEmail,
      displayEmail: this.displayEmail,
      publicUserId: this.publicUserId,
      displayName: this.displayName,
      userStatus: this.userStatus,
      avatarUrl: this.avatarUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
