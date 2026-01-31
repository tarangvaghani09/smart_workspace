// Search controller
import { Room, Booking, BookingRoom, User } from '../models/index.js';
import { Op } from 'sequelize';
import moment from 'moment-timezone';

export default {
  async searchRooms(req, res) {
    try {
      const {
        capacity,
        features,
        date,
        startTime,
        endTime,
        timezone
      } = req.body;

      // Convert frontend local date + time + timezone to UTC
      const utcStart = convertToUTC(date, startTime, timezone);
      const utcEnd = convertToUTC(date, endTime, timezone);

      /* ---------- BASE FILTER ---------- */
      const user = await User.findByPk(req.user.id);
      const where = {};
      if (!user || user.role !== 'admin') {
        where.isActive = 1;
      }
      if (capacity) where.capacity = { [Op.gte]: capacity };
      if (features && features.length) where.features = { [Op.not]: null };

      /* ---------- CANDIDATE ROOMS ---------- */
      let rooms = await Room.findAll({ where });

      /* ---------- STRICT FEATURES FILTER ---------- */
      if (features && features.length) {
        const fLower = features.map(f => f.toLowerCase());

        rooms = rooms.filter(r => {
          if (!r.features) return false;

          const roomFeatures = r.features
            .split(',')
            .map(s => s.trim().toLowerCase());

          return fLower.every(f => roomFeatures.includes(f));
        });
      }

      if (rooms.length === 0) return res.json([]);

      /* ---------- AVAILABILITY CHECK ---------- */
      const roomIds = rooms.map(r => r.id);

      const overlappingBookings = await Booking.findAll({
        where: {
          status: { [Op.in]: ['CONFIRMED', 'PENDING'] },
          checkedOut: false,
          [Op.and]: [
            { startTime: { [Op.lt]: utcEnd } },
            { endTime: { [Op.gt]: utcStart } }
          ]
        },
        include: [
          {
            model: Room,
            attributes: ['id'],
            where: {
              id: { [Op.in]: roomIds }
            },
            through: { attributes: [] }
          }
        ]
      });

      /* ---------- EXCLUDE UNAVAILABLE ROOMS ---------- */
      const unavailableRoomIds = new Set();

      for (const booking of overlappingBookings) {
        for (const room of booking.Rooms) {
          unavailableRoomIds.add(room.id);
        }
      }

      const availableRooms = rooms.filter(
        r => !unavailableRoomIds.has(r.id)
      );

      console.log(`Search found ${availableRooms.length} rooms`);
      res.json(availableRooms);

    } catch (error) {
      console.error('Error searching rooms:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Converts "date" + "time" in any timezone to UTC ISO string
function convertToUTC(dateStr, timeStr, timezone) {
  // moment.tz can parse "5:00 am" correctly
  const local = moment.tz(`${dateStr} ${timeStr}`, 'YYYY-MM-DD h:mm a', timezone);
  return local.utc().toDate(); // return JS Date in UTC
}
