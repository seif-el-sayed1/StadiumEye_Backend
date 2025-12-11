// utils/generateReports.js
const PDFDocument = require("pdfkit");
const excel4node = require("excel4node");
const Ticket = require("../models/ticket.model");
const Stadium = require("../models/stadium.model");
const path = require("path");
const fs = require("fs");

const ARABIC_FONT = path.join(__dirname, '../fonts/Amiri-Regular.ttf');

// Helper: format date range string
const formatDateRange = (start, end) => {
  const format = (date) =>
    date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  if (!start || !end) return "All Time";
  if (start.toDateString() === end.toDateString())
    return `Date: ${format(start)}`;
  return `From: ${format(start)} - To: ${format(end)}`;
};

// Helper: get predefined ranges
const getDateRange = (rangeType) => {
  const now = new Date();
  let start, end = new Date();

  switch (rangeType) {
    case "thisWeek":
      start = new Date(now.setDate(now.getDate() - now.getDay()));
      start.setHours(0, 0, 0, 0);
      end = new Date();
      break;
    case "thisMonth":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date();
      break;
    case "all":
      start = null;
      end = null;
      break;
    default:
      start = rangeType?.start ? new Date(rangeType.start) : null;
      end = rangeType?.end ? new Date(rangeType.end) : null;
  }
  return { start, end };
};

