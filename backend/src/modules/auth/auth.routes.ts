import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbRepository } from '../../db/repository';
import { config } from '../../config';
import {
  requireAuth,
  requireAdmin,
  requireStaffOrAdmin,
  validatePassword,
  AuthenticatedRequest,
} from '../../middlewares/auth.middleware';
import { Role } from '../../types';

const router = Router();

// 1. REGISTER
router.post('/register', async (req, res): Promise<void> => {
  try {
    const { email, password, name, role = 'CUSTOMER', phone, companyName, address } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        message: 'Email, password, and name are required fields',
      });
      return;
    }

    // Password validation regex
    if (!validatePassword(password)) {
      res.status(400).json({
        success: false,
        message:
          'Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, and 1 special character',
      });
      return;
    }

    // Check unique email
    const existing = await dbRepository.findUserByEmail(email);
    if (existing) {
      res.status(409).json({
        success: false,
        message: 'A user with this email address already exists',
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await dbRepository.createUser({
      email,
      passwordHash,
      name,
      role: (role as Role) || 'CUSTOMER',
      phone: phone || null,
      companyName: companyName || null,
      address: address || null,
    });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        companyName: user.companyName,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        companyName: user.companyName,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. LOGIN
router.post('/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    const user = await dbRepository.findUserByEmail(email);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        companyName: user.companyName,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        companyName: user.companyName,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. GET CURRENT USER
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const user = await dbRepository.findUserById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        companyName: user.companyName,
        phone: user.phone,
        address: user.address,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. FORGOT PASSWORD (TOKEN GENERATION & MOCK EMAIL SERVICE)
router.post('/forgot-password', async (req, res): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    const user = await dbRepository.findUserByEmail(email);
    // Generic response to prevent user enumeration
    if (!user) {
      res.json({
        success: true,
        message:
          'If an account exists with this email, a password reset link has been dispatched.',
      });
      return;
    }

    const resetToken = `reset-${Date.now()}-${Math.random().toString(36).substr(2, 10)}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    await dbRepository.createPasswordResetToken(user.id, resetToken, expiresAt);

    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;

    // Mock Email Service Log
    console.log(`[MOCK EMAIL SERVICE] Sending Password Reset to: ${user.email}`);
    console.log(`[MOCK EMAIL SERVICE] Reset URL: ${resetUrl}`);

    res.json({
      success: true,
      message:
        'If an account exists with this email, a password reset link has been dispatched.',
      // Included in development for seamless local testing
      debug: {
        resetToken,
        resetUrl,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. RESET PASSWORD
router.post('/reset-password', async (req, res): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Token and newPassword are required',
      });
      return;
    }

    if (!validatePassword(newPassword)) {
      res.status(400).json({
        success: false,
        message:
          'Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, and 1 special character',
      });
      return;
    }

    const validToken = await dbRepository.findValidResetToken(token);
    if (!validToken) {
      res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired',
      });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await dbRepository.updateUserPassword(validToken.userId, newHash);
    await dbRepository.markResetTokenUsed(token);

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. ADMIN: LIST ALL USERS
router.get('/users', requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  try {
    const users = await dbRepository.listUsers();
    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. STAFF/ADMIN: LIST CUSTOMERS
router.get(
  '/customers',
  requireAuth,
  requireStaffOrAdmin,
  async (_req, res): Promise<void> => {
    try {
      const customers = await dbRepository.listCustomers();
      res.json({ success: true, customers });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

export default router;
