const mongoose = require("mongoose");
const DeletedAccount = mongoose.Schema({
    AccountOwner: {
        type: String,
    },
    user: {
        type: Object
    },
    posts: {
        type: Array
    }
})

const DeletedAccounts = mongoose.model("DeletedAccount", DeletedAccount)
module.exports = {
    DeletedAccounts
}