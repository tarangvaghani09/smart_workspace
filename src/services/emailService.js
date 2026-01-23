import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { generateIcsFile } from './icsGenerator.js';
import { Booking, User, Room, Resource, BookingResource } from '../models/index.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Send booking confirmation with calendar invite (IST)
 */
async function sendBookingConfirmationEmail(bookingId) {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) throw new Error('Booking not found');

  const user = await User.findByPk(booking.userId);
  let room = null;
  if (booking.roomId) {
    room = await Room.findByPk(booking.roomId);
  }

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
  const roomText = room ? room.name : 'No room (Device booking)';
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
                  <td style="padding: 10px; font-weight: bold;">Title:</td>
                  <td style="padding: 10px;">${title}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
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

  // cleanup
  setTimeout(() => {
    try {
      fs.unlinkSync(icsPath);
    } catch (e) { }
  }, 10 * 60 * 1000);
}

async function sendBookingRejectedEmail(bookingId) {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) throw new Error('Booking not found');

  const user = await User.findByPk(booking.userId);
  let room = null;
  if (booking.roomId) {
    room = await Room.findByPk(booking.roomId);
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
  const roomText = room ? room.name : 'No room (Device booking)';


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
                  <td style="padding: 10px; font-weight: bold;">Title:</td>
                  <td style="padding: 10px;">${title}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
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

/**
 * Send no-show notification email
 */
async function sendNoShowNotificationEmail(bookingId) {
  try {
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      console.warn('Booking not found for no-show email', { bookingId });
      return;
    }

    let room = null;
    if (booking.roomId) {
      room = await Room.findByPk(booking.roomId);
    }
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

    const roomText = room ? room.name : 'No room (Device booking)';

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

export default {
  sendBookingConfirmationEmail,
  sendBookingRejectedEmail,
  sendNoShowNotificationEmail
};
