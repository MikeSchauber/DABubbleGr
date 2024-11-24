import { Attachment } from "./attachment.interface";
import { Reaction } from "./reaction.interface";

export interface Thread {
    threadId: string;
    parentMessageId: string; 
    channelId: string;
    createdAt: Date;
    createdBy: string;
    attachments?: Attachment[];
    reactions?: Reaction[];
  }
  