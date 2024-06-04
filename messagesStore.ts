import { ClientSideChatType } from "./types";

export type Message = {
  messageId: string;
  author: string;
  recipient: string;
  message: ClientSideChatType;
  isReceived: boolean;
};

abstract class MessagesStore {
  abstract saveMessage(message: Message, userId: string): void;
  abstract getAllMessages(userId: string): Message[];
  abstract clearAllUserMessages(userId: string): boolean;
  abstract clearAllAdminMessages(userId: string): boolean;
  abstract markMessageAsReceived(messageId: string, userId: string): boolean;
  abstract getAllUnreceivedUserMssgs(userId: string): ClientSideChatType[];
  abstract getAllUnreceivedAdminMssgs(userId: string): ClientSideChatType[];
  abstract markProvidedMessagesAsReceived(messageIds: string[], userId: string): boolean;

  abstract clearMessages(messageIds: string[], userId:string): boolean
}

// stores the users messages using the userId as a key and an array to store the content of each users message
class InMemoryMessagesStore extends MessagesStore {
  private messages: { [key: string]: any[] } = {};

  saveMessage(message: Message, userId: string): void {
    if (!this.messages[userId]) {
      this.messages[userId] = [];
    }
    if (userId === "admin") {
      if (this.messages[userId].length <= 80) {
        this.messages[userId].push(message);
      } else {
        this.messages[userId].shift();
        this.messages[userId].push(message);
      }
    } else {
      if (this.messages[userId].length <= 20) {
        this.messages[userId].push(message);
      } else {
        this.messages[userId].shift();
        this.messages[userId].push(message);
      }
    }
  }

  getAllMessages(userId: string): Message[] {
    return this.messages[userId] || [];
  }

  clearAllUserMessages(userId: string): boolean {
    this.messages[userId] = [];

    return this.messages[userId].length < 0
  }

  clearAllAdminMessages(adminId: string): boolean {
    this.messages[adminId] = [];

    return this.messages[adminId].length < 0
  }

  clearMessages(messageIds: string[], userId: string): boolean {
     let allMessagesCopy:Message[]  = [...this.messages[userId]];
     let newMessagesState:Message[] = [];
   try{
     for(let i = 0; i < messageIds.length; i++){
        for(let j = 0; j < allMessagesCopy.length ; j++){
           if(messageIds[i] === allMessagesCopy[j].messageId){
             continue;
           }else{
             newMessagesState.push(allMessagesCopy[j])
           }
        }
     }
  
     this.messages[userId] = newMessagesState;

   }catch(error){
     console.log("error clearing messages ", error)
   } 

     return allMessagesCopy.length - messageIds.length === newMessagesState.length
  } 

  markMessageAsReceived(messageId: string, userId: string): boolean {
    let isMarkedAsReceived = false;

    try{
      let userMessagesCopy = [...this.messages[userId]];
      userMessagesCopy.forEach((message, index) => {
        if (message.messageId === messageId) {
          userMessagesCopy[index] = {
            ...message,
            isReceived: true,
          };
          isMarkedAsReceived = true;
          return true;
        }
      });
      this.messages[userId] = userMessagesCopy;
  
      // clear all the received messages from the chat store
      this.clearMessages([messageId], userId);
    }catch(error){
      console.log("error marking Message as received", error)
    }

    return isMarkedAsReceived;
  }

  markProvidedMessagesAsReceived(messageIds: string[], userId: string): boolean {
    let results:boolean[] = [];
    try{
      let userMessagesCopy:Message[] = [...this.messages[userId]];
      userMessagesCopy.forEach((message, index) => {
        if (messageIds.indexOf(message.messageId) > -1) {
          userMessagesCopy[index] = {
            ...message,
            isReceived: true,
          };
          results.push(true);
          return true;
        }
      });
      this.messages[userId] = userMessagesCopy;
  
      // clear all the received messages from the chat store
      this.clearMessages(messageIds, userId);

    }catch(error){
       console.log("error marking messages as received", error)
    }
    return results.length > 0 ;
  }

  getAllUnreceivedUserMssgs(userId: string): ClientSideChatType[] {
    let unreceivedMsgs: ClientSideChatType[] = [];
    try{
      let allMessages: Message[] = [...this.getAllMessages(userId)];
  
  
      allMessages.forEach((message) => {
        if (!message.isReceived) {
          unreceivedMsgs.push(message.message);
        }
      });
  
      
    }catch(error){
      console.log("error getting All user received Messages")
    }
    
    return unreceivedMsgs;
  }

  getAllUnreceivedAdminMssgs(userId: string): ClientSideChatType[] {
    let unreceivedMsgs: ClientSideChatType[] = [];

    try{
          let allMessages: Message[] = [...this.getAllMessages(userId)];
      
      
          allMessages.forEach((message) => {
            if (!message.isReceived) {
              unreceivedMsgs.push(message.message);
            }
          });

    }catch(error){
      console.log("error getting all unreceived Admin Messages", error)
    }

    return unreceivedMsgs;
  }
}


export { InMemoryMessagesStore };
