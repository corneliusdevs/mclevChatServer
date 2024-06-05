"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testMsgsDb = exports.getUserMessages = exports.storeUserMessage = exports.deleteUserMessage = exports.createUserTable = void 0;
const sqlite_1 = require("@databases/sqlite");
function createUserTable(db, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield db.query((0, sqlite_1.sql) `CREATE TABLE ${userId} (
    messageId INTEGER PRIMARY KEY AUTOINCREMENT ,
    message VARCHAR NOT NULL
 );`);
    });
}
exports.createUserTable = createUserTable;
// export async function createUserTable(db: DatabaseConnection, userId: string) {
//   await db.query(sql[]);
// }
function deleteUserMessage(messageId, userId, db) {
    return __awaiter(this, void 0, void 0, function* () {
        //   await prepared;
        yield db.query((0, sqlite_1.sql) `
        DELETE FROM ${userId} WHERE messageId=${messageId};
        `).catch((error) => {
            console.log("Unable to delete message from ", userId, " table", error);
        });
    });
}
exports.deleteUserMessage = deleteUserMessage;
function storeUserMessage(userId, message, db) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        //   await prepared;
        let allMessages = yield getUserMessages(userId, db);
        if (allMessages.length < 4) {
            //   store the user's message
            yield db.query((0, sqlite_1.sql) `
       INTSERT INTO ${userId} (
        VALUES (NULL, ${message})
       );
        `);
        }
        else {
            // delete the oldest message from the database and store the newest one
            yield db.query((0, sqlite_1.sql) `
    DELETE FROM ${userId} WHERE messageId=${(_a = allMessages[0]) === null || _a === void 0 ? void 0 : _a.messageId};
     `).catch((error) => {
                console.log("unable to delete oldest message while inserting a new one", error);
            });
        }
    });
}
exports.storeUserMessage = storeUserMessage;
function getUserMessages(userId, db) {
    return __awaiter(this, void 0, void 0, function* () {
        //   await prepared;
        let messages = yield db.query((0, sqlite_1.sql) `
    SELECT * FROM ${userId} ORDER BY messageId;
    `);
        if (messages.length) {
            console.log("messages from ", userId, messages);
            return [...messages].slice(-1, -35);
        }
        else {
            return [];
        }
    });
}
exports.getUserMessages = getUserMessages;
function testMsgsDb(db, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield createUserTable(db, userId);
        yield storeUserMessage(userId, "My first message", db);
        console.log(yield getUserMessages(userId, db));
        yield storeUserMessage(userId, "My second message", db);
        console.log(yield getUserMessages(userId, db));
        yield storeUserMessage(userId, "My third message", db);
        console.log(yield getUserMessages(userId, db));
        yield storeUserMessage(userId, "My fourth message", db);
        console.log(yield getUserMessages(userId, db));
    });
}
exports.testMsgsDb = testMsgsDb;
// export async function createUserTable(db: DatabaseConnection, userId: string) {
//   await db.query(sql`
//     CREATE TABLE "${userId}" (
//       messageId INTEGER PRIMARY KEY AUTOINCREMENT,
//       message VARCHAR NOT NULL
//     );
//   `);
// }
// export async function deleteUserMessage(
//   messageId: string,
//   userId: string,
//   db: DatabaseConnection
// ) {
//   await db.query(sql`
//     DELETE FROM "${userId}" WHERE messageId = ${messageId};
//   `).catch((error) => {
//     console.log("Unable to delete message from ", userId, " table", error);
//   });
// }
// export async function storeUserMessage(
//   userId: string,
//   message: string,
//   db: DatabaseConnection
// ) {
//   let allMessages = await getUserMessages(userId, db);
//   if (allMessages.length < 4) {
//     // store the user's message
//     await db.query(sql`
//       INSERT INTO "${userId}" (message) VALUES (${message});
//     `);
//   } else {
//     // delete the oldest message from the database and store the newest one
//     await db.query(sql`
//       DELETE FROM "${userId}" WHERE messageId = ${allMessages[0]?.messageId};
//       INSERT INTO "${userId}" (message) VALUES (${message});
//     `);
//   }
// }
// export async function getUserMessages(
//   userId: string,
//   db: DatabaseConnection
// ) {
//   let messages = await db.query(sql`
//     SELECT * FROM "${userId}" ORDER BY messageId;
//   `);
//   if (messages.length) {
//     console.log("messages from ", userId, messages);
//     return [...messages].slice(-1, -35);
//   } else {
//     return [];
//   }
// }
// export async function testMsgsDb(db: DatabaseConnection, userId: string) {
//   await createUserTable(db, userId);
//   await storeUserMessage(userId, "My first message", db);
//   console.log(await getUserMessages(userId, db));
//   await storeUserMessage(userId, "My second message", db);
//   console.log(await getUserMessages(userId, db));
//   await storeUserMessage(userId, "My third message", db);
//   console.log(await getUserMessages(userId, db));
//   await storeUserMessage(userId, "My fourth message", db);
//   console.log(await getUserMessages(userId, db));
// }
