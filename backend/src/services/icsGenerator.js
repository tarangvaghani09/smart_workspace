import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

// Required to emulate __dirname in ES modules

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Escape text for ICS format

function escapeICS(text = '') {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

// Format date to IST (Asia/Kolkata) for ICS
// Output: YYYYMMDDTHHMMSS

function formatDateToICSWithIST(date) {
  const dt = new Date(date);

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(dt);

  const map = {};
  parts.forEach(p => (map[p.type] = p.value));

  return `${map.year}${map.month}${map.day}T${map.hour}${map.minute}${map.second}`;
}

// IST timezone block (REQUIRED)

function istTimezoneBlock() {
  return [
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Kolkata',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0530',
    'TZOFFSETTO:+0530',
    'TZNAME:IST',
    'DTSTART:19700101T000000',
    'END:STANDARD',
    'END:VTIMEZONE'
  ];
}

//  Generate ICS file

async function generateIcsFile({
  uid,
  title,
  description,
  startTime,
  endTime,
  location,
  organizerEmail,
  attendeeEmail
}) {
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SmartWorkspace//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    ...istTimezoneBlock(),
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatDateToICSWithIST(new Date())}`,
    `DTSTART;TZID=Asia/Kolkata:${formatDateToICSWithIST(startTime)}`,
    `DTEND;TZID=Asia/Kolkata:${formatDateToICSWithIST(endTime)}`,
    `SUMMARY:${escapeICS(title)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    `LOCATION:${escapeICS(location)}`,
    `ORGANIZER;CN=Organizer:MAILTO:${organizerEmail}`,
    `ATTENDEE;RSVP=TRUE:MAILTO:${attendeeEmail}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  const content = icsLines.join('\r\n');

  const filename = path.join(
    __dirname,
    '..',
    '..',
    'tmp',
    `${uuidv4()}.ics`
  );

  await fs.promises.writeFile(filename, content);
  return filename;
}

export { generateIcsFile };
