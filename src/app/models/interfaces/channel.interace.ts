export interface Channel {
    channelId: string;
    name: string;
    description?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    memberIds: string[];
  }