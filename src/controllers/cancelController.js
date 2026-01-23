import { Booking } from "../models/index.js";
import { DepartmentCredit, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import { refundCredits } from "../services/creditService.js";

const cancelBooking = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const booking = await Booking.findByPk(req.params.id, { transaction: t });

    if (!booking || booking.status !== 'CONFIRMED') {
      throw new Error('Only confirmed bookings can be cancelled');
    }

    // Only owner can cancel
    if (booking.userId !== req.user.id) {
      throw new Error('Not authorized to cancel this booking');
    }

    const hoursBefore =
      (new Date(booking.startTime) - new Date()) / (1000 * 60 * 60);

    // 90% refund if cancelled 48+ hours before
    if (hoursBefore >= 48) {
      // const refund = Math.floor(booking.creditsUsed * 0.9);
      const rawRefund = Math.floor(booking.creditsUsed * 0.9);
      const refund = Math.max(1, rawRefund);
      await refundCredits(booking.departmentId, refund, t);
    }

    booking.status = 'CANCELLED';
    await booking.save({ transaction: t });

    await t.commit();
    res.json({ ok: true });
  } catch (err) {
    await t.rollback();
    res.status(400).json({ error: err.message });
  }
};

export default {
  cancelBooking
}