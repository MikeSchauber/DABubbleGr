export interface Reaction {
    emoji: string;
    userIds: string[];

    ///for enriching reactions with user url and name
    users?: string[];  
  }