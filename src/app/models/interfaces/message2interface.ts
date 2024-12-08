import { Attachment } from "./attachment.interface";
import { Reaction } from "./reaction.interface";

  export interface IMessage {
    messageId: string;
    senderId: string;
    content: string;
    timestamp: any;

    attachments?: Attachment[];
    reactions?: Reaction[];
   
    channelId?: string;

    threadId?: string;
    threadMessageCount?: number;
    parentMessageId?: string;
    lastThreadMessage?: Date;


    senderAvatarUrl?: string;
    senderName?: string;
    enrichedReactions?: Reaction[];

    edited?: boolean;
    lastEdit?: Date;

    conversationId?: string;
  }