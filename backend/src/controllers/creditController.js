import { DepartmentCredit, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

const getCredits = async (req, res) => {
  try {
    const user = req.user;

    // console.log('credit', user)

    //  Admins don't have credits
    // if (user.role === 'admin') {
    //   return res.json({
    //     availableCredits: 0,
    //     lockedCredits: 0,
    //     month: null,
    //     year: null,
    //     message: 'Admins do not use department credits'
    //   });
    // }

    if (!user.departmentId) {
      return res.status(400).json({
        error: 'User does not belong to a department'
      });
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const credit = await DepartmentCredit.findOne({
      where: {
        departmentId: user.departmentId,
        month,
        year
      }
    });

    if (!credit) {
      return res.json({
        availableCredits: 0,
        lockedCredits: 0,
        month,
        year
      });
    }

    // console.log('Credits fetched:', credit);
    res.json({
      availableCredits: credit.availableCredits,
      lockedCredits: credit.lockedCredits,
      month,
      year
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export default {
  getCredits
}