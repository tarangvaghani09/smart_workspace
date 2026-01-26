import { User } from "../models/index.js";

export const requireAdmin = async (req, res, next) => {
  const user = await User.findByPk(req.user.id);

  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  next();
};