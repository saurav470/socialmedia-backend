const express = require("express");
const { validUser } = require("../middelwares/validUser");
const { Post } = require("../model/Post");
const { users } = require("../model/User");
const { mapPostOutput } = require("../utils/utils");
const { limiterForPost } = require("../middelwares/rateLimit");
const cloudinary = require("cloudinary").v2
const router = express.Router();

// const userValid=(req,res,next)=>{

// }

router.get("/post", validUser, async (req, res) => {
    // console.log(req);
    return res.json({ status: "ok", statusCode: "201", message: "post is ...." })
})
router.post("/create", validUser, limiterForPost, async (req, res) => {
    try {
        if (process?.server?.shuttingDown) {
            return res.status(503).json({ message: 'Server is closing. Please try again later.' });
        }
        const { caption, postImg } = req.body;
        if (!caption || !postImg) {
            return res.status(400).json({ status: "error", message: "caption is required", success: false })
        }
        const cloudImg = await cloudinary.uploader.upload(postImg, { folder: "profileImg", resource_type: "auto" })
        const owner = req._id;
        const post = await Post.create({
            owner,
            caption,
            image: {
                publicId: cloudImg.public_id,
                url: cloudImg.url
            }
        })
        // console.log(post._id);
        const user = await users.findByIdAndUpdate({ _id: owner }, { $push: { posts: post._id } }, { new: true })
        return res.status(201).json({ success: true, message: "post created", post })

    } catch (error) {
        console.log(error);
        return res.status(400).json({ success: false, message: "something went wrong while creating post", error })
    }
})

router.post("/like", validUser, async (req, res) => {
    try {
        if (process?.server?.shuttingDown) {
            return res.status(503).json({ message: 'Server is closing. Please try again later.' });
        }
        const { postId } = req.body;
        const curUserId = req._id;
        const post = await Post.findById(postId).populate("owner");
        if (!post) {
            return res.status(404).json({ status: "error", success: "false", message: "post not found" })
        }

        if (!post.likes.includes(curUserId)) {
            post.likes.push(curUserId);
            const save = await post.save()
            const formatedPost = mapPostOutput(save, curUserId)

            return res.status(200).json({
                success: true,
                message: "like successfull",
                post: formatedPost
            })
        } else {
            const index = post.likes.indexOf(curUserId);
            post.likes.splice(index, 1);
            const save = await post.save()
            const formatedPost = mapPostOutput(save, curUserId)
            return res.status(200).json({
                status: "ok",
                success: true,
                message: "unlike successfull",
                post: formatedPost
            })
        }
    } catch (error) {
        console.log(error);
        return res.status(400).json({ status: "error", success: false, message: "something wents wrong" })
    }
})

router.put("/updatePost", validUser, async (req, res) => {
    try {
        if (process?.server?.shuttingDown) {
            return res.status(503).json({ message: 'Server is closing. Please try again later.' });
        }
        const { postId, caption } = req.body;
        const curUserId = req._id;
        const post = await Post.findById(postId)
        if (!post) {
            return res.status(404).json({ status: "error", message: "post not found", success: "false" })
        }
        if (post.owner.toString() !== curUserId) {
            return res.status(403).json({ status: "error", message: "only owner can update the post", success: "false" })
        }
        if (caption) {
            post.caption = caption;
            await post.save()
            return res.status(200).json({
                success: "true",
                message: "post updated",
                status: "ok"
            })
        }
    } catch (error) {
        return res.status(400).json({ message: "something went wrong", status: "error", success: false })
    }



})

router.delete("/deletePost", validUser, async (req, res) => {
    try {
        if (process?.server?.shuttingDown) {
            return res.status(503).json({ message: 'Server is closing. Please try again later.' });
        }
        const { postId } = req.body;
        const curUserId = req._id;

        // const test = await Post.findById(postId);
        // const curUser = await users.findById(curUserId)
        const result = await Promise.all([Post.findById(postId), users.findById(curUserId)])
        const test = result[0];
        const curUser = result[1]
        if (!test) {
            return res.status(404).json({ status: "error", message: "post not found", success: "false" })
        }
        if (test.owner.toString() !== curUserId) {
            return res.status(400).json({ status: "error", message: "you can not delete other user post", success: "false" })
        }

        const index = curUser.posts.indexOf(postId)
        curUser.posts.splice(index, 1);
        // await curUser.save();
        // await test.deleteOne();
        await Promise.all([test.deleteOne(), curUser.save()])

        return res.status(200).json({ status: "ok", message: "post delete sucessfull", success: "true" })
    } catch (error) {
        console.log(error);
        return res.status(400).json({ message: "something went wrong", status: "error", success: false, error })
    }
})

module.exports = {
    post: router,
}