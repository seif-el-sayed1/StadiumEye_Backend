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
    margin: 50,
    size: "A4",
    info: { Title: "Stadium Eye Report" }
  });

  const buffers = [];
  doc.on("data", buffers.push.bind(buffers));

  const PRIMARY_COLOR = "#0A7F3F";
  const TEXT_MAIN = "#222222";
  const TEXT_MUTED = "#555555";
  const BG_LIGHT = "#f9fafb";
  const BORDER_COLOR = "#e5e7eb";
  const BASE_URL = process.env.SERVER_URL || "https://your-domain.com";

  const drawPageBorder = () => {
    doc.lineWidth(2).strokeColor(PRIMARY_COLOR)
       .rect(35, 35, doc.page.width - 70, doc.page.height - 70)
       .stroke();
  };
  drawPageBorder();
  doc.on("pageAdded", drawPageBorder);

  if (fs.existsSync(ARABIC_FONT)) {
    doc.registerFont('ArabicFont', ARABIC_FONT);
  }

  const logoUrl = process.env.LOGO_URL;
  let currentY = 50;

  try {
    const response = await fetch(logoUrl);
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      const logoBuffer = Buffer.from(arrayBuffer);

      const logoSize = 60;
      const logoX = 55;
      const logoY = 50;

      doc.save();
      doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2).clip();
      doc.image(logoBuffer, logoX, logoY, { width: logoSize, height: logoSize });
      doc.restore();

      doc.fontSize(22).fillColor(PRIMARY_COLOR).font("Helvetica-Bold")
         .text("Stadium Eye", logoX + logoSize + 15, logoY + 15, { width: 250 });
    }
  } catch (err) {
    doc.fontSize(22).fillColor(PRIMARY_COLOR).font("Helvetica-Bold")
       .text("Stadium Eye", 55, 65, { width: 250 });
  }

  doc.fontSize(10).fillColor(TEXT_MUTED).font("Helvetica")
     .text(`Report Generated on: ${new Date().toLocaleDateString("en-GB")}`, doc.page.width - 250, 65, { align: "right", width: 195 });

  currentY = 130;
  doc.lineWidth(1).strokeColor(BORDER_COLOR)
     .moveTo(55, currentY).lineTo(doc.page.width - 55, currentY).stroke();

  if (!tickets || tickets.length === 0) {
    currentY += 50;
    doc.fontSize(16).fillColor(TEXT_MUTED).font("Helvetica-Bold")
       .text("No tickets found for the selected filters", 55, currentY, { align: "center", width: doc.page.width - 110 });
    currentY += 30;
    doc.fontSize(11).fillColor(PRIMARY_COLOR).font("Helvetica")
       .text(formatDateRange(start, end), 55, currentY, { align: "center", width: doc.page.width - 110 });
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
    if (currentY > doc.page.height - 150) {
      doc.addPage();
      currentY = 60;
    }

    if (!firstStadium) {
      currentY += 15;
      doc.lineWidth(1.5).strokeColor(PRIMARY_COLOR)
         .moveTo(150, currentY).lineTo(doc.page.width - 150, currentY).stroke();
      currentY += 20;
    }
    firstStadium = false;

    currentY += 10;
    doc.fontSize(18).fillColor(PRIMARY_COLOR).font("Helvetica-Bold")
       .text(stadium?.stadiumName || "Unknown Stadium", 55, currentY, { align: "center", width: doc.page.width - 110 });
    currentY += 30;

    for (let idx = 0; idx < stadiumTickets.length; idx++) {
      const t = stadiumTickets[idx];

      if (currentY > doc.page.height - 180) {
        doc.addPage();
        currentY = 60;
      }

      if (idx > 0) {
        currentY += 10;
        doc.lineWidth(0.8).strokeColor(BORDER_COLOR)
           .moveTo(55, currentY).lineTo(doc.page.width - 55, currentY).stroke();
        currentY += 15;
      }

      const email = t.createdBy?.email || "N/A";
      const dateStr = new Date(t.createdAt).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      });

      doc.fontSize(11).fillColor(PRIMARY_COLOR).font("Helvetica-Bold");
      doc.text(`Created By: ${email}`, 55, currentY, { continued: true });
      doc.text(dateStr, { align: "right", width: doc.page.width - 110 });
      currentY += 22;

      const colLeftX = 55;
      const colRightX = 310;
      const rowHeight = 25;

      const leftRows = [
        { label: "Area:", val: t.area || "-" },
        { label: "Type:", val: t.ticketType || "-" },
        { label: "Status:", val: t.status || "-" }
      ];

      const rightRows = [
        { label: "Priority:", val: t.priority || "-" },
        { label: "Assigned To:", val: t.assignedTo?.teamName || "Not Assigned" },
        { label: "Closed By:", val: t.closedBy ? `${t.closedBy.firstName || ""} ${t.closedBy.lastName || ""}`.trim() : "-" },
        { label: "Rejected By:", val: t.rejectedBy?.email || "-" }
      ];

      const totalGridRows = Math.max(leftRows.length, rightRows.length);
      for (let r = 0; r < totalGridRows; r++) {
        let yPos = currentY + (r * rowHeight);

        let lItem = leftRows[r];
        if (lItem) {
          doc.font("Helvetica").fontSize(10.5).fillColor(TEXT_MUTED).text(lItem.label, colLeftX, yPos, { width: 55 });
          doc.font("Helvetica-Bold").fillColor(TEXT_MAIN).text(lItem.val, colLeftX + 60, yPos, { width: 175 });
        }

        let rItem = rightRows[r];
        if (rItem) {
          doc.font("Helvetica").fontSize(10.5).fillColor(TEXT_MUTED).text(rItem.label, colRightX, yPos, { width: 85 });
          doc.font("Helvetica-Bold").fillColor(TEXT_MAIN).text(rItem.val, colRightX + 90, yPos, { width: 145 });
        }
      }

      currentY += (totalGridRows * rowHeight) + 15;

      if (currentY > doc.page.height - 120) {
        doc.addPage();
        currentY = 60;
      }

      doc.fontSize(11).fillColor(PRIMARY_COLOR).font("Helvetica-Bold")
         .text("Observations:", 55, currentY);
      currentY += 18;

      let obs = t.observations || "No observations provided.";
      const hasArabic = /[\u0600-\u06FF]/.test(obs);
      if (obs.length > 600) obs = obs.slice(0, 600) + "...";

      if (hasArabic) {
        obs = obs.split(' ').reverse().join(' ');
      }

      const boxPadding = 10;
      const boxWidth = doc.page.width - 110;
      let textHeight = 0;

      doc.fontSize(10).fillColor(TEXT_MAIN);
      if (hasArabic && fs.existsSync(ARABIC_FONT)) {
        doc.font("ArabicFont");
        textHeight = doc.heightOfString(obs, { width: boxWidth - (boxPadding * 2), align: "right" });
      } else {
        doc.font("Helvetica");
        textHeight = doc.heightOfString(obs, { width: boxWidth - (boxPadding * 2), align: "justify" });
      }

      if (currentY + textHeight + (boxPadding * 2) > doc.page.height - 80) {
        doc.addPage();
        currentY = 60;
      }

      doc.save();
      doc.lineWidth(1).strokeColor(BORDER_COLOR).fillColor(BG_LIGHT)
         .roundedRect(55, currentY, boxWidth, textHeight + (boxPadding * 2), 4)
         .fillAndStroke();
      doc.restore();

      if (hasArabic && fs.existsSync(ARABIC_FONT)) {
        doc.font("ArabicFont").fillColor(TEXT_MAIN)
           .text(obs, 55 + boxPadding, currentY + boxPadding, { width: boxWidth - (boxPadding * 2), align: "right" });
      } else {
        doc.font("Helvetica").fillColor(TEXT_MAIN)
           .text(obs, 55 + boxPadding, currentY + boxPadding, { width: boxWidth - (boxPadding * 2), align: "justify" });
      }

      currentY += textHeight + (boxPadding * 2) + 15;

      if (includeMedia && (t.ticketImages?.length || t.ticketVideos?.length || t.ticketVoices?.length)) {
        if (currentY > doc.page.height - 100) {
          doc.addPage();
          currentY = 60;
        }

        doc.fontSize(11).fillColor(PRIMARY_COLOR).font("Helvetica-Bold")
           .text("Media:", 55, currentY);
        currentY += 18;

        const mediaItems = [];
        t.ticketImages?.forEach((_, i) => mediaItems.push({ label: `Image ${i + 1}`, url: t.ticketImages[i] }));
        t.ticketVideos?.forEach((_, i) => mediaItems.push({ label: `Video ${i + 1}`, url: t.ticketVideos[i] }));
        t.ticketVoices?.forEach((_, i) => mediaItems.push({ label: `Voice ${i + 1}`, url: t.ticketVoices[i] }));

        if (mediaItems.length > 0) {
          let mediaX = 55;
          const itemWidth = 100;
          const itemGap = 20;

          mediaItems.forEach((item) => {
            if (mediaX + itemWidth > doc.page.width - 55) {
              currentY += 22;
              mediaX = 55;
            }

            if (currentY > doc.page.height - 80) {
              doc.addPage();
              currentY = 60;
              mediaX = 55;
            }

            let finalUrl = item.url || "";
            if (finalUrl.startsWith('file:///')) {
              finalUrl = finalUrl.replace('file:///', `${BASE_URL}/`);
            } else if (finalUrl.startsWith('/')) {
              finalUrl = `${BASE_URL}${finalUrl}`;
            } else if (finalUrl && !finalUrl.startsWith('http')) {
              finalUrl = `${BASE_URL}/${finalUrl}`;
            }

            doc.fontSize(10).font("Helvetica").fillColor("#0066cc")
               .text(item.label, mediaX, currentY, { link: finalUrl, underline: true, width: itemWidth });
            
            mediaX += itemWidth + itemGap;
          });
          currentY += 25;
        }
      }
      currentY += 15;
    }
  }

  if (currentY > doc.page.height - 100) {
    doc.addPage();
    currentY = 60;
  }
  currentY += 15;
  doc.fontSize(11).fillColor(PRIMARY_COLOR).font("Helvetica")
     .text(formatDateRange(start, end), 55, currentY, { align: "center", width: doc.page.width - 110 });

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

