"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite_1 = __importStar(require("@databases/sqlite"));
const socket_io_1 = require("socket.io");
// declare var require: any;
const express_1 = __importDefault(require("express"));
const db_1 = require("./db");
const utils_1 = require("./utils");
// const express = require("express");
const http = require("http");
const app = (0, express_1.default)();
const server = http.createServer(app);
const db = (0, sqlite_1.default)();
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
const prepared = (0, db_1.prepare)(db);
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
function remove(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield prepared;
        yield db
            .query((0, sqlite_1.sql) `
  DELETE FROM app_data WHERE userId=${userId}
  `)
            .catch((error) => {
            console.log("Unable to delete from app_data ", userId);
        });
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(yield (0, db_1.get)("name", db, prepared));
            yield (0, db_1.set)("name", "forbes", db, prepared);
            console.log(yield (0, db_1.get)("name", db, prepared));
            yield (0, db_1.set)("name", "forbes lindesay", db, prepared);
            console.log(yield (0, db_1.get)("name", db, prepared));
            remove("name");
            console.log(yield (0, db_1.get)("name", db, prepared));
        }
        catch (err) {
            console.log("error bootstrapping database ", err);
        }
    });
}
run().catch((ex) => {
    console.log(ex.stack);
    // process.exit(1)
});
// when deploying to production, change the origin from '*' to only the expected url
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
    },
});
try {
    io.on("connection", (socket) => {
        console.log("connected to messages server");
        socket.on("register-user", ({ userId }) => {
            if (typeof userId === "string") {
                console.log("user registered");
                (0, db_1.set)(userId, socket.id, db, prepared);
            }
            else {
                return socket.disconnect();
            }
        });
        // sending to admin
        socket.on("send-to-admin", (_a) => __awaiter(void 0, [_a], void 0, function* ({ message, userId, }) {
            let adminSocketId = yield (0, db_1.get)("admin", db, prepared);
            if (typeof adminSocketId === "string" && message) {
                console.log("sending msg to admin user id is", userId);
                console.log("admin details ", adminSocketId);
                socket.broadcast
                    .to(adminSocketId)
                    .emit("user-message", message, userId);
            }
        }));
        // sending to client can only be called by admin
        socket.on("send-to-client", (_b) => __awaiter(void 0, [_b], void 0, function* ({ message, userId, }) {
            // save user Id and socket id
            if (typeof userId === "string" && (socket === null || socket === void 0 ? void 0 : socket.id)) {
                console.log("user id gotten ", userId);
                let adminSocketId = yield (0, db_1.get)("admin", db, prepared);
                let userSocketId = yield (0, db_1.get)(userId, db, prepared);
                console.log("admin-socket-id ", adminSocketId);
                console.log("user-socket-id ", userSocketId);
                //  EDIT CODE TO ACCOUNT FOR MULTIPLE ADMIN INSTANCES
                if (adminSocketId === socket.id && message) {
                    console.log("unique id met ", userId, "socket-id is ", userSocketId);
                    socket.broadcast.to(userSocketId).emit("send-message", message);
                }
                console.log("connected and socket id is ", socket.id, message);
            }
        }));
        socket.on("register-admin", ({ adminSecret }) => {
            if (typeof adminSecret === "string") {
                if ((0, utils_1.validateRegisterAdminSocketIdSecret)(adminSecret)) {
                    console.log("admin registered");
                    (0, db_1.set)("admin", socket.id, db, prepared);
                }
            }
            else {
                return socket.disconnect();
            }
        });
        socket.on("register-user", ({ userId }) => {
            if (typeof userId === "string") {
                console.log("user-registered-mmmmmmmmmm");
                (0, db_1.set)(userId, socket.id, db, prepared);
            }
        });
    });
}
catch (err) {
    console.log("error with socket.io ", err);
}
server.listen(process.env.PORT || 3021, () => {
    console.log("server listening on port 3021");
});
process.on("unhandledRejection", (reason, promise) => {
    console.log("UnhandledRejection at ", reason === null || reason === void 0 ? void 0 : reason.stack);
    // send information to error files using winston
});
