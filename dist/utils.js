"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAdminSecret = void 0;
require("dotenv").config();
const validateAdminSecret = (secret) => {
    console.log("Comparing secrets ");
    return secret === process.env.REGISTER_ADMIN_TO_MSG_SERVER_SECRET;
};
exports.validateAdminSecret = validateAdminSecret;
