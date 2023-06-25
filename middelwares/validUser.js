//imports
const jwt = require("jsonwebtoken")
const validUser = async (req, res, next) => {
    const authHeader = req.get("authorization")
    if (authHeader) {
        const token = authHeader.split("Bearer ")[1]
        // console.log(token);
        try {
            const verifyResult = jwt.verify(token, process.env.SECRET_KEY, { algorithm: 'HS256' })
            // console.log(verifyResult);
            // return res.json({ token })
            req._id=verifyResult._id;
            next();
        } catch (err) {
            return res.status(401).json({ status:"error",statusCode:"401",success: false, message: "token invalid", err, });
        }
    } else {
        return res.status(404).json({ status:"error",statusCode:"404",message: "authorization header is requierd" })
    }


}
module.exports = {
    validUser,
}