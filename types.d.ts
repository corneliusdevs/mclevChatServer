export type ChatStatus = "failed" | "success";
export type ChatType = {
  message: string;
  timeStamp: number;
  recipientsId: string[];
  author: "admin" | "client";
  type: "showChat" | "saveChat";
  id: string;
};

export type ClientSideChatType = ChatType & {
  status?: ChatStatus;
};

export type OnMessageReceivedPayload = {
  messageIds: string[],
  userId: string
}