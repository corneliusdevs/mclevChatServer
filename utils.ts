require("dotenv").config()

export const validateAdminSecret = (secret:string)=>{
    console.log("Comparing secrets ")
      return secret === process.env.REGISTER_ADMIN_TO_MSG_SERVER_SECRET
    }