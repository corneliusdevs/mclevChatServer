"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryMessagesStore = void 0;
class MessagesStore {
}
// stores the users messages using the userId as a key and an array to store the content of each users message
class InMemoryMessagesStore extends MessagesStore {
    constructor() {
        super(...arguments);
        this.messages = {};
    }
    saveMessage(message, userId) {
        if (!this.messages[userId]) {
            this.messages[userId] = [];
        }
        if (userId === "admin") {
            if (this.messages[userId].length <= 80) {
                this.messages[userId].push(message);
            }
            else {
                this.messages[userId].shift();
                this.messages[userId].push(message);
            }
        }
        else {
            if (this.messages[userId].length <= 20) {
                this.messages[userId].push(message);
            }
            else {
                this.messages[userId].shift();
                this.messages[userId].push(message);
            }
        }
    }
    getAllMessages(userId) {
        return this.messages[userId] || [];
    }
    clearAllUserMessages(userId) {
        this.messages[userId] = [];
        return this.messages[userId].length < 0;
    }
    clearAllAdminMessages(adminId) {
        this.messages[adminId] = [];
        return this.messages[adminId].length < 0;
    }
    clearMessages(messageIds, userId) {
        let allMessagesCopy = [...this.messages[userId]];
        let newMessagesState = [];
        try {
            for (let i = 0; i < messageIds.length; i++) {
                for (let j = 0; j < allMessagesCopy.length; j++) {
                    if (messageIds[i] === allMessagesCopy[j].messageId) {
                        continue;
                    }
                    else {
                        newMessagesState.push(allMessagesCopy[j]);
                    }
                }
            }
            this.messages[userId] = newMessagesState;
        }
        catch (error) {
            console.log("error clearing messages ", error);
        }
        return allMessagesCopy.length - messageIds.length === newMessagesState.length;
    }
    markMessageAsReceived(messageId, userId) {
        let isMarkedAsReceived = false;
        try {
            let userMessagesCopy = [...this.messages[userId]];
            userMessagesCopy.forEach((message, index) => {
                if (message.messageId === messageId) {
                    userMessagesCopy[index] = Object.assign(Object.assign({}, message), { isReceived: true });
                    isMarkedAsReceived = true;
                    return true;
                }
            });
            this.messages[userId] = userMessagesCopy;
            // clear all the received messages from the chat store
            this.clearMessages([messageId], userId);
        }
        catch (error) {
            console.log("error marking Message as received", error);
        }
        return isMarkedAsReceived;
    }
    markProvidedMessagesAsReceived(messageIds, userId) {
        let results = [];
        try {
            let userMessagesCopy = [...this.messages[userId]];
            userMessagesCopy.forEach((message, index) => {
                if (messageIds.indexOf(message.messageId) > -1) {
                    userMessagesCopy[index] = Object.assign(Object.assign({}, message), { isReceived: true });
                    results.push(true);
                    return true;
                }
            });
            this.messages[userId] = userMessagesCopy;
            // clear all the received messages from the chat store
            this.clearMessages(messageIds, userId);
        }
        catch (error) {
            console.log("error marking messages as received", error);
        }
        return results.length > 0;
    }
    getAllUnreceivedUserMssgs(userId) {
        let unreceivedMsgs = [];
        try {
            let allMessages = [...this.getAllMessages(userId)];
            allMessages.forEach((message) => {
                if (!message.isReceived) {
                    unreceivedMsgs.push(message.message);
                }
            });
        }
        catch (error) {
            console.log("error getting All user received Messages");
        }
        return unreceivedMsgs;
    }
    getAllUnreceivedAdminMssgs(userId) {
        let unreceivedMsgs = [];
        try {
            let allMessages = [...this.getAllMessages(userId)];
            allMessages.forEach((message) => {
                if (!message.isReceived) {
                    unreceivedMsgs.push(message.message);
                }
            });
        }
        catch (error) {
            console.log("error getting all unreceived Admin Messages", error);
        }
        return unreceivedMsgs;
    }
}
exports.InMemoryMessagesStore = InMemoryMessagesStore;
