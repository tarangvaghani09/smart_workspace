import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Department, PasswordResetToken, User } from '../models/index.js';
import { changePasswordSchema, forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from '../validators/auth.schema.js';
import { getOrCreateCredit } from '../services/creditService.js';
import { emailQueue } from '../queues/emailQueue.js';

const resetEmailSuccessMessage = 'If this email exists, reset link has been sent.';

const login = async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors
      });
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({ where: { email: email.trim() } });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.departmentId) {
      return res.status(403).json({ message: 'User is not assigned to a department' });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        departmentId: user.departmentId
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        // role: user.role
      }
    });

  } catch (err) {
    return res.status(500).json({ message: "Login failed" });
  }
};

const register = async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors
      });
    }

    const { name, email, password, departmentId } = parsed.data;

    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Resolve department by id only
    const department = await Department.findByPk(departmentId);

    if (!department) {
      return res.status(400).json({ message: 'Invalid department' });
    }

    if (!department.isActive) {
      return res.status(403).json({ message: "Department is not active" })
    }

    // const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      // password: hashedPassword,
      password,
      role: 'junior',
      departmentId: department.id
    });

    // await getOrCreateCredit(department.id);

    return res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        department: {
          id: department.id,
          name: department.name
        }
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Registration failed' });
  }
}

// export const getMe = async (req, res) => {
//   try {
//     const user = req.user; // already validated
//     // console.log("user", user);
//     res.json({
//       user: {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         role: user.role
//       }
//     });
//     // console.log('get Me endpoint user:', user);

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

export const getMe = async (req, res) => {
  try {
    // req.user comes from auth middleware (JWT validated)
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'role', 'departmentId'],
      include: [
        {
          model: Department,
          attributes: ['id', 'name'],
          required: true
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.departmentId || !user.Department) {
      return res.status(403).json({ message: 'User is not assigned to a department' });
    }

    const response = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      department: {
        id: user.Department.id,
        name: user.Department.name
      }
    };

    return res.json(response);

  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors
      });
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await User.findByPk(req.user.id);
    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('changePassword error:', err);
    return res.status(500).json({ message: 'Failed to change password' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors
      });
    }

    const { email } = parsed.data;
    const user = await User.findOne({ where: { email } });

    // Always return neutral success message (no user enumeration)
    if (!user || !user.isActive) {
      return res.json({ message: resetEmailSuccessMessage });
    }

    await PasswordResetToken.update(
      { usedAt: new Date() },
      { where: { userId: user.id, usedAt: null } }
    );

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000);

    await PasswordResetToken.create({
      userId: user.id,
      tokenHash,
      expiresAt
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password/${rawToken}`;
    await emailQueue.add('password-reset', {
      to: user.email,
      name: user.name || 'User',
      resetLink
    });
    return res.json({ message: resetEmailSuccessMessage });
  } catch (err) {
    console.error('forgotPassword error:', err);
    return res.json({ message: resetEmailSuccessMessage });
  }
};

const resetPassword = async (req, res) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors
      });
    }

    const { token, newPassword } = parsed.data;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetRow = await PasswordResetToken.findOne({
      where: { tokenHash, usedAt: null }
    });

    if (!resetRow) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    if (new Date(resetRow.expiresAt) <= new Date()) {
      await resetRow.update({ usedAt: new Date() });
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const user = await User.findByPk(resetRow.userId);
    if (!user || !user.isActive) {
      await resetRow.update({ usedAt: new Date() });
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = newPassword;
    await user.save();

    await resetRow.update({ usedAt: new Date() });

    return res.json({ message: 'Password reset successful. Please login.' });
  } catch (err) {
    console.error('resetPassword error:', err);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
};

export default {
  login,
  register,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword
}
