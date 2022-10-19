const nodemailer = require("nodemailer");
const { gmailConnect } = require("../environment/config.env");


const template = `<div>{{html}}<div>`
const send = async (formTitle, to, subject, html = "Wow, It Works!", debug = false) => {

    // template generate
    html = template.replace("{{html}}", html)
    html = html.replace("{{title}}", formTitle)

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: gmailConnect,
    });

    let details = {
        from: `"${formTitle}" <${gmailConnect.user}>`,
        to: to,
        subject: subject,
        html: html,
    }

    // send mail with defined details object
    return await transporter.sendMail(details)
        .then(ok => {
            if (debug) console.log(ok)
            return ok
        })
        .catch(e => {
            if (debug) console.log(e)
            return e
        });
}


module.exports = send;