// Main PDF Generator
const generatePDFReport = async (filters, options = {}) => {
  const { stadiums = [], dateRange = "all", includeMedia = false } = filters;
  const { start, end } = getDateRange(dateRange);
  const query = {};
  if (Array.isArray(stadiums) && stadiums.length > 0) {
    query.stadium = { $in: stadiums };
  }
  if (start && end) {
    query.createdAt = { $gte: start, $lte: end };
  }

  const tickets = await Ticket.find(query)
    .sort({ stadium: 1, createdAt: -1 })
    .lean();

  const doc = new PDFDocument({
    margin: 60,
    size: "A4",
    info: { Title: "Stadium Eye Report" }
  });

  const buffers = [];
  doc.on("data", buffers.push.bind(buffers));

  const PRIMARY_COLOR = "#0A7F3F";

  const drawPageBorder = () => {
    const w = doc.page.width;
    const h = doc.page.height;
    doc.lineWidth(1).strokeColor("#333333")
       .rect(40, 40, w - 80, h - 80)
       .stroke();
  };
  drawPageBorder();
  doc.on("pageAdded", drawPageBorder);

  if (fs.existsSync(ARABIC_FONT)) {
    doc.registerFont('ArabicFont', ARABIC_FONT);
  }

  const logoUrl = process.env.LOGO_URL;

  try {
    const response = await fetch(logoUrl);
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      const logoBuffer = Buffer.from(arrayBuffer);

      const logoSize = 80;
      const logoX = 70;
      const logoY = 50;
      const cornerRadius = 18;

      doc.fillColor("#ffffff")
         .roundedRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10, cornerRadius + 5)
         .fill();

      doc.save();
      doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 5).clip();
      doc.image(logoBuffer, logoX, logoY, { width: logoSize, height: logoSize });
      doc.restore();

      
      doc.fontSize(32).fillColor(PRIMARY_COLOR).font("Helvetica-Bold")
         .text("Stadium Eye", logoX + logoSize + 30, logoY + 22);
    }
  } catch (err) {
    doc.fontSize(32).fillColor(PRIMARY_COLOR).font("Helvetica-Bold")
       .text("Stadium Eye", 0, 80, { align: "center" });
  }

  doc.moveDown(1.5);

  if (!tickets || tickets.length === 0) {
    doc.moveDown(8);
    doc.fontSize(18).fillColor("#666666")
       .text("No tickets found for the selected filters", { align: "center" });
    doc.moveDown(1);
    doc.fontSize(12).fillColor(PRIMARY_COLOR)
       .text(formatDateRange(start, end), { align: "center" });
    doc.end();
    return new Promise(res => doc.on("end", () => res(Buffer.concat(buffers))));
  }

  const grouped = tickets.reduce((acc, t) => {
    const sid = t.stadium?._id?.toString() || "unknown";
    if (!acc[sid]) acc[sid] = { stadium: t.stadium, tickets: [] };
    acc[sid].tickets.push(t);
    return acc;
  }, {});

  let firstStadium = true;

  for (const { stadium, tickets: stadiumTickets } of Object.values(grouped)) {
    if (!firstStadium) {
      doc.moveDown(1.5);
      doc.lineWidth(2).strokeColor(PRIMARY_COLOR)
         .moveTo(100, doc.y).lineTo(500, doc.y).stroke();
      doc.moveDown(1.5);
    }
    firstStadium = false;

    doc.fontSize(24).fillColor(PRIMARY_COLOR).font("Helvetica-Bold")
       .text(stadium?.stadiumName || "Unknown Stadium", 60, doc.y, {
         align: "center",
         width: 480,
         underline: true
       });

    stadiumTickets.forEach((t, idx) => {
      if (idx > 0) {
        doc.moveDown(1);
        doc.lineWidth(0.8).strokeColor("#86efac")
           .moveTo(60, doc.y).lineTo(540, doc.y).stroke();
      }

      doc.moveDown(1.2);

      const email = t.createdBy?.email || "N/A";
      const dateStr = new Date(t.createdAt).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      });

      doc.fontSize(11).fillColor(PRIMARY_COLOR).font("Helvetica-Bold");
      doc.text(`Created By: ${email}`, 60, doc.y, { continued: true });
      doc.text(dateStr, { align: "right", width: 480 });
      doc.moveDown(0.8);

      const leftX = 60;
      const rightX = 310;
      let colY = doc.y;

      doc.fontSize(10.5).fillColor("#333333");
      doc.text(`Area: ${t.area || "-"}`, leftX, colY);
      doc.text(`Type: ${t.ticketType || "-"}`, leftX, colY + 20);
      doc.text(`Status: ${t.status || "-"}`, leftX, colY + 40);
      doc.text(`Priority: ${t.priority || "-"}`, rightX, colY);
      doc.text(`Assigned To: ${t.assignedTo?.teamName || "Not Assigned"}`, rightX, colY + 20);
      doc.text(`Closed By: ${t.closedBy ? `${t.closedBy.firstName || ""} ${t.closedBy.lastName || ""}`.trim() : "-"}`, rightX, colY + 40);
      doc.text(`Rejected By: ${t.rejectedBy?.email || "-"}`, rightX, colY + 60);

      doc.moveDown(1.2);

      doc.fontSize(10).fillColor(PRIMARY_COLOR).font("Helvetica-Bold");
      doc.text("Observations:", 60);

      const obs = t.observations || "No observations provided.";
      const hasArabic = /[\u0600-\u06FF]/.test(obs);

      if (hasArabic && fs.existsSync(ARABIC_FONT)) {
        doc.font("ArabicFont").fontSize(10).fillColor("#444444")
           .text(obs.length > 600 ? obs.slice(0, 600) + "..." : obs, 60, doc.y + 10, {
             width: 480,
             align: "right",
             direction: "rtl",
             features: ['rtlar'],
             indent: 15,
             lineGap: 3
           });
      } else {
        doc.fontSize(10).fillColor("#444444")
           .text(obs.length > 600 ? obs.slice(0, 600) + "..." : obs, 60, doc.y + 10, {
             width: 480,
             align: "justify",
             indent: 15
           });
      }

      if (includeMedia && (t.ticketImages?.length || t.ticketVideos?.length || t.ticketVoices?.length)) {
        const spaceLeft = doc.page.height - doc.y - 100;
        if (spaceLeft < 80) doc.addPage();

        doc.moveDown(1.2);
        doc.fontSize(10).fillColor(PRIMARY_COLOR).font("Helvetica-Bold");
        doc.text("Media:", 60);
        doc.moveDown(0.7);

        const mediaItems = [];
        t.ticketImages?.forEach((_, i) => mediaItems.push({ label: `Image ${i + 1}`, url: t.ticketImages[i] }));
        t.ticketVideos?.forEach((_, i) => mediaItems.push({ label: `Video ${i + 1}`, url: t.ticketVideos[i] }));
        t.ticketVoices?.forEach((_, i) => mediaItems.push({ label: `Voice ${i + 1}`, url: t.ticketVoices[i] }));

        if (mediaItems.length > 0) {
          const availableWidth = 480;
          const minWidthPerItem = 90;
          let maxPerRow = Math.floor(availableWidth / minWidthPerItem);
          maxPerRow = Math.max(2, Math.min(6, maxPerRow));

          doc.fontSize(9.8).fillColor("#166534");

          let y = doc.y;
          let x = 70;
          const lineHeight = 18;
          const dynamicSpacing = availableWidth / maxPerRow;

          mediaItems.forEach((item, i) => {
            if (i % maxPerRow === 0 && i !== 0) {
              y += lineHeight;
              x = 70;
            }
            if (y + lineHeight > doc.page.height - 100) {
              doc.addPage();
              y = 100;
              x = 70;
            }
            doc.text(item.label, x, y, {
              link: item.url,
              underline: true,
              continued: false
            });
            x += dynamicSpacing;
          });
          doc.y = y + lineHeight + 15;
        }
      }

      if (doc.y > 720) doc.addPage();
    });
  }

  doc.moveDown(2);
  doc.fontSize(12).fillColor(PRIMARY_COLOR)
     .text(formatDateRange(start, end), { align: "center" });

  while (doc.bufferedPageRange().count > 1 && doc.y < 150) {
    doc.bufferedPages.pop();
  }

  doc.end();

  return new Promise(resolve => {
    doc.on("end", () => resolve(Buffer.concat(buffers)));
  });
};

