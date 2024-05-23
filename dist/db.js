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
exports.get = exports.set = exports.prepare = void 0;
const sqlite_1 = require("@databases/sqlite");
function prepare(db) {
    return __awaiter(this, void 0, void 0, function* () {
        yield db.query((0, sqlite_1.sql) `
    CREATE TABLE app_data (
      userId VARCHAR NOT NULL PRIMARY KEY,
      socketId VARCHAR NOT NULL
    );
    `);
    });
}
exports.prepare = prepare;
function set(userId, socketId, db, prepared) {
    return __awaiter(this, void 0, void 0, function* () {
        yield prepared;
        yield db.query((0, sqlite_1.sql) `
    INSERT INTO app_data (userId, socketId)
      VALUES (${userId}, ${socketId})
    ON CONFLICT (userId) DO UPDATE
      SET socketId=excluded.socketId
     `);
    });
}
exports.set = set;
function get(userId, db, prepared) {
    return __awaiter(this, void 0, void 0, function* () {
        yield prepared;
        const results = yield db.query((0, sqlite_1.sql) `
    SELECT socketId FROM app_data WHERE userId=${userId};
    `);
        if (results.length) {
            console.log("results, ", results);
            return results[0].socketId;
        }
        else {
            return undefined;
        }
    });
}
exports.get = get;
