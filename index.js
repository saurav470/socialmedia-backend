const cluster = require("cluster")
const os = require("os");
const PORT = process.env.PORT || 8000
const mongoose = require("mongoose")
const totalcpus = os.cpus().length

const dotenv = require("dotenv");
const express = require("express");
const server = express();
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const compression = require("compression")
const moment = require('moment-timezone');
const cors = require("cors")
const cloudinary = require("cloudinary").v2
const path = require("path")
const fs = require("fs")
const helmet = require("helmet")
const rateLimit = require('express-rate-limit');
if (cluster.isPrimary) {
    for (let i = 0; i < totalcpus; i++) {
        cluster.fork();
    }
    cluster.on("exit", () => {
        cluster.fork()
    })
} else {
    //module export

    // rate limit exports for middelware signup and post


    //file export
    const { connectDb } = require("./connection.js");
    const { authRouter } = require("./routes/authRouter.js");
    const { post } = require("./routes/postsRouter.js");
    const { user } = require("./routes/userRouter.js");
    // const rateLimit = require("express-rate-limit")
    // env configuration
    dotenv.config("./.env");


    //middel ware
    const limiter = rateLimit({
        windowMs: 60 * 20 * 1000,
        max: 5,
        message: 'Too many visit this ip address',
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false
    })
    server.use((req, res, next) => {
        const val = req.headers['sec-ch-ua-mobile']
        if (val === "?1") {
            res.status(400).json({ message: "this site not allowed for mobile phone till now its in development mode of esponsive site" })
        } else {
            next()
        }
    })
    server.use(cors({
        credentials: true,   //notes
        origin: "http://localhost:3000"
    }));
    server.use(helmet())
    server.use(compression());
    server.use(limiter)
    server.use(express.json({ limit: '50mb' }));
    server.use(cookieParser());
    const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });


    morgan.token('date', (req, res) => {
        return moment().tz('Asia/Kolkata').format();
    });
    morgan.token("ip", (req, res) => {
        return req.ip
    })
    morgan.token("device", (req, res) => {
        return req.headers["sec-ch-ua-platform"]
    })

    morgan.format('myformat', '[:date [Asia/Kolkata]] ":method :url" :status :res[content-length] :response-time ms  :ip ipAdress :device userDevice');

    server.use(morgan('myformat', { stream: accessLogStream }));


    //database connection 
    connectDb(process.env.MONGODB_URL);
    // cloudinary
    //work on .env for this
    try {
        cloudinary.config({
            cloud_name: "dotj5jbgm",
            api_key: "962794451396716",
            api_secret: "EhvjNg9w1pEeBnZ01L4AaGJLB4Y",
        })
        console.log("connection to cloudinary succesful");
    } catch (error) {
        console.log("connection failed to cloudinary", error);
    }

    //api
    server.get("/", (req, res) => {

        res.json({ ok: "ok" })
    })

    server.use("/api/v1/auth", authRouter);
    server.use("/api/v1", post);
    server.use("/api/v1", user)


    server.listen(PORT, () => {
        console.log(`server start on ${process.env.PORT}`);
    })
    const SERVER = server.listen(PORT, () => {
        console.log(`server start on ${process.env.PORT}`);
    })

    function Peacefull() {
        SERVER.close((err) => {
            server.shuttingDown = true
            if (err) {
                console.error('Error while shutting down server:', err)
                process.exit(1)
            }

            mongoose.connection.close()
                .then(() => {
                    console.log('Mongoose connection closed.');
                    process.exit(0); // Optionally exit the process
                })
                .catch((error) => {
                    console.error('Error closing Mongoose connection:', error);
                    process.exit(1); // Optionally exit the process with an error code
                });
            console.log("server stop without interupet");
            process.exit(0)
        })
    }
    process.on('SIGINT', Peacefull);
    process.on('SIGTERM', Peacefull);
}