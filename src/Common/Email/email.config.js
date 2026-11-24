import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendEmail({ to, subject, text, html, attachments }) {
  try {
    const info = await transporter.sendMail({
      from: `Khaled ${process.env.EMAIL}`,
      to,
      subject,
      text,
      html,
      attachments,
    });
    console.log("Message sent: %s", info.messageId);
  } catch (err) {
    console.error("Error while sending mail:", err);
  }
}
