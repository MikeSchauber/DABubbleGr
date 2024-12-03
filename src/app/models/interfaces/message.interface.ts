import { Attachment } from "./attachment.interface";
import { Reaction } from "./reaction.interface";

///Message with author data in it, easier and quicker than storing and getting userName and Url seperately each message.
export interface Message {
    messageId: string;
    channelId?: string;
    senderId: string;
    senderName: string;
    senderAvatarUrl: string;
    content: string;
    timestamp: Date;
    attachments?: Attachment[];
    reactions?: Reaction[];
    threadId?: string;
    threadMessageCount?: number;
    parentMessageId?: string;///nur für eine thread message zum Zugriff auf den message counter (Thread Length) innerhalb der Parentmessage
    lastThreadMessage?: Date;
  }



  ///AKTUALISIERTE VERSION
  // export interface Message {
  //   messageId: string;
  //   senderId: string;
  //   content: string;
  //   timestamp: Date;

  //   attachments?: Attachment[];
  //   reactions?: Reaction[];
   
  //   channelId?: string;

  //   threadId?: string;
  //   threadMessageCount?: number;
  //   parentMessageId?: string;///nur für eine thread message zum Zugriff auf den message counter (Thread Length) innerhalb der Parentmessage
  //   lastThreadMessage?: Date;
  // }