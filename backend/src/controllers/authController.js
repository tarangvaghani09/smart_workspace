import jwt from 'jsonwebtoken';
import { Department, User } from '../models/index.js';
import department from '../models/department.js';
import bcrypt from 'bcryptjs';
import { loginSchema, registerSchema } from '../validators/auth.schema.js';
import { getOrCreateCredit } from '../services/creditService.js';

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

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
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
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        // role: user.role
      }
    });

  } catch (err) {
    res.status(500).json({ message: "Login failed" });
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

    // Find department by ID
    const department = await Department.findByPk(departmentId);

    if (!department) {
      return res.status(400).json({ message: 'Invalid department' });
    }

    // const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      // password: hashedPassword,
      password,
      role: 'junior',
      departmentId
    });

    await getOrCreateCredit(departmentId);

    res.status(201).json({
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
    res.status(500).json({ message: 'Registration failed' });
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
          required: false // IMPORTANT: allows user without department
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const response = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId || null,
      department: user.Department
        ? {
          id: user.Department.id,
          name: user.Department.name
        }
        : null
    };

    res.json(response);

  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export default {
  login,
  register,
  getMe
}