// export interface User {
//   publicUserId: string;
//   displayName: string;
//   email: string;
//   userStatus: 'online' | 'away' | 'offline'; // online = grün / away = vorerst nicht verwendet / offline = grau
//   avatarUrl: string;
//   createdAt: any;
//   updatedAt: any;
//   name: string;
//   avatar: string;
//   authId: string;
//   memberId: string;
//   displayEmail: string;

//   ///for enhanced users inside direct message component
//   // conversationId?: string | null;
//   // messageCount?: number | null;
// }


export interface User {
  publicUserId: string;
  displayName: string;
  accountEmail: string;
  displayEmail: string;
  userStatus: 'online' | 'away' | 'offline'; // online = grün / away = vorerst nicht verwendet / offline = grau
  avatarUrl: string;
  createdAt: any;
  updatedAt: any;
}
