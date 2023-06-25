const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    image: {
        publicId: String,
        url: String,
    },
    caption: {
        type: String,
        required: true,
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user"
        }
    ]
}, {
    timestamps: true,
})
const model = mongoose.model("post", postSchema)

module.exports = {
    Post: model,
}