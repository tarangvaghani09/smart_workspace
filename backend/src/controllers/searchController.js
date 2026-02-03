// Search controller
import { Room, Booking, BookingRoom, User } from '../models/index.js';
import { Op } from 'sequelize';
import moment from 'moment-timezone';

function isWithinRoomsHours(dateStr, timeStr, timezone) {
  if (!timeStr) return true; // No time provided treat as valid

  const local = moment.tz(
    `${dateStr} ${timeStr}`,
    'YYYY-MM-DD h:mm a',
    timezone
  );

  const hour = local.hour();
  const minute = local.minute();

  const isStartValid = hour >= 9;
  const isEndValid =
    hour < 17 || (hour === 17 && minute === 0);

  return isStartValid && isEndValid;
}

export default {
  async searchRooms(req, res) {
    try {
      const {
        capacity,
        date,
        startTime,
        endTime,
        timezone
      } = req.body;

      const isStartValid = isWithinRoomsHours(date, startTime, timezone);
      const isEndValid = isWithinRoomsHours(date, endTime, timezone);

      // ONLY check if user provided a time

      if (startTime && !isStartValid) {
        return res.status(400).json({ error: 'Start time is outside rooms hours (9 AM - 5 PM)' });
      }

      if (endTime && !isEndValid) {
        return res.status(400).json({ error: 'End time is outside rooms hours (9 AM - 5 PM)' });
      }

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

      /* ---------- CANDIDATE ROOMS ---------- */
      let rooms = await Room.findAll({ where });

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

// Converts date + time in any timezone to UTC ISO string
function convertToUTC(dateStr, timeStr, timezone) {
  // moment.tz can parse "5:00 am" correctly
  const local = moment.tz(`${dateStr} ${timeStr}`, 'YYYY-MM-DD h:mm a', timezone);
  return local.utc().toDate(); // return JS Date in UTC
}
