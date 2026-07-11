import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import crypto from 'crypto';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/auth';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('CRITICAL: JWT_SECRET is not defined in environment variables.');
  process.exit(1);
}

// Called from Admin Panel → registers a FIELD_AGENT under that admin
export const registerAgent = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { email, password, firstName, lastName, phone, branch } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await (prisma.user as any).create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        branch,
        role: 'FIELD_AGENT',
        adminId,  // 🔑 Link agent to the creating admin
      }
    });

    res.status(201).json({ success: true, message: 'Agent registered successfully', userId: user.id });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'production' ? undefined : error.message });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact your administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, branch: user.branch, adminId: (user as any).adminId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set JWT in HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        branch: user.branch,
        adminId: (user as any).adminId,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'production' ? undefined : error.message });
  }
};

export const logoutUser = (req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user: any = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with that email address.' });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await (prisma.user as any).update({
      where: { id: user.id },
      data: { resetPasswordOtp: otp, resetPasswordOtpExpires: expires }
    });

    const emailHtml = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f0f5fb; padding: 40px 20px; color: #333;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
          <div style="background-color: #1E3A5F; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1px;">LVMS</h1>
            <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 14px;">Loan Verification Management System</p>
          </div>
          <div style="padding: 32px 24px;">
            <h2 style="margin-top: 0; font-size: 20px; color: #1E3A5F;">Password Reset Request</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
              We received a request to reset the password for your admin account. Please use the verification code below to securely set up a new password.
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; text-align: center; margin: 30px 0;">
              <span style="font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #1E3A5F;">${otp}</span>
            </div>
            <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
              This code will expire in <strong>10 minutes</strong>. If you did not request a password reset, you can safely ignore this email and your password will remain unchanged.
            </p>
          </div>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: 'LVMS System <onboarding@resend.dev>',
      to: user.email,
      subject: 'LVMS Password Reset Code',
      html: emailHtml
    });

    res.status(200).json({ success: true, message: 'An OTP has been sent to your email.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'production' ? undefined : error.message });
  }
};

export const verifyResetOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const user: any = await prisma.user.findUnique({ where: { email } });
    
    if (!user || user.resetPasswordOtp !== otp || !user.resetPasswordOtpExpires || user.resetPasswordOtpExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    res.status(200).json({ success: true, message: 'OTP verified successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'production' ? undefined : error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user: any = await prisma.user.findUnique({ where: { email } });
    
    if (!user || user.resetPasswordOtp !== otp || !user.resetPasswordOtpExpires || user.resetPasswordOtpExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await (prisma.user as any).update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        resetPasswordOtp: null,
        resetPasswordOtpExpires: null
      }
    });

    res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'production' ? undefined : error.message });
  }
};
