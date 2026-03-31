import type { NarrativeOutputData } from "@/types/narrative";
import type { DeckTheme } from "@/components/SlidePreview";
import { resolveLayout } from "@/lib/slideLayouts";
import { computeLayout, parseSlide, S, CW, type El } from "@/lib/slideLayoutEngine";

interface ExportOptions { output: NarrativeOutputData; isPro: boolean; excludedSlides: Set<number>; slideOrder: number[]; deckTheme: DeckTheme; }
type RGB = [number, number, number];
type TC = Record<string, RGB>;

function getColors(theme: DeckTheme): TC {
  const hex = (h: string): RGB => { const c = h.replace("#",""); return [parseInt(c.substring(0,2),16), parseInt(c.substring(2,4),16), parseInt(c.substring(4,6),16)]; };
  if (theme.scheme === "light") return { bg:[255,255,255], fg:[51,65,81], primary:[59,130,246], cat:[59,130,246], head:[30,41,59], body:[71,85,105], sub:[100,116,139], close:[59,130,246], accent:[226,232,240], border:[226,232,240] };
  if (theme.scheme === "custom") {
    const b = hex(theme.secondary || "#0b0f14"); const br = (b[0]*299+b[1]*587+b[2]*114)/1000; const il = br > 128; const p = hex(theme.primary || "#3b82f6");
    return { bg:b, fg:il?[51,65,81]:[203,213,225], primary:p, cat:p, head:il?[30,41,59]:[226,232,240], body:il?[71,85,105]:[203,213,225], sub:il?[100,116,139]:[148,163,184], close:p, accent:hex(theme.accent||"#1e3a5f"), border:il?[226,232,240]:[30,58,95] };
  }
  return { bg:[11,15,20], fg:[203,213,225], primary:[59,130,246], cat:[96,165,250], head:[226,232,240], body:[203,213,225], sub:[148,163,184], close:[96,165,250], accent:[30,58,95], border:[30,58,95] };
}

function color(key: string, tc: TC): RGB {
  if (key.startsWith("#")) { const c = key.replace("#",""); return [parseInt(c.substring(0,2),16), parseInt(c.substring(2,4),16), parseInt(c.substring(4,6),16)]; }
  if (key.includes(":")) return tc[key.split(":")[0]] || [200,200,200];
  return tc[key] || [200,200,200];
}

function opacity(key: string): number {
  if (key.includes(":")) return parseFloat(key.split(":")[1]);
  return 1;
}

// ── Render one element to jsPDF ──
function render(el: El, pdf: any, tc: TC) {
  switch (el.t) {
    case "text": {
      const c = color(el.color, tc);
      pdf.setTextColor(c[0], c[1], c[2]);
      pdf.setFont("helvetica", el.bold ? "bold" : "normal");
      pdf.setFontSize(el.pt);

      // jsPDF text positioning: x,y is the baseline. Approximate valign.
      const lines = pdf.splitTextToSize(el.text, el.w);
      const lineH = el.pt / 72 * 1.35;
      let ty = el.y;
      if (el.valign === "middle") ty = el.y + el.h / 2 - (lines.length * lineH) / 2;
      else if (el.valign === "bottom") ty = el.y + el.h - lines.length * lineH;
      ty += lineH * 0.8; // baseline offset

      if (el.align === "center") {
        for (const line of lines) { pdf.text(line, el.x + el.w / 2, ty, { align: "center" }); ty += lineH; }
      } else {
        pdf.text(lines, el.x, ty);
      }
      break;
    }

    case "bullets": {
      const c = color(el.color, tc);
      const bc = color(el.bulletColor, tc);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(el.pt);
      const lineH = el.pt / 72 * (el.lineH || 1.5);
      let ty = el.y + lineH * 0.8;
      for (const item of el.items) {
        if (ty > el.y + el.h) break;
        pdf.setTextColor(bc[0], bc[1], bc[2]);
        pdf.text("\u2022", el.x, ty);
        pdf.setTextColor(c[0], c[1], c[2]);
        const wrapped = pdf.splitTextToSize(item, el.w - 0.2);
        pdf.text(wrapped, el.x + 0.18, ty);
        ty += wrapped.length * lineH + 0.02;
      }
      break;
    }

    case "rect": {
      if (el.fill && el.fill !== "none") {
        const c = color(el.fill, tc);
        const op = opacity(el.fill);
        if (op < 1) {
          // Approximate low opacity by blending with white
          const bg = tc.bg || [255,255,255];
          pdf.setFillColor(
            Math.round(c[0] * op + bg[0] * (1 - op)),
            Math.round(c[1] * op + bg[1] * (1 - op)),
            Math.round(c[2] * op + bg[2] * (1 - op)),
          );
        } else {
          pdf.setFillColor(c[0], c[1], c[2]);
        }
        if (el.stroke) {
          const sc = color(el.stroke, tc);
          pdf.setDrawColor(sc[0], sc[1], sc[2]);
          pdf.setLineWidth(el.sw ? el.sw * 0.01 : 0.01);
          pdf.roundedRect(el.x, el.y, el.w, el.h, el.r || 0, el.r || 0, "FD");
        } else {
          pdf.rect(el.x, el.y, el.w, el.h, "F");
        }
      } else if (el.stroke) {
        const sc = color(el.stroke, tc);
        pdf.setDrawColor(sc[0], sc[1], sc[2]);
        pdf.setLineWidth(el.sw ? el.sw * 0.01 : 0.01);
        pdf.roundedRect(el.x, el.y, el.w, el.h, el.r || 0, el.r || 0, "S");
      }
      break;
    }

    case "ellipse": {
      if (el.fill) {
        const c = color(el.fill, tc);
        pdf.setFillColor(c[0], c[1], c[2]);
        if (el.stroke) {
          const sc = color(el.stroke, tc);
          pdf.setDrawColor(sc[0], sc[1], sc[2]);
          pdf.setLineWidth(el.sw ? el.sw * 0.01 : 0.01);
          pdf.ellipse(el.cx, el.cy, el.rx, el.ry, "FD");
        } else {
          pdf.ellipse(el.cx, el.cy, el.rx, el.ry, "F");
        }
      } else if (el.stroke) {
        const sc = color(el.stroke, tc);
        pdf.setDrawColor(sc[0], sc[1], sc[2]);
        pdf.setLineWidth(el.sw ? el.sw * 0.01 : 0.01);
        pdf.ellipse(el.cx, el.cy, el.rx, el.ry, "S");
      }
      break;
    }

    case "line": {
      const c = color(el.color, tc);
      pdf.setDrawColor(c[0], c[1], c[2]);
      pdf.setLineWidth(el.w ? el.w * 0.01 : 0.01);
      pdf.line(el.x1, el.y1, el.x2, el.y2);
      break;
    }
  }
}

