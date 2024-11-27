
export interface User {
    publicUserId: string;
    displayName: string;
    email: string;
    userStatus: "online" | "abwesend" | "offline";
    avatarUrl: string;
    createdAt: any;
    updatedAt: any;
  }
  