export class Channel {
  channelId: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
  memberIds?: string[];
  
  // New optional fields for direct message channels
  type?: 'public' | 'private'; 
  conversationId?: string;
  lastReadInfo?: {
    [userId: string]: {
      lastReadTimestamp: string; // ISO string or server timestamp
      messageCount: number;
    };
  };

  constructor(
    channelId: string,
    name: string,
    createdBy: string,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
    description?: string,
    memberIds?: string[],
    type?: 'public' | 'private',
    conversationId?: string,
    lastReadInfo?: {
      [userId: string]: {
        lastReadTimestamp: string;
        messageCount: number;
      };
    }
  ) {
    this.channelId = channelId;
    this.name = name;
    this.createdBy = createdBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.description = description;
    this.memberIds = memberIds;
    this.type = type;
    this.conversationId = conversationId;
    this.lastReadInfo = lastReadInfo;
  }

  /**
   * Creates a Channel instance from Firestore data.
   * @param data The raw Firestore data object
   * @param _channelId The ID of the channel document
   */
  static fromFirestoreData(data: any, _channelId: string): Channel {
    return new Channel(
      data.channelId,
      data.name,
      data.createdBy,
      data.createdAt ? new Date(data.createdAt) : new Date(),
      data.updatedAt ? new Date(data.updatedAt) : new Date(),
      data.description,
      data.memberIds?.map((memberId: string) => memberId.toString()) || [],
      data.type,
      data.conversationId,
      data.lastReadInfo
    );
  }
}

// export class Channel {
//   channelId: string;
//     name: string;
//     createdBy: string;
//     createdAt: Date;
//     updatedAt: Date;
//   description?: string;
//   memberIds?: string[];
  
//     constructor(
//     channelId: string,
//       name: string,
//       createdBy: string,
//       createdAt: Date = new Date(),
//       updatedAt: Date = new Date(),
//     description?: string,
//     memberIds?: string[]
//     ) {
//     this.channelId = channelId;
//       this.name = name;
//       this.createdBy = createdBy;
//       this.createdAt = createdAt;
//       this.updatedAt = updatedAt;
//     this.description = description;
//     this.memberIds = memberIds;
//   }

//   // Optional: Methode, um ein Channel-Objekt aus Firestore-Daten zu erstellen
//   static fromFirestoreData(data: any, _channelId: string): Channel {
//     return new Channel(
//       data.channelId,
//         data.name,
//         data.createdBy,
//         new Date(data.createdAt),
//         new Date(data.updatedAt),
//       data.description,
//       data.memberIds?.map((memberId: string) => memberId.toString()) || []
//       );
//     }
//   }
  