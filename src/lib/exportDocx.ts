import { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } from "docx";
import { saveAs } from "file-saver";
import type { Deliverable } from "@/types/rhetoric";

interface ExportDocxOptions {
  title: string;
  deliverable: Deliverable;
}

export async function exportDocx({ title, deliverable }: ExportDocxOptions) {
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 36, font: "Arial" })],
      spacing: { after: 200 },
    })
  );

  // Memo header
  if (deliverable.type === "memo") {
    if (deliverable.to) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: "To: ", bold: true, size: 22, font: "Arial" }),
          new TextRun({ text: deliverable.to, size: 22, font: "Arial" }),
        ],
        spacing: { after: 40 },
      }));
    }
    if (deliverable.from) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: "From: ", bold: true, size: 22, font: "Arial" }),
          new TextRun({ text: deliverable.from, size: 22, font: "Arial" }),
        ],
        spacing: { after: 40 },
      }));
    }
    if (deliverable.subject) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: "Re: ", bold: true, size: 22, font: "Arial" }),
          new TextRun({ text: deliverable.subject, size: 22, font: "Arial" }),
        ],
        spacing: { after: 200 },
      }));
    }
    children.push(new Paragraph({
      children: [],
      spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "999999" } },
    }));
  }

  // Sections
  if (deliverable.sections) {
    for (const section of deliverable.sections) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: section.heading, bold: true, size: 26, font: "Arial" })],
          spacing: { before: 300, after: 120 },
        })
      );
      const paragraphs = section.content.split(/\n\n+/);
      for (const para of paragraphs) {
        if (para.trim()) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: para.trim(), size: 22, font: "Arial" })],
              spacing: { after: 120 },
            })
          );
        }
      }
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Arial", size: 22 } },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children,
    }],
  });

  const buffer = await Packer.toBlob(doc);
  const filename = title.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "_").substring(0, 50);
  saveAs(buffer, `${filename}.docx`);
}
