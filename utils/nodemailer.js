const nodemailer = require("nodemailer");
async function sendMail(subject, html,email) {
    const transport = nodemailer.createTransport({
        service: "gamil",
        host: "smtp.gmail.com",
        auth: {
            user: "devlopmentdata@gmail.com",
            pass: "ehqxujzlyvzfikui"
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