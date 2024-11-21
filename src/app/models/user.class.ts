export class User {
    email: string | null;
    authId: string;
    displayName: string;
    userStatus: 'active' | 'away'; 
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
      this.avatarUrl = avatarUrl;
      this.createdAt = createdAt;
      this.updatedAt = updatedAt;
  
      // Optionalfelder
      this.collectionId = collectionId || ""; 
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
        avatarUrl: this.avatarUrl,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        memberOfChannels: this.memberOfChannels,
        chatIds: this.chatIds,
      };
    }
  }
  