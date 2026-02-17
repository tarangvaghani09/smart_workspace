// Search controller
import { Room, Booking, User } from '../models/index.js';
import { Op } from 'sequelize';
import moment from 'moment-timezone';

function isWithinRoomsHours(dateStr, timeStr, timezone, mode = 'start') {
  if (!timeStr) return true; // No time provided treat as valid

  const local = moment.tz(
    `${dateStr} ${timeStr}`,
    'YYYY-MM-DD h:mm a',
    timezone
  );

  const hour = local.hour();
  const minute = local.minute();

  // Start: 09:00 <= start < 17:00
  if (mode === 'start') {
    return hour >= 9 && hour < 17;
  }

  // End: 09:00 < end <= 17:00
  const isAfterOpening = hour > 9 || (hour === 9 && minute > 0);
  const isBeforeClosingOrAtClosing = hour < 17 || (hour === 17 && minute === 0);
  return isAfterOpening && isBeforeClosingOrAtClosing;
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

      const tz = timezone && moment.tz.zone(timezone) ? timezone : 'Asia/Kolkata';
      const hasStart = Boolean(startTime);
      const hasEnd = Boolean(endTime);
      const hasTimeWindow = hasStart && hasEnd;

      if (hasStart !== hasEnd) {
        return res.status(400).json({ error: 'Provide both startTime and endTime together' });
      }

      const isStartValid = isWithinRoomsHours(date, startTime, tz, 'start');
      const isEndValid = isWithinRoomsHours(date, endTime, tz, 'end');

      // ONLY check if user provided a time

      if (startTime && !isStartValid) {
        return res.status(400).json({ error: 'Start time must be between 9:00 AM and 4:59 PM' });
      }

      if (endTime && !isEndValid) {
        return res.status(400).json({ error: 'End time must be between 9:01 AM and 5:00 PM' });
      }

      let utcStart = null;
      let utcEnd = null;
      if (hasTimeWindow) {
        // Convert frontend local date + time + timezone to UTC
        utcStart = convertToUTC(date, startTime, tz);
        utcEnd = convertToUTC(date, endTime, tz);

        if (!utcStart || !utcEnd || Number.isNaN(utcStart.getTime()) || Number.isNaN(utcEnd.getTime())) {
          return res.status(400).json({ error: 'Invalid date/time format for selected timezone' });
        }
        if (utcEnd <= utcStart) {
          return res.status(400).json({ error: 'End time must be after start time' });
        }
      }

      /* ---------- BASE FILTER ---------- */
      const user = await User.findByPk(req.user.id);
      const where = {
        type: { [Op.ne]: 'spare' } // hide spare rooms
      };
      if (!user || user.role !== 'admin') {
        where.isActive = 1;
      }
      if (capacity) where.capacity = { [Op.gte]: capacity };

      /* ---------- CANDIDATE ROOMS ---------- */
      let rooms = await Room.findAll({ where });

      if (rooms.length === 0) return res.json([]);

      /* ---------- AVAILABILITY CHECK ---------- */
      if (!hasTimeWindow) {
        console.log(`Search found ${rooms.length} rooms (no time window filter)`);
        return res.json(rooms);
      }

      const roomIds = rooms.map(r => r.id);
      const overlappingBookings = await Booking.findAll({
        where: {
          status: { [Op.in]: ['CONFIRMED', 'PENDING'] },
          checkedOut: false,
          roomId: { [Op.in]: roomIds },
          [Op.and]: [
            { startTime: { [Op.lt]: utcEnd } },
            { endTime: { [Op.gt]: utcStart } }
          ]
        }
      });

      /* ---------- EXCLUDE UNAVAILABLE ROOMS ---------- */
      const unavailableRoomIds = new Set();

      for (const booking of overlappingBookings) {
        if (booking.roomId) unavailableRoomIds.add(booking.roomId);
      }

      const availableRooms = rooms.filter(
        r => !unavailableRoomIds.has(r.id)
      );

      console.log(`Search found ${availableRooms.length} rooms`);
      return res.json(availableRooms);

    } catch (error) {
      console.error('Error searching rooms:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Converts date + time in any timezone to UTC ISO string
function convertToUTC(dateStr, timeStr, timezone) {
  // moment.tz can parse "5:00 am" correctly
  const local = moment.tz(`${dateStr} ${timeStr}`, 'YYYY-MM-DD h:mm a', timezone);
  return local.utc().toDate(); // return JS Date in UTC
}