// Excel Generator
const generateExcelReport = async (filters) => {
  const { stadiums = [], dateRange = "all", includeMedia = false } = filters;
  const { start, end } = getDateRange(dateRange);

  const query = {};
  if (Array.isArray(stadiums) && stadiums.length > 0) query.stadium = { $in: stadiums };
  if (start && end) query.createdAt = { $gte: start, $lte: end };

  const tickets = await Ticket.find(query)
    .sort({ stadium: 1, createdAt: -1 })
    .populate("stadium createdBy assignedTo closedBy rejectedBy")
    .lean();

  const wb = new excel4node.Workbook();
  const ws = wb.addWorksheet("Stadium Eye Report");

  const headerStyle = wb.createStyle({
    font: { bold: true, size: 13, color: "#FFFFFF" },
    fill: { type: "pattern", patternType: "solid", fgColor: "#1e40af" },
    alignment: { horizontal: "center", vertical: "center" }
  });

  const stadiumHeaderStyle = wb.createStyle({
    font: { bold: true, size: 12, color: "#1e40af" },
    fill: { type: "pattern", patternType: "solid", fgColor: "#eef2ff" },
    alignment: { horizontal: "left", vertical: "center" },
    border: { bottom: { style: "medium", color: "#1e40af" } }
  });

  const separatorStyle = wb.createStyle({
    fill: { type: "pattern", patternType: "solid", fgColor: "#f1f5f9" },
    border: { top: { style: "thin", color: "#cbd5e1" } }
  });

  const boldStyle = wb.createStyle({ font: { bold: true } });

  const columns = [
    "Stadium", "Created By (Email)", "Date & Time", "Area", "Type",
    "Status", "Priority", "Assigned To", "Closed By", "Rejected By", "Observations"
  ];

  let mediaColIndex = -1;
  if (includeMedia) {
    columns.push("Media");
    mediaColIndex = columns.length;
  }

  columns.forEach((col, i) => ws.cell(1, i + 1).string(col).style(headerStyle));

  const colWidths = [28, 28, 22, 18, 16, 16, 14, 20, 22, 22, 60];
  if (includeMedia) colWidths.push(85);

  colWidths.forEach((w, i) => {
    try { ws.column(i + 1).setWidth(w); }
    catch { ws.column(i + 1).width = w; }
  });

  ws.row(1).setHeight(38);

  let row = 2;
  let currentStadium = null;

  for (const t of tickets) {
    const stadiumName = t.stadium?.stadiumName || "Unknown Stadium";

    if (currentStadium !== stadiumName) {
      if (currentStadium !== null) {
        row++;
        for (let i = 1; i <= columns.length; i++) {
          ws.cell(row, i).style(separatorStyle);
        }
      }

      row++; 

      ws.cell(row, 1, row, columns.length, true) // merge cells
        .string(`${stadiumName}`)
        .style(stadiumHeaderStyle);

      ws.row(row).setHeight(32);
      row++; 
    }

    const baseRow = [
      stadiumName,
      t.createdBy?.email || "N/A",
      new Date(t.createdAt).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      }),
      t.area || "-",
      t.ticketType || "-",
      t.status || "-",
      t.priority || "-",
      t.assignedTo?.teamName || "Not Assigned",
      t.closedBy ? `${t.closedBy.email || ""}`.trim() || "-" : "-",
      t.rejectedBy?.email || "-",
      t.observations || "No observations provided."
    ];

    baseRow.forEach((val, i) => ws.cell(row, i + 1).string(val || "-"));

    if (includeMedia && mediaColIndex !== -1) {
      const mediaItems = [];
      let imgCount = 1, vidCount = 1, voiceCount = 1;

      t.ticketImages?.forEach(url => url && mediaItems.push({ label: `Image ${imgCount++}`, url }));
      t.ticketVideos?.forEach(url => url && mediaItems.push({ label: `Video ${vidCount++}`, url }));
      t.ticketVoices?.forEach(url => url && mediaItems.push({ label: `Voice ${voiceCount++}`, url }));

      const cell = ws.cell(row, mediaColIndex);

      if (mediaItems.length === 0) {
        cell.string("-");
      } else {
        const displayText = mediaItems.map(m => m.label).join("    ");
        const firstUrl = mediaItems[0].url;

        cell.link(firstUrl, displayText).style({
          font: { color: "#0066cc", size: 10.5 },
          underline: true
        });
      }
    }

    if (row % 2 === 0) {
      for (let i = 1; i <= columns.length; i++) {
        ws.cell(row, i).style({
          fill: { type: "pattern", patternType: "solid", fgColor: "#f8fafc" }
        });
      }
    }

    currentStadium = stadiumName;
    row++;
  }

  const footerRow = row + 2;
  ws.cell(footerRow, 1).string("Report Generated On:").style(boldStyle);
  ws.cell(footerRow, 2).string(new Date().toLocaleDateString("en-GB"));
  ws.cell(footerRow + 1, 1).string("Report Date Range:").style(boldStyle);
  ws.cell(footerRow + 1, 2).string(formatDateRange(start, end) || "All Time");

  return await wb.writeToBuffer();
};

module.exports = {
  generatePDFReport,
  generateExcelReport,
};