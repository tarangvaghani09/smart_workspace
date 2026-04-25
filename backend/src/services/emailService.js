import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { generateIcsFile } from './icsGenerator.js';
import { Booking, User, Room, Resource, BookingResource, Department } from '../models/index.js';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure =
  String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || smtpPort === 465;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  // For STARTTLS ports like 587/2525, force TLS upgrade to avoid silent plain-SMTP failures.
  requireTLS: !smtpSecure,
  connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 20000),
  greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 20000),
  socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 20000),
  tls: smtpHost ? { servername: smtpHost } : undefined,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

transporter.verify()
  .then(() => {
    console.log('SMTP connection verified');
  })
  .catch((err) => {
    console.error('SMTP verify failed:', err?.message || err);
  });

async function getRoomTextForBooking(booking) {
  // Current schema has direct FK bookings.roomId -> Room
  const room = booking.roomId
    ? await Room.findByPk(booking.roomId)
    : null;

  return room?.name || 'No room (Device booking)';
}

async function getDepartmentNameForBooking(booking) {
  // Prefer booking.departmentId; fallback to user's department for older/incomplete booking rows.
  let departmentId = booking.departmentId || null;

  if (!departmentId && booking.userId) {
    const user = await User.findByPk(booking.userId);
    departmentId = user?.departmentId || null;
  }

  if (!departmentId) return 'N/A';

  const department = await Department.findByPk(departmentId);
  const name = department?.name ? String(department.name).trim() : '';
  return name || 'N/A';
}

// Send booking confirmation with calendar invite (IST)

async function sendBookingConfirmationEmail(bookingId) {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) throw new Error('Booking not found');

  const user = await User.findByPk(booking.userId);
  const roomText = await getRoomTextForBooking(booking);


  const bookingResources = await BookingResource.findAll({
    where: { bookingId }
  });

  let resourceText = 'None';
  if (bookingResources.length) {
    const resources = await Promise.all(
      bookingResources.map(async br => {
        const r = await Resource.findByPk(br.resourceId);
        return `${r.name} x ${br.quantity}`;
      })
    );
    resourceText = resources.filter(Boolean).join(', ');
  }

  const title = booking.title || 'Meeting';
  const departmentName = await getDepartmentNameForBooking(booking);
  const description =
    `Room: ${roomText}\n` +
    `Resources: ${resourceText}\n` +
    `Booked by: ${user.name}`;

  const icsPath = await generateIcsFile({
    uid: booking.uid,
    title,
    description,
    startTime: booking.startTime,
    endTime: booking.endTime,
    location: roomText,
    organizerEmail: user.email,
    attendeeEmail: user.email
  });

  function formatISTDateTime(startTime, endTime) {
    const dateOptions = {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    };

    const timeOptions = {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };

    const date = new Date(startTime).toLocaleDateString('en-IN', dateOptions);
    const start = new Date(startTime).toLocaleTimeString('en-IN', timeOptions);
    const end = new Date(endTime).toLocaleTimeString('en-IN', timeOptions);

    return {
      dateText: date,
      timeText: `${start} – ${end} IST`
    };
  }

  const { dateText, timeText } = formatISTDateTime(
    booking.startTime,
    booking.endTime
  );

  const mailOptions = {
    from: process.env.FROM_EMAIL || process.env.SMTP_USER,
    to: user.email,
    subject: `Booking Confirmed: ${title}`,
    html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
              <h2 style="color: #2ecc71;">✓ Booking Confirmed</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 10px; font-weight: bold; width: 30%;">Booking ID:</td>
                  <td style="padding: 10px;">${booking.uid}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold;">Department:</td>
                  <td style="padding: 10px;">${departmentName}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 10px; font-weight: bold;">Title:</td>
                  <td style="padding: 10px;">${title}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold;">Room:</td>
                  <td style="padding: 10px;">${roomText}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold;">Date:</td>
                  <td style="padding: 10px;">${dateText}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 10px; font-weight: bold;">Time:</td>
                  <td style="padding: 10px;">${timeText}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold;">Resources:</td>
                  <td style="padding: 10px;">${resourceText}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 10px; font-weight: bold;">Credits Used:</td>
                  <td style="padding: 10px;">${booking.creditsUsed}</td>
                </tr>
              </table>

              <p style="margin: 20px 0; font-size: 14px;">
                Your booking has been confirmed. The calendar invite is attached to this email.
              </p>

              <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; font-size: 12px; color: #666;">
                  If you need to cancel this booking, please do so at least 48 hours in advance to receive a 90% refund of credits.
                </p>
              </div>

              <p style="margin-top: 20px; font-size: 12px; color: #999;">
                Smart Workspace | ${new Date().toLocaleDateString('en-IN')}
              </p>
            </div>
          </body>
        </html>
      `,
    attachments: icsPath ? [{
      filename: 'booking.ics',
      path: icsPath,
      contentType: 'text/calendar; method=REQUEST; charset=UTF-8'
    }] : []
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Email sent', info.messageId);

  setTimeout(() => {
    try {
      fs.unlinkSync(icsPath);
    } catch (e) { }
  }, 10 * 60 * 1000);
}

// Send booking rejected email

async function sendBookingRejectedEmail(bookingId) {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) throw new Error('Booking not found');

  const user = await User.findByPk(booking.userId);
  const roomText = await getRoomTextForBooking(booking);

  function formatISTDateTime(startTime, endTime) {
    const dateOptions = {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    };

    const timeOptions = {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };

    const date = new Date(startTime).toLocaleDateString('en-IN', dateOptions);
    const start = new Date(startTime).toLocaleTimeString('en-IN', timeOptions);
    const end = new Date(endTime).toLocaleTimeString('en-IN', timeOptions);

    return {
      dateText: date,
      timeText: `${start} – ${end} IST`
    };
  }

  const { dateText, timeText } = formatISTDateTime(
    booking.startTime,
    booking.endTime
  );

  const bookingResources = await BookingResource.findAll({
    where: { bookingId }
  });

  let resourceText = 'None';
  if (bookingResources.length) {
    const resources = await Promise.all(
      bookingResources.map(async br => {
        const r = await Resource.findByPk(br.resourceId);
        return `${r.name} x ${br.quantity}`;
      })
    );
    resourceText = resources.filter(Boolean).join(', ');
  }

  const title = booking.title || 'Meeting';
  const departmentName = await getDepartmentNameForBooking(booking);


  const mailOptions = {
    from: process.env.FROM_EMAIL || process.env.SMTP_USER,
    to: user.email,
    subject: `Booking Rejected: ${title}`,
    html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
              <h2 style="color: #e74c3c;">✗ Booking Rejected</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 10px; font-weight: bold; width: 30%;">Booking ID:</td>
                  <td style="padding: 10px;">${booking.uid}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold;">Department:</td>
                  <td style="padding: 10px;">${departmentName}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 10px; font-weight: bold;">Title:</td>
                  <td style="padding: 10px;">${title}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold;">Room:</td>
                  <td style="padding: 10px;">${roomText}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold;">Resources:</td>
                  <td style="padding: 10px;">${resourceText}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold;">Date:</td>
                  <td style="padding: 10px;">${dateText}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 10px; font-weight: bold;">Time:</td>
                  <td style="padding: 10px;">${timeText}</td>
                </tr>
              </table>

              <div style="background-color: #ffe6e6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #c0392b;">
                  Your booking request has been rejected by an administrator.
                </p>
                <p style="margin: 10px 0 0 0; color: #c0392b; font-size: 14px;">
                  Credits have been refunded to your department account.
                </p>
              </div>

              <p style="margin: 20px 0; font-size: 14px;">
                If you have any questions regarding this rejection, please contact the administrator.
              </p>

              <p style="margin-top: 20px; font-size: 12px; color: #999;">
                Smart Workspace | ${new Date().toLocaleDateString('en-IN')}
              </p>
            </div>
          </body>
        </html>
      `
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Rejection email sent', info.messageId);
}