// ── Main export ──
export async function exportPdf({ output, isPro, excludedSlides, slideOrder, deckTheme }: ExportOptions) {
  const { jsPDF } = await import("jspdf");
  const title = (output as any).title || "Narrative Deck";
  const tc = getColors(deckTheme);
  const pdf = new jsPDF({ orientation: "landscape", unit: "in", format: [10, 5.625] });
  const bgFill = () => { pdf.setFillColor(tc.bg[0], tc.bg[1], tc.bg[2]); pdf.rect(0, 0, 10, 5.625, "F"); };

  // Title slide
  bgFill();
  pdf.setFillColor(tc.primary[0], tc.primary[1], tc.primary[2]);
  pdf.rect(0, 0, 10, 0.04, "F"); pdf.rect(0, 5.585, 10, 0.04, "F");
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(22); pdf.setTextColor(tc.head[0], tc.head[1], tc.head[2]);
  pdf.text(title, 5, 2.5, { align: "center" });
  pdf.setFontSize(10); pdf.setTextColor(tc.sub[0], tc.sub[1], tc.sub[2]);
  pdf.text(output.mode.replace(/_/g, " ").toUpperCase(), 5, 3.2, { align: "center" });
  if (!isPro) { pdf.setFontSize(8); pdf.text("Generated by Rhetoric", 5, 4.5, { align: "center" }); }

  // Content slides
  const d = (output.data || (output as any).supporting || {}) as any;
  const del = (output as any).deliverable || {};
  const fw = d.deckFramework || del.deckFramework || d.boardDeckOutline || del.boardDeckOutline || [];
  const ordered = slideOrder.length > 0 ? slideOrder : fw.map((_: any, i: number) => i);
  const active = ordered.filter((i: number) => !excludedSlides.has(i));

  for (const idx of active) {
    const raw = fw[idx]; if (!raw) continue;
    pdf.addPage(); bgFill();
    const data = parseSlide(raw);
    const layout = resolveLayout(raw?.layoutRecommendation, raw?.selectedLayout, raw?.categoryLabel, raw?.metadata?.dataPoints);

    for (const el of computeLayout(data, layout)) render(el, pdf, tc);

    if (!isPro) { pdf.setFontSize(7); pdf.setTextColor(tc.sub[0], tc.sub[1], tc.sub[2]); pdf.text("Generated by Rhetoric", S.ML, S.H - 0.2); }
  }

  pdf.save(`${title.replace(/[^a-zA-Z0-9 ]/g, "")}.pdf`);
}