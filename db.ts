import { DatabaseConnection, sql } from "@databases/sqlite";

export async function prepare(db:DatabaseConnection) {
    await db.query(sql`
    CREATE TABLE app_data (
      userId VARCHAR NOT NULL PRIMARY KEY,
      socketId VARCHAR NOT NULL
    );
    `);
  }
  

export  async function set(userId: string, socketId: string, db:DatabaseConnection, prepared:Promise<void>) {
    await prepared;
    await db.query(sql`
    INSERT INTO app_data (userId, socketId)
      VALUES (${userId}, ${socketId})
    ON CONFLICT (userId) DO UPDATE
      SET socketId=excluded.socketId
     `);
  }

export  async function get(userId: string, db:DatabaseConnection, prepared:Promise<void>): Promise<any> {
    await prepared;
    const results = await db.query(sql`
    SELECT socketId FROM app_data WHERE userId=${userId};
    `);
    if (results.length) {
      console.log("results, ", results);
      return results[0].socketId;
    } else {
      return undefined;
    }
  }

export  async function remove(userId: string, db:DatabaseConnection, prepared:Promise<void>) {
    await prepared;
    await db
      .query(
        sql`
    DELETE FROM app_data WHERE userId=${userId}
    `
      )
      .catch((error) => {
        console.log("Unable to delete from app_data ", userId, error);
      });
  }