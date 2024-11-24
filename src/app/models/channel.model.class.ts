export class Channel {
  channelId: string;
    name: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  description?: string;
  memberIds?: string[];
  
    constructor(
    channelId: string,
      name: string,
      createdBy: string,
      createdAt: Date = new Date(),
      updatedAt: Date = new Date(),
    description?: string,
    memberIds?: string[]
    ) {
    this.channelId = channelId;
      this.name = name;
      this.createdBy = createdBy;
      this.createdAt = createdAt;
      this.updatedAt = updatedAt;
    this.description = description;
    this.memberIds = memberIds;
  }

  // Optional: Methode, um ein Channel-Objekt aus Firestore-Daten zu erstellen
  static fromFirestoreData(data: any, _channelId: string): Channel {
    return new Channel(
      data.channelId,
        data.name,
        data.createdBy,
        new Date(data.createdAt),
        new Date(data.updatedAt),
      data.description,
      data.memberIds?.map((memberId: string) => memberId.toString()) || []
      );
    }
  }
  