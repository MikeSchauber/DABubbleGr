export class Message {
    messageId?: string;      // Die eindeutige ID der Nachricht (für Firestore)
    text: string;            // Der Inhalt der Nachricht
    senderId: string;       // ID des Absenders
    receiverId?: string;    // ID des Empfängers (optional, für Private Nachrichten)
    channelId?: string;     // ID des Channels (optional, für Channel Nachrichten)
    threadId?: string;      // ID des Threads (optional, für Thread Nachrichten)
    timestamp: Date;        // Der Zeitstempel der Nachricht
    memberIds?: string[];   // Liste der Mitglieder, die die Nachricht erhalten sollen
  
    constructor(
      text: string,
      senderId: string,
      receiverId?: string,
      channelId?: string,
      threadId?: string,
      timestamp: Date = new Date(),
      memberIds?: string[],
      messageId?: string // messageId wird als optionaler Parameter hinzugefügt
    ) {
      this.text = text;
      this.senderId = senderId;
      this.receiverId = receiverId;
      this.channelId = channelId;
      this.threadId = threadId;
      this.timestamp = timestamp;
      this.memberIds = memberIds;
      this.messageId = messageId; // Die ID wird zugewiesen
    }
  
    // Umwandlung von Firestore-Daten in ein Message-Objekt
    static fromFirestoreData(data: any, messageId: string): Message {
      return new Message(
        data.text,
        data.senderId,
        data.receiverId,
        data.channelId,
        data.threadId,
        data.timestamp.toDate(),
        data.memberIds || [],
        messageId  // Die messageId wird hier übergeben und zugewiesen
      );
    }
  }
  