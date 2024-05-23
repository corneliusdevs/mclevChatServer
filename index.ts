import connect, { sql } from "@databases/sqlite";
import { Server } from "socket.io";


// declare var require: any;
import express, { Router } from "express";

import { get, prepare, set } from "./db";
import { ClientSideChatType } from "./types";
import { validateRegisterAdminSocketIdSecret } from "./utils";
// const express = require("express");
const http = require("http");
const app = express();

const server = http.createServer(app);

const db = connect();

// const router = Router();

// router.get("/hello", (req, res) => res.send("Hello World!"));

// app.use("/api/", router);

// async function prepare() {
//   await db.query(sql`
//   CREATE TABLE app_data (
//     userId VARCHAR NOT NULL PRIMARY KEY,
//     socketId VARCHAR NOT NULL
//   );
//   `);
// }

const prepared = prepare(db);

// async function set(userId: string, socketId: string) {
//   await prepared;
//   await db.query(sql`
//   INSERT INTO app_data (userId, socketId)
//     VALUES (${userId}, ${socketId})
//   ON CONFLICT (userId) DO UPDATE
//     SET socketId=excluded.socketId
//    `);
// }

// async function get(userId: string): Promise<any> {
//   await prepared;
//   const results = await db.query(sql`
//   SELECT socketId FROM app_data WHERE userId=${userId};
//   `);
//   if (results.length) {
//     console.log("results, ", results);
//     return results[0].socketId;
//   } else {
//     return undefined;
//   }
// }

async function remove(userId: string) {
  await prepared;
  await db
    .query(
      sql`
  DELETE FROM app_data WHERE userId=${userId}
  `
    )
    .catch((error) => {
      console.log("Unable to delete from app_data ", userId);
    });
}

async function run() {
  try {
    console.log(await get("name", db, prepared));
    await set("name", "forbes", db, prepared);
    console.log(await get("name", db, prepared));
    await set("name", "forbes lindesay", db, prepared);
    console.log(await get("name", db, prepared));
    remove("name");
    console.log(await get("name", db, prepared));
  } catch (err) {
    console.log("error bootstrapping database ", err);
  }
}

run().catch((ex) => {
  console.log(ex.stack);
  // process.exit(1)
});

// when deploying to production, change the origin from '*' to only the expected url
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

try {
  io.on("connection", (socket) => {
    console.log("connected to messages server");

    socket.on("register-user", ({ userId }: { userId: string }) => {
      if (typeof userId === "string") {
        console.log("user registered");
        set(userId, socket.id, db, prepared);
      } else {
        return socket.disconnect();
      }
    });
    // sending to admin
    socket.on(
      "send-to-admin",
      async ({
        message,
        userId,
      }: {
        message: ClientSideChatType;
        userId: string;
      }) => {
        let adminSocketId = await get("admin", db, prepared);
        if (typeof adminSocketId === "string" && message) {
          console.log("sending msg to admin user id is", userId, );
          console.log("admin details ", adminSocketId);

          socket.broadcast
            .to(adminSocketId)
            .emit("user-message", message, userId);
        }
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
        // save user Id and socket id
      
        if (typeof userId === "string" && socket?.id) {
          console.log("user id gotten ", userId)
          let adminSocketId = await get("admin", db, prepared);
          let userSocketId = await get(userId, db, prepared);
          console.log("admin-socket-id ", adminSocketId);
          console.log("user-socket-id ", userSocketId);

          //  EDIT CODE TO ACCOUNT FOR MULTIPLE ADMIN INSTANCES
          if (adminSocketId === socket.id && message) {
            console.log("unique id met ", userId, "socket-id is ", userSocketId)
            socket.broadcast.to(userSocketId).emit("send-message", message);
          }
          console.log("connected and socket id is ", socket.id, message);
        }
      }
    );

    socket.on("register-admin", ({ adminSecret }: { adminSecret: string }) => {
      if (typeof adminSecret === "string") {
        if (validateRegisterAdminSocketIdSecret(adminSecret)) {
          console.log("admin registered");
          set("admin", socket.id, db, prepared);
        }
      } else {
        return socket.disconnect();
      }
    });


    socket.on("register-user", ({ userId }: { userId: string }) => {
      if (typeof userId === "string") {
          console.log("user-registered-mmmmmmmmmm")
          set(userId, socket.id, db, prepared);
      }
    });
  });

  
  
} catch (err) {
  console.log("error with socket.io ", err);
}

server.listen(process.env.PORT || 3001, () => {
  console.log("server listening on port 3001");
});


process.on("unhandledRejection", (reason: any, promise) => {
  console.log("UnhandledRejection at ", reason?.stack);

  // send information to error files using winston
});
