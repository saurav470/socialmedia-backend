const nodemailer = require("nodemailer");
async function sendMail(subject, html, email) {
    const transport = nodemailer.createTransport({
        service: "gamil",
        host: "smtp.gmail.com",
        auth: {
            user: "teating64@gmail.com",
            pass: "cbzesrdmillidkap"
        }
    })
    return await transport.sendMail({
        from: "devlopmentdata@gmail.com",
        to: email,
        subject: subject,
        html: html,
    })

}
module.exports = {
    sendMail
}