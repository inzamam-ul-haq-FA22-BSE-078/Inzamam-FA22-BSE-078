const nodemailer = require('nodemailer');

// Create transporter - using Gmail (you can change this to your email service)
let transporter;

if (process.env.NODE_ENV === 'production' && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  // Production: Use real Gmail
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
} else if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  // If credentials provided, use them
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
} else {
  // Development: Mock transporter (simulate email sending)
  transporter = {
    sendMail: async (mailOptions) => {
      console.log('\n========== EMAIL SENT (MOCK MODE) ==========');
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log('==========================================\n');
      return { messageId: 'mock-' + Date.now() };
    },
  };
}

// Function to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to send OTP email
const sendOTPEmail = async (email, otp, userName = 'User') => {
  try {
    const mailOptions = {
      from: 'noreply@skillbridge.com',
      to: email,
      subject: 'Your OTP for SkillBridge Registration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">SkillBridge</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 10px 10px;">
            <p style="color: #333; font-size: 16px;">Hi ${userName},</p>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Thank you for registering with SkillBridge. To complete your email verification, please use the following One-Time Password (OTP):
            </p>
            <div style="background-color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #667eea;">
              <h2 style="color: #667eea; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h2>
            </div>
            <p style="color: #666; font-size: 12px;">
              This OTP is valid for 10 minutes only. Do not share this code with anyone.
            </p>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              If you didn't request this code, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              SkillBridge Team | © 2024
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, message: 'OTP sent successfully', otp };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, message: 'Failed to send OTP', error: error.message };
  }
};

// Function to send verification success email
const sendVerificationSuccessEmail = async (email, userName = 'User') => {
  try {
    const mailOptions = {
      from: 'noreply@skillbridge.com',
      to: email,
      subject: 'Email Verified - Welcome to SkillBridge',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">SkillBridge</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 10px 10px;">
            <p style="color: #333; font-size: 16px;">Hi ${userName},</p>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              🎉 Your email has been successfully verified! Your account is now active and ready to use.
            </p>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              You can now log in to your SkillBridge account and start learning.
            </p>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              Best regards,<br>
              The SkillBridge Team
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, message: 'Verification success email sent' };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, message: 'Failed to send email', error: error.message };
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendVerificationSuccessEmail,
};
