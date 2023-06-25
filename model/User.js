const { mongoose } = require("mongoose");

const userSchema = new mongoose.Schema({

    email: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    avatar: {
        publicId: String,
        url: String,
    },
    bio: {
        type: String,
    },
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user"
        }
    ],
    following: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user"
        }
    ],
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "post"
        }
    ],

})
const users = mongoose.model("user", userSchema)
module.exports = {
    users,
}