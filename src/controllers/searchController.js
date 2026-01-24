// Search controller
import { Room, Booking } from '../models/index.js';
import { Op } from 'sequelize';
import moment from 'moment-timezone'; // npm install moment-timezone

export default {
  async searchRooms(req, res) {
    try {
      const { capacity, features, date, startTime, endTime, timezone } = req.body;

      // console.log(capacity, features, date, startTime, endTime, timezone )
      // if (!date || !startTime || !endTime || !timezone) {
      //   return res.status(400).json({ error: 'date, startTime, endTime, and timezone are required' });
      // }

      // Convert frontend local date + time + timezone to UTC
      const utcStart = convertToUTC(date, startTime, timezone);
      const utcEnd = convertToUTC(date, endTime, timezone);

      // if (utcEnd <= utcStart) {
      //   return res.status(400).json({
      //     error: 'endTime must be after startTime'
      //   });
      // }

      // Base filter
      const where = {};
      if (capacity) where.capacity = { [Op.gte]: capacity };
      if (features && features.length) where.features = { [Op.not]: null };

      // Candidate rooms
      let rooms = await Room.findAll({ where });

      // Strict features filter
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

      // Check availability in a single query
      const roomIds = rooms.map(r => r.id);
      const overlappingBookings = await Booking.findAll({
        where: {
          roomId: { [Op.in]: roomIds },
          status: { [Op.in]: ['CONFIRMED', 'PENDING'] },
          checkedOut: 0, // Only block rooms that are NOT checked out
          [Op.and]: [
            { startTime: { [Op.lt]: utcEnd } },
            { endTime: { [Op.gt]: utcStart } }
          ]
        },
        attributes: ['roomId']
      });

      const unavailableRoomIds = new Set(overlappingBookings.map(b => b.roomId));

      const availableRooms = rooms.filter(r => !unavailableRoomIds.has(r.id));

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
