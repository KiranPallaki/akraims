import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate } from "./dateUtils";

export interface ExportPDFOptions {
  fileName: string;
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
  orientation?: "portrait" | "landscape";
}

export function exportTableToPDF({
  fileName,
  title,
  subtitle,
  headers,
  rows,
  orientation = "landscape",
}: ExportPDFOptions) {
  if (!rows || rows.length === 0) return;

  const doc = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Document Header Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(title, 14, 15);

  // Subtitle / Date stamp
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139); // slate-500
  const now = new Date();
  const formattedNow = formatDate(now);
  const dateStr = `Generated on: ${formattedNow} ${now.toLocaleTimeString()}`;
  const subText = subtitle ? `${subtitle}  |  ${dateStr}` : dateStr;
  doc.text(subText, 14, 21);

  // Horizontal divider rule
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(14, 24, pageWidth - 14, 24);

  // AutoTable generation
  autoTable(doc, {
    startY: 27,
    head: [headers],
    body: rows,
    theme: "striped",
    headStyles: {
      fillColor: [15, 23, 42], // Slate-900 header
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: "bold",
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59], // Slate-800
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate-50
    },
    margin: { top: 27, right: 14, bottom: 15, left: 14 },
    didDrawPage: (data) => {
      // Footer page numbering
      const totalPages = (doc as any).internal.getNumberOfPages();
      const currentPage = data.pageNumber;

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184); // slate-400

      // Footer branding
      doc.text("AKRA IMS", 14, doc.internal.pageSize.getHeight() - 8);

      // Page numbers
      const pageStr = `Page ${currentPage} of ${totalPages}`;
      doc.text(
        pageStr,
        pageWidth - 14,
        doc.internal.pageSize.getHeight() - 8,
        { align: "right" }
      );
    },
  });

  const finalFileName = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  doc.save(finalFileName);
}
