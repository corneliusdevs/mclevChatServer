import { DatabaseConnection, SQLQuery, sql } from "@databases/sqlite";




export async function createUserTable(db: DatabaseConnection, userId: string) {
  await db.query(sql`CREATE TABLE ${userId} (
    messageId INTEGER PRIMARY KEY AUTOINCREMENT ,
    message VARCHAR NOT NULL
 );`);
}

// export async function createUserTable(db: DatabaseConnection, userId: string) {

//   await db.query(sql[]);
// }

export async function deleteUserMessage(
  messageId: string,
  userId: string,
  db: DatabaseConnection,
//   prepared: Promise<void>
) {
//   await prepared;
  await db.query(
    sql`
        DELETE FROM ${userId} WHERE messageId=${messageId};
        `
  ).catch((error)=>{
    console.log("Unable to delete message from ", userId, " table", error)
  });
}

export async function storeUserMessage(
  userId: string,
  message: string,
  db: DatabaseConnection,
//   prepared: Promise<void>
) {
//   await prepared;
  let allMessages = await getUserMessages(userId, db, 
    // prepared
);

  if(allMessages.length < 4){
    //   store the user's message
      await db.query(sql`
       INTSERT INTO ${userId} (
        VALUES (NULL, ${message})
       );
        `);
  }else{
    // delete the oldest message from the database and store the newest one
     
     await db.query(sql`
    DELETE FROM ${userId} WHERE messageId=${allMessages[0]?.messageId};
     `).catch((error)=>{
       console.log("unable to delete oldest message while inserting a new one", error)
     })
  }

}



export async function getUserMessages(
  userId: string,
  db: DatabaseConnection,
//   prepared: Promise<void>
) {
//   await prepared;
  let messages = await db.query(sql`
    SELECT * FROM ${userId} ORDER BY messageId;
    `);

  if (messages.length) {
    console.log("messages from ", userId, messages);
    return [...messages].slice(-1, -35);
  } else {
    return [];
  }
}


export async function testMsgsDb (db:DatabaseConnection, userId: string){
    await createUserTable(db, userId)
    await storeUserMessage(userId, "My first message", db);
    console.log(await getUserMessages(userId, db));
    await storeUserMessage(userId, "My second message", db);
    console.log(await getUserMessages(userId, db));
    await storeUserMessage(userId, "My third message", db);
    console.log(await getUserMessages(userId, db));
    await storeUserMessage(userId, "My fourth message", db);
    console.log(await getUserMessages(userId, db));
}



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