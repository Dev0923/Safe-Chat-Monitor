import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

export const sendEmail = async (recipientEmail, childName, riskLevel, messageContent) => {
  try {
    // Skip if email is not configured
    if (!process.env.MAIL_USERNAME || process.env.MAIL_USERNAME === 'your_email@gmail.com') {
      console.log('Email not configured, skipping email notification');
      return false;
    }

    const mailOptions = {
      from: process.env.MAIL_USERNAME,
      to: recipientEmail,
      subject: `🚨 ${riskLevel} Risk Alert - ${childName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${riskLevel === 'HIGH' ? '#dc2626' : '#f59e0b'};">
            ${riskLevel} Risk Alert Detected
          </h2>
          <p>A message from <strong>${childName}</strong> has been flagged as <strong>${riskLevel} risk</strong>.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Message Content:</h3>
            <p style="font-style: italic;">"${messageContent.substring(0, 200)}${messageContent.length > 200 ? '...' : ''}"</p>
          </div>
          
          <p>Please log in to your Child Safety Monitor account to review this alert and take appropriate action.</p>
          
          <a href="http://localhost:3000/dashboard" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
            View Alert
          </a>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            This is an automated alert from Child Safety Monitor. If you wish to disable email alerts, you can do so in your account settings.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('Send email error:', error);
    return false;
  }
};
