const transporter = require("./transporter");

async function sendMails(email, url) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Email Verification ✔",
    text: "Please verify your email",
    html: `<h1>Please click this link to verify your email</h1>
      <a href=${url}>${url}</a>`,
  });
}
module.exports = sendMails;