// Send booking expired email (approval not granted before start time)

async function sendBookingExpiredEmail(bookingId) {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) throw new Error('Booking not found');

  const user = await User.findByPk(booking.userId);
  if (!user) throw new Error('User not found');

  const roomText = await getRoomTextForBooking(booking);

  function formatISTDateTime(startTime, endTime) {
    const dateOptions = {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    };

    const timeOptions = {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };

    const date = new Date(startTime).toLocaleDateString('en-IN', dateOptions);
    const start = new Date(startTime).toLocaleTimeString('en-IN', timeOptions);
    const end = new Date(endTime).toLocaleTimeString('en-IN', timeOptions);

    return {
      dateText: date,
      timeText: `${start} â€“ ${end} IST`
    };
  }

  const { dateText, timeText } = formatISTDateTime(
    booking.startTime,
    booking.endTime
  );

  const bookingResources = await BookingResource.findAll({
    where: { bookingId }
  });

  let resourceText = 'None';
  if (bookingResources.length) {
    const resources = await Promise.all(
      bookingResources.map(async br => {
        const r = await Resource.findByPk(br.resourceId);
        return r ? `${r.name} x ${br.quantity}` : null;
      })
    );
    resourceText = resources.filter(Boolean).join(', ');
  }

  const title = booking.title || 'Meeting';
  const departmentName = await getDepartmentNameForBooking(booking);

  const mailOptions = {
    from: process.env.FROM_EMAIL || process.env.SMTP_USER,
    to: user.email,
    subject: `Booking Expired: ${title}`,
    html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
              <h2 style="color: #f59e0b;">Booking Expired</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 10px; font-weight: bold; width: 30%;">Booking ID:</td>
                  <td style="padding: 10px;">${booking.uid}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold;">Department:</td>
                  <td style="padding: 10px;">${departmentName}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 10px; font-weight: bold;">Title:</td>
                  <td style="padding: 10px;">${title}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold;">Room:</td>
                  <td style="padding: 10px;">${roomText}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 10px; font-weight: bold;">Resources:</td>
                  <td style="padding: 10px;">${resourceText}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold;">Date:</td>
                  <td style="padding: 10px;">${dateText}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 10px; font-weight: bold;">Time:</td>
                  <td style="padding: 10px;">${timeText}</td>
                </tr>
              </table>

              <div style="background-color: #fffbeb; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e;">
                  Your request wasn't approved before the booking start time, so it expired automatically.
                </p>
                <p style="margin: 10px 0 0 0; color: #92400e; font-size: 14px;">
                  Any locked credits and held resources have been released. Please book again for a new time slot.
                </p>
              </div>

              <p style="margin-top: 20px; font-size: 12px; color: #999;">
                Smart Workspace | ${new Date().toLocaleDateString('en-IN')}
              </p>
            </div>
          </body>
        </html>
      `
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Expired booking email sent', info.messageId);
}

// Send no-show notification email

async function sendNoShowNotificationEmail(bookingId) {
  try {
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      console.warn('Booking not found for no-show email', { bookingId });
      return;
    }

    const roomText = await getRoomTextForBooking(booking);

    const user = await User.findByPk(booking.userId);
    if (!user) {
      console.warn('User not found for no-show email', { bookingId });
      return;
    }

    function formatISTDateTime(startTime, endTime) {
      const dateOptions = {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      };

      const timeOptions = {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };

      const date = new Date(startTime).toLocaleDateString('en-IN', dateOptions);
      const start = new Date(startTime).toLocaleTimeString('en-IN', timeOptions);
      const end = new Date(endTime).toLocaleTimeString('en-IN', timeOptions);

      return {
        dateText: date,
        timeText: `${start} – ${end} IST`
      };
    }

    const { dateText, timeText } = formatISTDateTime(
      booking.startTime,
      booking.endTime
    );

    const bookingResources = await BookingResource.findAll({
      where: { bookingId }
    });

    let resourceText = 'None';
    if (bookingResources.length) {
      const resources = await Promise.all(
        bookingResources.map(async br => {
          const r = await Resource.findByPk(br.resourceId);
          return `${r.name} x ${br.quantity}`;
        })
      );
      resourceText = resources.filter(Boolean).join(', ');
    }

    const title = booking.title || 'Meeting';
    const departmentName = await getDepartmentNameForBooking(booking);

    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: user.email,
      subject: 'Booking Marked as No-Show',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
              <h2 style="color: #f39c12;">⚠ No-Show Recorded</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 10px; font-weight: bold; width: 30%;">Booking ID:</td>
                  <td style="padding: 10px;">${booking.uid}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold;">Department:</td>
                  <td style="padding: 10px;">${departmentName}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 10px; font-weight: bold;">Title:</td>
                  <td style="padding: 10px;">${title}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold;">Room:</td>
                  <td style="padding: 10px;">${roomText}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 10px; font-weight: bold;">Devices/Resources:</td>
                  <td style="padding: 10px;">${resourceText}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold;">Date:</td>
                  <td style="padding: 10px;">${dateText}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 10px; font-weight: bold;">Time:</td>
                  <td style="padding: 10px;">${timeText}</td>
                </tr>
              </table>

              <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f39c12;">
                <p style="margin: 0; color: #856404;">
                  Your booking on <strong>${dateText} at ${timeText}</strong> was marked as no-show because you did not check in.
                </p>
                <p style="margin: 10px 0 0 0; color: #856404; font-size: 14px;">
                  Credits (${booking.creditsUsed}) will be forfeited as per the booking policy.
                </p>
              </div>

              <p style="margin: 20px 0; font-size: 14px;">
                To avoid no-show penalties in the future, please check in before your booking start time or cancel in advance if you can't attend.
              </p>

              <p style="margin-top: 20px; font-size: 12px; color: #999;">
                Smart Workspace | ${new Date().toLocaleDateString('en-IN')}
              </p>
            </div>
          </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.info('No-show email sent', { bookingId, email: user.email });
  } catch (err) {
    console.error('Error sending no-show email', { bookingId, error: err.message });
  }
}

async function sendPasswordResetEmail({ to, name, resetLink }) {
  if (!to || !resetLink) {
    throw new Error('Missing reset email payload');
  }

  const mailOptions = {
    from: process.env.FROM_EMAIL || process.env.SMTP_USER,
    to,
    subject: 'Reset your Smart Workspace password',
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
            <h2 style="color: #1d4ed8;">Password Reset Request</h2>
            <p>Hello ${name || 'User'},</p>
            <p>Click the link below to reset your password. This link expires in 20 minutes.</p>
            <p><a href="${resetLink}">${resetLink}</a></p>
            <p>If you did not request this, you can ignore this email.</p>
          </div>
        </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
}

export default {
  sendBookingConfirmationEmail,
  sendBookingRejectedEmail,
  sendBookingExpiredEmail,
  sendNoShowNotificationEmail,
  sendPasswordResetEmail
};
