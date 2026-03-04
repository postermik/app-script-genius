import type { Deliverable } from "@/types/rhetoric";

export function buildPlainText(deliverable: Deliverable): string {
  let text = "";

  if (deliverable.type === "memo") {
    if (deliverable.to) text += `To: ${deliverable.to}\n`;
    if (deliverable.from) text += `From: ${deliverable.from}\n`;
    if (deliverable.subject) text += `Subject: ${deliverable.subject}\n`;
    text += "\n---\n\n";
  }

  if (deliverable.type === "email" && deliverable.subject) {
    text += `Subject: ${deliverable.subject}\n\n`;
  }

  if (deliverable.sections) {
    for (const section of deliverable.sections) {
      text += `${section.heading}\n\n${section.content}\n\n`;
    }
  }

  if (deliverable.type === "deck" && deliverable.deckFramework) {
    for (const slide of deliverable.deckFramework) {
      if (slide.categoryLabel) text += `[${slide.categoryLabel}]\n`;
      text += `${slide.headline}\n`;
      if (slide.subheadline) text += `${slide.subheadline}\n`;
      text += "\n";
      if (slide.bodyContent) {
        for (const bullet of slide.bodyContent) {
          text += `• ${bullet}\n`;
        }
      }
      if (slide.closingStatement) text += `\n${slide.closingStatement}\n`;
      text += "\n---\n\n";
    }
  }

  return text.trim();
}

export async function copyAsHtml(deliverable: Deliverable): Promise<void> {
  let html = "";

  if (deliverable.subject) {
    html += `<h2 style="font-family:Arial,sans-serif;margin-bottom:16px">${deliverable.subject}</h2>`;
  }

  if (deliverable.sections) {
    for (const section of deliverable.sections) {
      html += `<p style="font-family:Arial,sans-serif;font-weight:bold;color:#333;margin-top:16px;margin-bottom:4px;font-size:14px">${section.heading}</p>`;
      const paragraphs = section.content.split(/\n\n+/);
      for (const para of paragraphs) {
        if (para.trim()) {
          html += `<p style="font-family:Arial,sans-serif;color:#444;font-size:14px;line-height:1.5;margin-bottom:8px">${para.trim()}</p>`;
        }
      }
    }
  }

  const htmlBlob = new Blob([html], { type: "text/html" });
  const plainBlob = new Blob(
    [deliverable.sections?.map(s => `${s.heading}\n\n${s.content}`).join("\n\n") || ""],
    { type: "text/plain" }
  );

  await navigator.clipboard.write([
    new ClipboardItem({ "text/html": htmlBlob, "text/plain": plainBlob }),
  ]);
}
