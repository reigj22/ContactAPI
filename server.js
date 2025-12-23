import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"), false);
    },
  })
);

app.use(express.json());

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.post("/contact", async (req, res) => {
  const { name, email, phone, message } = req.body;

  console.log("Incoming body:", req.body);

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    await transporter.sendMail({
      from: `"Website Contact" <${process.env.SMTP_USER}>`,
      to: process.env.TO_EMAIL,
      replyTo: email,
      subject: "New contact message from SADEGRE",
      html: `
        <h3>New Contact Form Submission From SADEGRE Website</h3>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone || "-"}</p>
        <p><b>Message:</b><br>${message}</p>
      `,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("Email error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Failed to send email." });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Contact API running on port ${process.env.PORT}`);
  console.log("USER:", JSON.stringify(process.env.SMTP_USER));
  console.log("PASS LENGTH:", process.env.SMTP_PASS.length);
});
