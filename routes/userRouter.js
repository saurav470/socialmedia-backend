const express = require("express")
const router = express.Router();
const { validUser } = require("../middelwares/validUser")
const { users } = require("../model/User");
const { Post } = require("../model/Post");
const cloudinary = require("cloudinary").v2
const { mapPostOutput } = require("../utils/utils.js");
const { sendMail } = require("../utils/nodemailer");
const { DeletedAccounts } = require("../model/DeletedAccount");


router.post("/follow", validUser, async (req, res) => {
    try {
        if (process?.server?.shuttingDown) {
            return res.status(503).json({ message: 'Server is closing. Please try again later.' });
        }
        const { userIdToFollow } = req.body;
        const curUserId = req._id;
        const userToFollow = await users.findById(userIdToFollow)
        const curUser = await users.findById(curUserId)
        if (!userToFollow) {
            return res.status(404).json({ success: "false", message: "user not found", status: "error" })
        }
        if (curUser.following.includes(userIdToFollow)) {
            const followingIndex = curUser.following.indexOf(userIdToFollow)
            curUser.following.splice(followingIndex, 1)
            const followerIndex = userToFollow.followers.indexOf(curUserId);
            userToFollow.followers.splice(followerIndex, 1);
            // await curUser.save()
            // await userToFollow.save();
            const result = await Promise.all([curUser.save(), userToFollow.save()])

            return res.status(200).json({ status: "ok", message: "unsubscribe", success: "true" })
        } else {
            curUser.following.push(userIdToFollow);
            userToFollow.followers.push(curUserId)
            // await curUser.save()
            // await userToFollow.save();
            const result = await Promise.all([curUser.save(), userToFollow.save()])

            return res.status(201).json({ status: "ok", message: "subscribe", success: "true" })
        }
    } catch (error) {
        // console.log(error);
        return res.status(400).json({ status: "error", message: "something wents wrong", success: "false" })
    }

})

router.get("/getFeedData", validUser, async (req, res) => {

    try {
        if (process?.server?.shuttingDown) {
            return res.status(503).json({ message: 'Server is closing. Please try again later.' });
        }
        const curUserId = req._id;
        const curUser = await users.findById(curUserId).populate({
            path: "following",
        });
        if (!curUser) {
            return res.status(400).json({ message: "currUser not found" })
        }
        const followingsIds = curUser.following.map(item => item._id);

        const post = await Post.find({
            "owner": {  //multiple ke liye ye
                "$in": followingsIds
            }
        }).populate({
            path: "owner"
        })
        const formatedPost = post.map(item => mapPostOutput(item, req._id)).reverse();


        const notfollwed = await users.find({ //notes
            _id: {
                "$nin": followingsIds
            }
        })
        const suggestions = notfollwed.filter(item => item._id != curUserId)
        res.status(200).json({ success: "true", status: "ok", data: { ...curUser._doc, suggestions, followingPosts: formatedPost } })
    } catch (error) {
        console.log(error);
        return res.status(400).json({ error })
    }
})

router.get("/myPost", validUser, async (req, res) => {
    try {
        if (process?.server?.shuttingDown) {
            return res.status(503).json({ message: 'Server is closing. Please try again later.' });
        }
        const curUserId = req._id;
        const curUser = await users.findById(curUserId)
        const post = await Post.find({
            owner: curUserId    // ek ke liye ye
        })
        return res.json({ success: true, message: "your all posts", status: "ok", post })
    } catch (error) {
        return res.status(400).json({ status: "error", message: "something wents wrong", success: "false" })
    }
})

router.get("/getUserPost", validUser, async (req, res) => {
    try {
        if (process?.server?.shuttingDown) {
            return res.status(503).json({ message: 'Server is closing. Please try again later.' });
        }
        const { userId } = req.body
        if (!userId) {
            return res.status(400).json({ success: false, message: "error in signup cntroller all field are requierd" })
        }
        const post = await Post.find({
            owner: userId
        });
        console.log(post);
        if (!post) {
            return res.status(404).json({ message: "post not found", status: "ok" })
        }
        return res.status(200).json({ status: "ok", message: "user post are", success: true, post })
    } catch (error) {
        return res.status(400).json({ status: "error", message: "something wents wrong", success: "false" })
    }

})

