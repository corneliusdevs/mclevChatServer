import connect from "@databases/sqlite";
import { Server } from "socket.io";

import express from "express";
import { get, prepare, remove, set } from "./db";
import { ClientSideChatType, OnMessageReceivedPayload } from "./types";
import { validateAdminSecret } from "./utils";
import sessionStore from "./sessionStore";
import { v4 as uuidv4 } from "uuid";
import { InMemoryMessagesStore, Message } from "./messagesStore";
import InMemorySessionStore from "./sessionStore";

const http = require("http");
const app = express();

const server = http.createServer(app);

// when deploying to production, change the origin from '*' to only the expected url
const io = new Server(server, {
  cors: {
    origin: "*",
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
  // increses the http buffer size
  maxHttpBufferSize: 1e7,
  // decrease the ping interval and ping timeout
  pingInterval: 10000,
  pingTimeout: 20000,
});

// const messagesStore = new InMemoryMessagesStore();

// No need to register the admin or user anymore, we simply register and validate both of them using this middleware
io.use((socket, next) => {
  const userId = socket.handshake.auth.userId;
  if (!userId) {
    console.log("invalid userId")
    return next(new Error("Invalid userId"));
  }
  if (userId === "admin") {
    const adminSecret = socket.handshake.auth.adminSecret;
    if (!adminSecret) {
      console.log("unauthenticated")
      return next(new Error("Unauthenticated"));
    } else if (
      !validateAdminSecret(adminSecret)
    ) {
      console.log("Unauthorised", adminSecret, " stored secret ", validateAdminSecret(adminSecret))
      return next(new Error("Unauthorised"));
    }
  }

  next();
});

io.use((socket, next) => {
  // get socket Id from the auth
  const sessionId = socket.handshake.auth.sessionId;
  //  get userId from the auth
  const userId = socket.handshake.auth.userId;

  if (sessionId) {
    // find the existing session
    console.log("sessionId exists");

    //at the moment, we are not saving any info into the session store, hence the below code will return undefined
    const session = sessionStore.getInstance().findSession(sessionId);
    console.log(session);
    if (session) {
      console.log("session exists");
      // @ts-ignore
      socket.sessionId = sessionId;
      // @ts-ignore
      socket.userId = session.userId;
      return next();
    }
  }

  // @ts-ignore
  socket.userId = userId;

  const generatedSessionId = uuidv4();
  // @ts-ignore
  socket.sessionId = generatedSessionId;
  // @ts-ignore

  socket.handshake.auth.sessionId = generatedSessionId;
  next();
});

// DB OPERATIONS
const db = connect();
const prepared = prepare(db);

io.on("connection", (socket) => {
  console.log("connected to messages server");
  // @ts-ignore
  console.log("reconnecting ...", socket.handshake.auth.userId);
  // join the room on connection
  // @ts-ignore
  socket.join(socket.handshake.auth.userId);

  try{

    if (socket.recovered) {
      // get all previous messages up to the last 20 messages and send to the user
      console.log("connection recovered ", socket.handshake.auth.userId);
  
      // if (socket.handshake.auth.userId !== "admin") {
      //   const upToLast20Messages = messagesStore.getAllMessages(
      //     socket.handshake.auth.userId
      //   );
  
      //   if (upToLast20Messages.length) {
      //     console.log(
      //       `all ${socket.handshake.auth.userId}}  last 20 messages are `,
      //       upToLast20Messages
      //     );
  
      //     // @ts-ignore
      //     socket.recoveredMessages = upToLast20Messages;
  
      //     socket.emit("connection-recovered", upToLast20Messages);
  
      //     // clear all buffered messages for that user
      //     messagesStore.clearAllUserMessages(socket.handshake.auth.userId);
      //   }
      // } else {
      //   // validate the admin
      //   if (validateAdminSecret(socket.handshake.auth?.adminSecret)) {
      //     // get all previous messages up to the last 60 messages and send to the admin
      //     const upToLast80Messages = messagesStore.getAllMessages(
      //       socket.handshake.auth.userId
      //     );
  
      //     if (upToLast80Messages.length) {
      //       console.log("admin upToLast80Messages are ", upToLast80Messages);
  
      //       socket.emit("connection-recovered", upToLast80Messages);
  
      //       // clear all buffered messages for the admin
      //       messagesStore.clearAllAdminMessages(socket.handshake.auth.userId);
      //     }
      //   }
      // }
    }
  }catch(error){
    console.log("error handling on socket.recovered");
  }


  // save the session in the session store class
  InMemorySessionStore.getInstance().saveSession(
    socket.handshake.auth.sessionId,
    {
      userId: socket.handshake.auth.userId,
    }
  );

  // emit the current session
  socket.emit("session", {
    sessionId: socket.handshake.auth.sessionId,
    userId: socket.handshake.auth.userId,
  });

  // when the user or admin successfully receives a message, this event is emitted.
  socket.on("message-received", (payload: OnMessageReceivedPayload) => {
    try{
      // userId is the userId of the user emitting that they recived a message while the message Id is the id of the message that they received
      // if (payload.messageIds.length && payload.userId) {
      //   if (
      //     validateAdminSecret(
      //       socket.handshake.auth?.adminSecret
      //     ) && socket.handshake.auth?.userId
      //   ) {
      //     // mark admin messages as received
      //     let isMarkedAsReceived = messagesStore.markProvidedMessagesAsReceived(
      //       payload.messageIds,
      //       socket.handshake.auth.userId
      //     );
  
      //     console.log("admin messages marked as received ", isMarkedAsReceived);
      //   } else {
          
      //     let isMarkedAsReceived = messagesStore.markProvidedMessagesAsReceived(
      //       payload.messageIds,
      //       payload.userId
      //     );
  
      //     console.log("user messages  marked as received", isMarkedAsReceived);
      //   }
      // }

    }catch(error){
      console.log("error handling message-received", error)
    }
  });

  // socket.on("register-user", ({ userId }: { userId: string }) => {
  //   if (typeof userId === "string") {
  //     console.log("user registered");
  //     set(userId, socket.id, db, prepared);
  //   } else {
  //     return socket.disconnect();
  //   }
  // });
  // sending to admin
  socket.on(
    "send-to-admin",
    async ({
      message,
      // userId of the sender
      userId,
    }: {
      message: ClientSideChatType;
      userId: string;
    }) => {
      try{

        socket.broadcast.to("admin").emit("new-user-message", [message], userId);
        if (message) {
          // socket.broadcast.to("admin").emit("new-user-message", [message], userId);
          // store the messages for the admin in the messages store
        //   messagesStore.saveMessage(
        //     {
        //       messageId: message.id,
        //       author: userId,
        //       recipient: "admin",
        //       message: message,
        //       isReceived: false,
        //     },
        //     "admin"
        //   );
        }
        console.log(
          "sending msg to admin user id is",
          message,
          socket.handshake.auth.userId
        );
  
        // // send all the un received messages up to the last 80 un received messages to the admin including the new one sent just now
        // let allUnreceivedMssgs: (ClientSideChatType | null | undefined)[] =
        //   messagesStore.getAllUnreceivedAdminMssgs("admin");
  
        // if (
        //   allUnreceivedMssgs.length &&
        //   allUnreceivedMssgs.indexOf(null) === -1 &&
        //   allUnreceivedMssgs.indexOf(undefined) === -1
        // ) {
        //   console.log("all unreceived admin mssgs are ", allUnreceivedMssgs);
  
        //   // send up to last 80 unreceived messages to the admin
        //   socket.broadcast.to("admin").emit("new-user-message", allUnreceivedMssgs, userId);
        // }else{
        //   socket.broadcast.to("admin").emit("new-user-message", [message], userId);
        // }
      }catch(error){
        console.log("error on send-to-admin", error)
      }

      // save message in the messagesStore with the reccipientId being the admin in this case as the key

      // console.log(
      //   "all messages",
      //   messagesStore.getAllMessages("admin")
      // );
    }
  );

  // sending to client can only be called by admin
  socket.on(
    "send-to-client",
    async ({
      message,
      userId,
    }: {
      message: ClientSideChatType;
      userId: string;
    }) => {
      console.log("admin is chatting");

      try {
        socket.broadcast
        .to(userId)
        .emit("admin-message", [message]);
        if (
          typeof userId === "string" &&
          socket.handshake.auth?.userId === "admin"
        ) {
          console.log("admin message is", message);


          
          //  EDIT CODE TO ACCOUNT FOR MULTIPLE ADMIN INSTANCES
          if (message) {
            // save the recieved messages to the messagesStore based on the userId of the recipient

          // in if block
          console.log("admin message is and about to send to the to client", message);

            // messagesStore.saveMessage(
            //   {
            //     messageId: message.id,
            //     author: "admin",
            //     recipient: userId,
            //     message: message,
            //     isReceived: false,
            //   },
            //   userId
            // );

            // send all the un Received messages up to the last 20 un received messages to the client including the new one sent just now
            // let allUnreceivedMssgs: (ClientSideChatType | null | undefined)[] =
            //   messagesStore.getAllUnreceivedUserMssgs(userId);

            // if (
            //   allUnreceivedMssgs.length &&
            //   allUnreceivedMssgs.indexOf(null) === -1 &&
            //   allUnreceivedMssgs.indexOf(undefined) === -1
            // ) {
            //   console.log("all unreceived user mssgs are ", allUnreceivedMssgs);
            //   socket.broadcast
            //     .to(userId)
            //     .emit("admin-message", allUnreceivedMssgs);
            // }else{
            //   // socket.broadcast
            //   // .to(userId)
            //   // .emit("admin-message", [message]);
            // }
            // socket.broadcast.to(userId).emit("admin-message", message);
          }
        } else {
          // close the connection if someone tries to chat as the admin without a valid admin secret
          socket.disconnect();
        }
      } catch (error) {
        console.log("error on send-to-client", error)
      }
    }
  );

  // socket.on("register-admin", ({ adminSecret }: { adminSecret: string }) => {
  //   if (typeof adminSecret === "string") {
  //     if (validateAdminSecret(adminSecret)) {
  //       console.log("admin registered");
  //       set("admin", socket.id, db, prepared);
  //     }
  //   } else {
  //     return socket.disconnect();
  //   }
  // });

  // socket.on("register-user", ({ userId }: { userId: string }) => {
  //   if (typeof userId === "string") {
  //     console.log("user-registered-mmmmmmmmmm");
  //     set(userId, socket.id, db, prepared);
  //   }
  // });
});
// } catch (err) {
//   console.log("error with socket.io ", err);
// }

server.listen(process.env.PORT || 3021, () => {
  console.log("server listening on port 3021");
});

process.on("unhandledRejection", (reason: any, promise) => {
  console.log("UnhandledRejection at ", reason?.stack);

  // send information to error files using winston
});
