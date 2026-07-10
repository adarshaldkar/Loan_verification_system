import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/auth';

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
