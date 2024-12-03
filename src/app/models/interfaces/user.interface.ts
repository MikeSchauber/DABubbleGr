export interface User {
  publicUserId: string;
  displayName: string;
  email: string;
  userStatus: 'online' | 'away' | 'offline'; // online = grün / away = vorerst nicht verwendet / offline = grau
  avatarUrl: string;
  createdAt: any;
  updatedAt: any;
  name: string;
  avatar: string;
  authId: string;
  memberId: string;
}
