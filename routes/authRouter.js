const express = require("express");
const { users } = require("../model/User");
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken")
const cloudinary = require("cloudinary").v2
const { sendMail } = require("../utils/nodemailer");


router.post("/signup", async (req, res) => {
    try {
        if (process?.server?.shuttingDown) {
            return res.status(503).json({ message: 'Server is closing. Please try again later.' });
        }
        const { email, password, name, userImg } = req.body;
        if (!email || !password || !name || !userImg) {
            return res.status(400).json({ success: false, message: "error in signup cntroller all field are requierd" })
        }
        const result = await Promise.all([users.findOne({ email }), bcrypt.hash(password, 10)])
        // const oldUser = await users.findOne({ email });
        const oldUser = result[0]
        if (oldUser) {
            return res.status(400).json({ success: false, message: "user exist please try with diffrent email for signup" })
        }

        // const hashedPassword = await bcrypt.hash(password, 10);
        const hashedPassword = result[1]
        const cloudImg = await cloudinary.uploader.upload(userImg, { folder: "profileImg", resource_type: "auto" })
        const avatar = {
            url: cloudImg.secure_url,
            publicId: cloudImg.public_id
        }

        const user = await users.create({
            name,
            email,
            password: hashedPassword,
            avatar
        })
        res.status(201).json({
            status: "ok", statusCode: "201", user,
            success: true
        })
        await sendMail("Account created in Social Media Website", `<p><h3>welcome to social media website</h3><h3>your account sucessfuly created </h3><h3>your user name ${user.name} </h3><a href=${user.avatar.url}>click heare to see your profile image </a></p>`, user.email)
        return
    } catch (err) {
        console.log(err);
        return res.status(400).json({
            success: false,
            message: "error in signup controller ",
            error: err
        })
    }
})

router.post("/login", async (req, res) => {
    try {
        if (process?.server?.shuttingDown) {
            return res.status(503).json({ message: 'Server is closing. Please try again later.' });
        }
        const { email, password } = req.body;
        console.log(email, password);
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "error in signup cntroller all field are requierd" })
        }
        const user = await users.findOne({ email });
        // console.log(user);
        if (!user) {
            return res.status(404).json({ success: false, message: "user not register" });
        }
        const matched = await bcrypt.compare(password, user.password);
        // console.log(matched);
        if (!matched) {
            return res.status(403).json({
                status: "error",
                success: false,
                message: "Incorrect credentials",

            })
        }

        const accessToken = jwt.sign({ _id: user._id }, process.env.SECRET_KEY, { algorithm: 'HS256' })
        // const refreshToken = jwt.sign({ _id: user._id }, process.env.REFRESH_SECRET_KEY, { algorithm: 'HS256', expiresIn: "1y" })
        // res.cookie("jwt", refreshToken, {
        //     httpOnly: true,
        //     // secure: true,

        // })
        return res.json({ status: "ok", statusCode: "200", accessToken })
        // return accessToken

    } catch (err) {
        return res.status(400).json({
            success: false,
            message: "error in login controller ",
            error: err,
        })

    }
})

// router.get("/refresh", async (req, res) => {
//     // const { refreshToken } = req.body;
//     console.log(req.cookies);
//     if (req.cookies?.jwt) {
//         try {
//             const refreshToken = req.cookies.jwt;
//             console.log(refreshToken);
//             const refVerify = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY, { algorithm: 'HS256' })

//             const _id = refVerify._id;
//             const accessToken = jwt.sign({ _id }, process.env.SECRET_KEY, { algorithm: 'HS256', expiresIn: "20m" })
//             return res.status(201).json({ status: "ok", statusCode: "201", success: true, message: "token created", accessToken, })

//         } catch (err) {
//             return res.json({ status: "error", statusCode: "401", success: false, message: "invalid token", err, })
//         }
//     }
//     else {
//         return res.json({ status: "error", statusCode: "400", message: "refreshToken is requierd" })
//     }

// })



module.exports = {
    authRouter: router,
}
