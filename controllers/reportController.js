const { getDb } = require('../config/database');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const express = require('express');
const app = express();

async function exportExcel(req, res) {
  try {
    const db = getDb();

    const registrations = await db
      .collection('registrations')
      .find()
      .toArray();

    registrations.sort((a, b) =>
      (a.eventName || '').localeCompare(b.eventName || '')
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Registrations');

    sheet.columns = [
      { header: 'Registration ID', key: 'registrationId', width: 22 },
      { header: 'College ID', key: 'collegeId', width: 18 },
      { header: 'Lot Number', key: 'lotNumber', width: 18 },
      { header: 'Event Name', key: 'eventName', width: 24 },
      { header: 'College Name', key: 'collegeName', width: 26 },
      { header: 'Department', key: 'department', width: 18 },
      { header: 'Staff Name', key: 'staffName', width: 18 },
      { header: 'Phone Number', key: 'staffPhone', width: 16 },
      { header: 'District', key: 'district', width: 16 },
      { header: 'Competition Name', key: 'competitionName', width: 24 },
      { header: 'Participant Names', key: 'participantNames', width: 32 },
      { header: 'Registration Date', key: 'registrationDate', width: 22 }
    ];

    sheet.spliceRows(1, 1);

    let currentEvent = '';
    const eventLotCounters = {};

    registrations.forEach((reg) => {
      if (currentEvent !== reg.eventName) {
        currentEvent = reg.eventName;

        sheet.addRow([]);

        const eventRow = sheet.addRow([
          `EVENT NAME : ${currentEvent}`
        ]);

        eventRow.font = {
          bold: true,
          size: 14
        };

        const headerRow = sheet.addRow([
          'Registration ID',
          'College ID',
          'Lot Number',
          'Event Name',
          'College Name',
          'Department',
          'Staff Name',
          'Phone Number',
          'District',
          'Competition Name',
          'Participant Names',
          'Registration Date'
        ]);

        headerRow.font = { bold: true };
      }

      if (!eventLotCounters[reg.eventName]) {
        eventLotCounters[reg.eventName] = 1;
      }

      const lotNumber = `LOT${String(
        eventLotCounters[reg.eventName]
      ).padStart(3, '0')}`;

      eventLotCounters[reg.eventName]++;

      reg.competitions.forEach((competition) => {
        sheet.addRow({
          registrationId: reg.registrationId,
          collegeId: reg.collegeId,
          lotNumber,
          eventName: reg.eventName,
          collegeName: reg.collegeName,
          department: reg.department,
          staffName: reg.staffName,
          staffPhone: reg.staffPhone,
          district: reg.district,
          competitionName: competition.name,
          participantNames: competition.participants.join(', '),
          registrationDate: reg.registrationDate
        });
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=registrations.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    res.status(500).json({
      message: 'Failed to export excel',
      error: error.message
    });
  }
}

async function exportRegistrationPdf(req, res) {
  try {
    const db = getDb();
    const { registrationId } = req.params;

    const registration = await db
      .collection('registrations')
      .findOne({ registrationId });

    if (!registration) {
      return res.status(404).json({
        message: 'Registration not found'
      });
    }

    const event = await db
      .collection('events')
      .findOne({
        eventName: registration.eventName
    });

    const doc = new PDFDocument({
  size: 'A4',
  margin: 30
});

res.setHeader('Content-Type', 'application/pdf');
res.setHeader(
  'Content-Disposition',
  `attachment; filename=registration-${registrationId}.pdf`
);

doc.pipe(res);

// Header Background
doc.rect(0, 0, 595, 90).fill('#1e293b');

// Event Name
doc
  .fillColor('#ffffff')
  .fontSize(22)
  .font('Helvetica-Bold')
  .text(
    event?.eventName || registration.eventName,
    0,
    25,
    {
      align: 'center'
    }
  );

// Subtitle
doc
  .fontSize(12)
  .font('Helvetica')
  .text(
    'Symposium Registration Slip',
    0,
    55,
    {
      align: 'center'
    }
  );

// =========================================
// VHNSNC WATERMARK
// =========================================
doc.save();

doc.rotate(45, {
  origin: [500, 420]
});

doc
  .fillColor('#63676c')
  .opacity(0.10)
  .font('Helvetica-Bold')
  .fontSize(120)
  .text(
    'VHNSNC',
    0,
    580,
    {
      width: 800,
      align: 'center'
    }
  );

doc.restore();

doc.opacity(1);
doc.fillColor('#111827');

// =========================================
// REGISTRATION DETAILS BOX
// =========================================

doc
  .roundedRect(30, 110, 535, 140, 8)
  .fillAndStroke('#f8fafc', '#cbd5e1');

doc
  .fillColor('#111827')
  .fontSize(15)
  .font('Helvetica-Bold')
  .text('Registration Details', 45, 125);

const leftX = 45;
const rightX = 300;

let rowY = 150;

doc.font('Helvetica').fontSize(9);

doc.text(
  `Registration ID : ${registration.registrationId}`,
  leftX,
  rowY
);

doc.text(
  `Staff Name : ${registration.staffName}`,
  rightX,
  rowY
);

rowY += 18;

doc.text(
  `Event Name : ${registration.eventName}`,
  leftX,
  rowY
);

doc.text(
  `Phone Number : ${registration.staffPhone}`,
  rightX,
  rowY
);

rowY += 18;

doc.text(
  `College ID : ${registration.collegeId}`,
  leftX,
  rowY
);

doc.text(
  `District : ${registration.district}`,
  rightX,
  rowY
);

rowY += 18;

doc.text(
  `College Name : ${registration.collegeName}`,
  leftX,
  rowY
);

doc.text(
  `Registration Date : ${registration.registrationDate}`,
  rightX,
  rowY,
  {
    width: 220
  }
);

rowY += 18;

doc.text(
  `Department : ${registration.department}`,
  leftX,
  rowY
);

    // Competition Header
    let currentY = 270;

    doc
      .roundedRect(30, currentY, 535, 25, 5)
      .fill('#2563eb');

    doc
      .fillColor('#ffffff')
      .fontSize(15)
      .font('Helvetica-Bold')
      .text('Competition Details', 45, currentY + 7);

    currentY += 35;

    // Table Header
    doc.fillColor('#111827');

    doc.fontSize(8).font('Helvetica-Bold');

    doc.text('No', 35, currentY);
    doc.text('Competition', 55, currentY);
    doc.text('Venue', 155, currentY);
    doc.text('Time', 210, currentY);
    doc.text('Rules', 270, currentY);
    doc.text('Participants', 430, currentY);

    currentY += 12;

    doc
      .moveTo(30, currentY)
      .lineTo(565, currentY)
      .stroke('#d1d5db');

    currentY += 6;

    // Competition Rows
    registration.competitions.forEach((competition, index) => {

      const rulesText =
        competition.rules || 'No Rules';

      const participantsText =
        competition.participants.join(', ');

      doc.font('Helvetica').fontSize(7);

      doc.text(
        `${index + 1}`,
        35,
        currentY
      );

      doc.text(
        competition.name || '-',
        55,
        currentY,
        {
          width: 90
        }
      );

      doc.text(
        competition.venue || 'TBA',
        155,
        currentY,
        {
          width: 50
        }
      );

      doc.text(
        competition.startTime || 'TBA',
        210,
        currentY,
        {
          width: 50
        }
      );

      doc.text(
        rulesText,
        270,
        currentY,
        {
          width: 150
        }
      );

      doc.text(
        participantsText,
        430,
        currentY,
        {
          width: 120
        }
      );

      currentY += 25;
    });

    // Lot Number
    const eventRegistrations = await db
      .collection('registrations')
      .find({
        eventName: registration.eventName
      })
      .sort({ createdAt: 1 })
      .toArray();

    const lotIndex =
      eventRegistrations.findIndex(
        r => r.registrationId === registration.registrationId
      ) + 1;

    const lotNumber =
      `LOT${String(lotIndex).padStart(3, '0')}`;

    currentY += 15;

    doc
      .roundedRect(170, currentY, 250, 60, 10)
      .fill('#eff6ff');

    doc
      .fillColor('#1d4ed8')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(
        'YOUR LOT NUMBER',
        0,
        currentY + 10,
        {
          align: 'center'
        }
      );

    doc
      .fillColor('#dc2626')
      .fontSize(22)
      .text(
        lotNumber,
        0,
        currentY + 30,
        {
          align: 'center'
        }
      );

    currentY += 80;

    doc
      .fillColor('#3b4669')
      .fontSize(15)
      .font('Helvetica')
      .text(
        'This lot number is applicable for all participants from your college.',
        0,
        currentY,
        {
          align: 'center'
        }
      );

    doc.end();

  } catch (error) {
    res.status(500).json({
      message: 'Failed to generate PDF',
      error: error.message
    });
  }
}

module.exports = {
  exportExcel,
  exportRegistrationPdf
};