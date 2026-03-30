import nodemailer from "nodemailer";

export async function sendSignupWelcomeEmail(email: string, password: string, name: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || '"InternHub Support" <noreply@internhub.com>',
    to: email,
    subject: "Welcome to InternHub - Your Account Credentials",
    text: `Hello ${name},\n\nWelcome to InternHub! Your account has been created.\n\nLogin Email: ${email}\nPassword: ${password}\n\nPlease login and change your password for security.\n\nBest regards,\nInternHub Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">Welcome to InternHub!</h2>
        <p style="color: #475569; font-size: 16px;">Hello <strong>${name}</strong>,</p>
        <p style="color: #475569; font-size: 16px;">Your account has been successfully created. You can now log in using the credentials below:</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #cbd5e1;">
          <p style="margin: 0; color: #64748b; font-size: 14px;">Email:</p>
          <p style="margin: 5px 0 15px 0; color: #1e293b; font-size: 18px; font-weight: bold;">${email}</p>
          <p style="margin: 0; color: #64748b; font-size: 14px;">Password:</p>
          <p style="margin: 5px 0 0 0; color: #1e293b; font-size: 18px; font-weight: bold;">${password}</p>
        </div>
        <p style="color: #64748b; font-size: 14px;">For security reasons, we recommend that you change your password after your first login.</p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Login Now</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">&copy; 2024 InternHub. All rights reserved.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[MAIL SERVICE] Welcome email sent to ${email}`);
  } catch (error) {
    console.error("[MAIL SERVICE] Error sending welcome email:", error);
    // Log details in development even if email fails
    console.log(`[MAIL SERVICE FALLBACK] Credentials for ${name}: Email: ${email}, Password: ${password}`);
  }
}