// Single Ticket PDF Generator
const generateSingleTicketPDF = async (ticket, options = {}) => {
  const { includeMedia = true } = options;

  if (!ticket) throw new Error("Ticket data is required");

  const doc = new PDFDocument({
    margin: 50,
    size: "A4",
    info: { Title: `Ticket Report` }
  });

  const buffers = [];
  doc.on("data", buffers.push.bind(buffers));

  const PRIMARY_COLOR = "#0A7F3F";
  const TEXT_MAIN = "#222222";
  const TEXT_MUTED = "#555555";
  const BG_LIGHT = "#f9fafb";
  const BORDER_COLOR = "#e5e7eb";

  const drawPageBorder = () => {
    doc.lineWidth(2).strokeColor(PRIMARY_COLOR)
       .rect(35, 35, doc.page.width - 70, doc.page.height - 70)
       .stroke();
  };
  drawPageBorder();
  doc.on("pageAdded", drawPageBorder);

  if (fs.existsSync(ARABIC_FONT)) {
    doc.registerFont('ArabicFont', ARABIC_FONT);
  }

  const logoSize = 60;
  const logoX = 55;
  const logoY = 50;

  try {
    const response = await fetch(process.env.LOGO_URL);
    if (response.ok) {
      const logoBuffer = Buffer.from(await response.arrayBuffer());
      doc.save();
      doc.circle(logoX + logoSize/2, logoY + logoSize/2, logoSize/2).clip();
      doc.image(logoBuffer, logoX, logoY, { width: logoSize, height: logoSize });
      doc.restore();
    }
  } catch (e) {}

  doc.fontSize(22).fillColor(PRIMARY_COLOR).font("Helvetica-Bold")
     .text("Stadium Eye", logoX + logoSize + 15, logoY + 15, { width: 250 });

  const idText = `#${ticket._id}`;
  doc.fontSize(11).fillColor(TEXT_MUTED).font("Helvetica-Bold")
     .text(idText, doc.page.width - 250, logoY + 20, { align: "right", width: 195 });

  let currentY = 130;
  doc.lineWidth(1).strokeColor(BORDER_COLOR)
     .moveTo(55, currentY).lineTo(doc.page.width - 55, currentY).stroke();

  currentY += 20;
  
  doc.fontSize(18).fillColor(TEXT_MAIN).font("Helvetica-Bold")
     .text(ticket.stadium?.stadiumName || "Unknown Stadium", 55, currentY, { align: "center", width: doc.page.width - 110 });

  currentY += doc.currentLineHeight() + 10;

  const dateStr = new Date(ticket.createdAt).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  doc.fontSize(10).fillColor(TEXT_MUTED).font("Helvetica");
  doc.text(`Created By: ${ticket.createdBy?.email || "N/A"}`, 55, currentY, { continued: true });
  doc.text(`  |  Date: ${dateStr}`, { align: "right", width: doc.page.width - 110 });

  currentY += 35;

  const rowHeight = 28;
  const colLeftX = 55;
  const colRightX = 310;

  const leftRows = [
    { label: "Area:", val: ticket.area || "-" },
    { label: "Type:", val: ticket.ticketType || "-" },
    { label: "Status:", val: ticket.status || "-" },
    { label: "Priority:", val: ticket.priority || "-" }
  ];

  const rightRows = [
    { label: "Assigned To:", val: ticket.assignedTo?.teamName || "Not Assigned" },
    { label: "Closed By:", val: ticket.closedBy ? `${ticket.closedBy.firstName || ""} ${ticket.closedBy.lastName || ""}`.trim() : "-" },
    { label: "Rejected By:", val: ticket.rejectedBy?.email || "-" },
    { label: "", val: "" }
  ];

  leftRows.forEach((item, index) => {
    let yPos = currentY + (index * rowHeight);

    doc.font("Helvetica").fontSize(11).fillColor(TEXT_MUTED).text(item.label, colLeftX, yPos, { width: 70 });
    doc.font("Helvetica-Bold").fillColor(TEXT_MAIN).text(item.val, colLeftX + 75, yPos, { width: 160 });

    let rItem = rightRows[index];
    if (rItem.label) {
      doc.font("Helvetica").fontSize(11).fillColor(TEXT_MUTED).text(rItem.label, colRightX, yPos, { width: 90 });
      doc.font("Helvetica-Bold").fillColor(TEXT_MAIN).text(rItem.val, colRightX + 95, yPos, { width: 145 });
    }
  });

  currentY += (leftRows.length * rowHeight) + 25;

  doc.fontSize(13).fillColor(PRIMARY_COLOR).font("Helvetica-Bold")
     .text("Observations:", 55, currentY);

  currentY += 20;

  let obs = ticket.observations || "No observations provided.";
  const hasArabic = /[\u0600-\u06FF]/.test(obs);
  
  const boxPadding = 12;
  const boxWidth = doc.page.width - 110;
  let textHeight = 0;

  if (hasArabic) {
    obs = obs.split(' ').reverse().join(' ');
  }

  doc.fontSize(11).fillColor(TEXT_MAIN);
  if (hasArabic && fs.existsSync(ARABIC_FONT)) {
    doc.font("ArabicFont");
    textHeight = doc.heightOfString(obs, { width: boxWidth - (boxPadding * 2), align: "right" });
  } else {
    doc.font("Helvetica");
    textHeight = doc.heightOfString(obs, { width: boxWidth - (boxPadding * 2), align: "justify" });
  }

  doc.save();
  doc.lineWidth(1).strokeColor(BORDER_COLOR).fillColor(BG_LIGHT)
     .roundedRect(55, currentY, boxWidth, textHeight + (boxPadding * 2), 4)
     .fillAndStroke();
  doc.restore();

  if (hasArabic && fs.existsSync(ARABIC_FONT)) {
    doc.font("ArabicFont").fillColor(TEXT_MAIN)
       .text(obs, 55 + boxPadding, currentY + boxPadding, { width: boxWidth - (boxPadding * 2), align: "right" });
  } else {
    doc.font("Helvetica").fillColor(TEXT_MAIN)
       .text(obs, 55 + boxPadding, currentY + boxPadding, { width: boxWidth - (boxPadding * 2), align: "justify" });
  }

  currentY += textHeight + (boxPadding * 2) + 30;

  if (includeMedia && (ticket.ticketImages?.length || ticket.ticketVideos?.length || ticket.ticketVoices?.length)) {
    
    if (currentY > doc.page.height - 120) {
      doc.addPage();
      currentY = 60;
    }

    doc.fontSize(13).fillColor(PRIMARY_COLOR).font("Helvetica-Bold")
       .text("Media Attachments:", 55, currentY);

    currentY += 22;

    const mediaItems = [];
    ticket.ticketImages?.forEach((url, i) => mediaItems.push({ label: `Image ${i+1}`, url }));
    ticket.ticketVideos?.forEach((url, i) => mediaItems.push({ label: `Video ${i+1}`, url }));
    ticket.ticketVoices?.forEach((url, i) => mediaItems.push({ label: `Voice ${i+1}`, url }));

    let mediaX = 55;
    const itemWidth = 140;
    const itemGap = 25;

    const BASE_URL = process.env.BACKEND_URL; 

    mediaItems.forEach((item, i) => {
      if (mediaX + itemWidth > doc.page.width - 55) {
        currentY += 25;
        mediaX = 55;
      }

      let finalUrl = item.url;
      if (finalUrl.startsWith('file:///')) {
        finalUrl = finalUrl.replace('file:///', `${BASE_URL}/`);
      } else if (finalUrl.startsWith('/')) {
        finalUrl = `${BASE_URL}${finalUrl}`;
      } else if (!finalUrl.startsWith('http')) {
        finalUrl = `${BASE_URL}/${finalUrl}`;
      }

      doc.fontSize(11).font("Helvetica").fillColor("#0066cc")
         .text(item.label, mediaX, currentY, { link: finalUrl, underline: true, width: itemWidth });

      mediaX += itemWidth + itemGap;
    });
  }

  doc.fontSize(9).fillColor(TEXT_MUTED).font("Helvetica")
     .text(`Report Generated on: ${new Date().toLocaleDateString("en-GB")}`, 
           0, doc.page.height - 60, { align: "center", width: doc.page.width });

  doc.end();

  return new Promise(resolve => doc.on("end", () => resolve(Buffer.concat(buffers))));
};

module.exports = {
  generatePDFReport,
  generateExcelReport,
  generateSingleTicketPDF,   
};  