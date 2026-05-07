import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import * as XLSX from "xlsx";

export function exportApplicationPdf(applicationName: string, funderName: string, commonItems: any[], additionalItems: any[]) {
    const appName: string = (applicationName || "grant-application")
    .trim()
    .replace(/[^\w\- ]+/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();

    const fundName: string = (funderName || "Export")
        .trim()
        .replace(/[^\w\- ]+/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase();

    const allItems = buildAllItems(commonItems, additionalItems);

    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text(appName.toUpperCase() +" – " +fundName.toUpperCase(), 14, 16);

    // Build table rows
    const body = allItems.map((x) => [
    x.question ?? "",
    x.answer ?? "",
    ]);

    autoTable(doc, {
    body,
    startY: 24,
    styles: { fontSize: 9, cellPadding: 3, valign: "top" },
    headStyles: { fillColor: [25, 118, 210] }, // MUI default blue
    columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: "auto" },
    },
    });

    doc.save(`${appName}.pdf`);
}

export function exportApplicationExcel(applicationName: string, funderName: string, commonItems: any[], additionalItems: any[]) {
    const appName: string = (applicationName || "grant-application")
    .trim()
    .replace(/[^\w\- ]+/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();

    const fundName: string = (funderName || "Export")
        .trim()
        .replace(/[^\w\- ]+/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase();
    const wb = XLSX.utils.book_new();
    const allItems = buildAllItems(commonItems, additionalItems);

    const allSheet = XLSX.utils.json_to_sheet(
        allItems.map((x: { question: string; answer: string; }) => ({ Question: x.question, Answer: x.answer }))
    );
    XLSX.utils.book_append_sheet(wb, allSheet, appName + " - " +fundName);

    XLSX.writeFile(wb, `${appName + " - " +fundName}.xlsx`);
}

function buildAllItems(commonItems: any[], additionalItems: any[]) {
  // if common items have "selected", include only selected (default true)
  const commonIncluded = commonItems.filter((x) => x.selected !== false);

  return [
    ...commonIncluded.map((x) => ({ ...x, section: "Common" })),
    ...additionalItems.map((x) => ({ ...x, section: "Additional" })),
  ];
}