router.delete("/deleteMyAccount", validUser, async (req, res) => {
    try {
        if (process?.server?.shuttingDown) {
            return res.status(503).json({ message: 'Server is closing. Please try again later.' });
        }
        const curUserId = req._id;
        const curUser = await users.findById(curUserId);
        if (!curUser) {
            return res.status(404).json({ message: "user not find", status: "error", success: false })
        }
        const findDeltedPosts = await Post.find({
            owner: curUserId
        })
        console.log("ye wo delete hone wali post h --->", findDeltedPosts);
        const deletedPost = await Post.deleteMany({
            owner: curUserId                 //notes
        })

        // console.log(curUser.followers);

        curUser.followers.forEach(async (followersId) => {
            const follower = await users.findById(followersId);

            const index = follower.following.indexOf(curUserId);

            follower.following.splice(index, 1);
            await follower.save()
        })
        curUser.following.forEach(async (followingId) => {
            const following = await users.findById(followingId);
            const index = following.followers.indexOf(curUserId);
            // console.log(index);
            following.followers.splice(index, 1);
            await following.save()
        })
        //remove myself from all likes

        //delete account
        const deletedUser = await curUser.deleteOne()
        console.log("ye deleted user h", deletedUser);
        const createDeletedAccEntry = await DeletedAccounts.create({
            AccountOwner: deletedUser._id,
            user: deletedUser,
            posts: findDeltedPosts
        })



        return res.status(200).json({ success: "ok", message: "account delete successfully", success: true })
    } catch (error) {
        console.log(error);
        return res.status(400).json({ status: "error", message: "something wents wrong", success: "false", error })
    }
})
router.post("/restore", async (req, res) => {
    try {
        if (process?.server?.shuttingDown) {
            return res.status(503).json({ message: 'Server is closing. Please try again later.' });
        }
        const { deletedAccId } = req.body
        const searchAcc = await DeletedAccounts.findOne({ AccountOwner: deletedAccId })
        if (!searchAcc) {
            return res.status(404).json({ success: false, message: "there is no deltedaccount find in reacord " })
        }
        //if the user create new account after delete the account with same id
        const newAcc = await users.findOne({ email: searchAcc.user.email })
        if (!newAcc) {
            //same step to restore Account line number 173 to 192
            const restore = await Promise.all([users.create(searchAcc.user), Post.insertMany(searchAcc.posts)])
            // const restoreAcc = await users.create(searchAcc.user)
            const restoreAcc = restore[0]
            // const restorePosts = await Post.insertMany(searchAcc.posts)
            // const restorePosts = restore[1]

            restoreAcc.following.forEach(async (followingId) => {
                const following = await users.findById(followingId);
                following.followers.push(restoreAcc._id)
                await following.save()
            })
            restoreAcc.followers.forEach(async (followersId) => {
                const follower = await users.findById(followersId);
                follower.following.push(restoreAcc._id);
                await follower.save()
            })
            await searchAcc.deleteOne();
            return res.status(200).json({ success: true, message: "account restore sucessfully" })
        } else if (newAcc) {
            // user create the new account after delete 
            const newAccId = newAcc._id
            const findDeltedPosts = await Post.find({
                owner: newAccId
            })

            const deletedPost = await Post.deleteMany({
                owner: newAccId               //notes
            })

            // console.log(curUser.followers);

            newAcc.followers.forEach(async (followersId) => {
                const follower = await users.findById(followersId);

                const index = follower.following.indexOf(curUserId);

                follower.following.splice(index, 1);
                await follower.save()
            })
            newAcc.following.forEach(async (followingId) => {
                const following = await users.findById(followingId);
                const index = following.followers.indexOf(curUserId);
                // console.log(index);
                following.followers.splice(index, 1);
                await following.save()
            })
            //remove myself from all likes later

            //delete account
            const deletedUser = await newAcc.deleteOne()
            const createDeletedAccEntry = await DeletedAccounts.create({
                AccountOwner: deletedUser._id,
                user: deletedUser,
                posts: findDeltedPosts
            })
            await searchAcc.deleteOne();
            return res.status(200).json({ success: true, message: "account restore sucessfully" })
        }

        //

    } catch (error) {
        console.log(error);
        res.status(400).json({ success: false, message: "somethong went wrong" })
    }
})
router.get("/getMyInfo", validUser, async (req, res) => {
    try {
        const curUserId = req._id;
        const userDetail = await users.findById(curUserId).populate({
            path: "posts",
            populate: {
                path: "owner"
            }
        });
        return res.status(200).json({ status: "ok", message: "user detail", userDetail })
    } catch (error) {
        console.log(error);
        return res.status(400).json({ status: "error", message: "something wents wrong", error })
    }
})
router.put("/updateProfile", validUser, async (req, res) => {
    try {
        const { name, bio, userImg } = req.body
        const curUserId = req._id;
        const user = await users.findById(curUserId);
        console.log(user);
        if (name) {
            user.name = name;
        }
        if (bio) {
            user.bio = bio;
        } if (userImg) {
            const cloudImg = await cloudinary.uploader.upload(userImg, { folder: "profileImg", resource_type: "auto" })

            user.avatar = {
                url: cloudImg.secure_url,
                publicId: cloudImg.public_id
            }
        }
        const updatedProfile = await user.save()
        res.status(200).json({ message: "updated sucessfully", success: true, status: "ok", updatedProfile })
        await sendMail("Social media website sending this mail regarding your profile update status", "<p><h3>Your profile is update succesfully<h3><p>",)
        return
    } catch (error) {
        console.log(error);
    }
})
router.post("/getUserProfile", validUser, async (req, res) => {
    try {
        const { userId } = req.body
        const user = await users.findById(userId).populate({ //notes
            path: "posts",
            populate: {
                path: "owner"
            }
        })
        console.log(user); //notes
        const fullPosts = user.posts
        const posts = fullPosts.map(item => mapPostOutput(item, req._id))
        const reversePost = posts.reverse()
        return res.status(200).json({ status: "ok", success: true, user, posts: reversePost })
    } catch (error) {
        console.log(error);
        return res.status(400).json({ message: "something went wrong", success: false, status: "error", error })
    }
})
module.exports = {
    user: router,
}