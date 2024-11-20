export class Chat {
    id: string;
    name: string;
    messages: ChatMessage[];
  
    constructor(id: string, name: string, messages: ChatMessage[] = []) {
      this.id = id;
      this.name = name;
      this.messages = messages;
    }
  }
  
  export class ChatMessage {
    sender: string;
    content: string;
    timestamp: Date;
  
    constructor(sender: string, content: string, timestamp: Date) {
      this.sender = sender;
      this.content = content;
      this.timestamp = timestamp;
    }
  }
  