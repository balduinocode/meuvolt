"use client";

import { jsPDF } from "jspdf";
import type { Quote, UserProfile } from "@/lib/db";
import {
  formatCurrency,
  getQuoteNumber,
  calculateSubtotal,
  calculateDiscount,
} from "@/lib/helpers";

export async function generateQuotePDF(quote: Quote, profile: UserProfile): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ── Helpers ──────────────────────────────────────────────────────────────
  const black: [number, number, number] = [0, 0, 0];
  const midGray: [number, number, number] = [80, 80, 80];
  const lightGray: [number, number, number] = [220, 220, 220];

  const setBlack = () => doc.setTextColor(...black);
  const setGray = () => doc.setTextColor(...midGray);
  const drawHRule = (yPos: number, thickness = 0.3) => {
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(thickness);
    doc.line(margin, yPos, margin + contentWidth, yPos);
  };

  // ── CABEÇALHO ─────────────────────────────────────────────────────────────
  // Borda superior fina
  doc.setDrawColor(...black);
  doc.setLineWidth(0.8);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  // Nome do profissional (destaque)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  setBlack();
  doc.text(profile.name || "Eletricista", margin, y);

  // Número do orçamento alinhado à direita
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `ORÇAMENTO ${getQuoteNumber(quote.number, profile.quotePrefix)}`,
    pageWidth - margin,
    y,
    { align: "right" }
  );
  y += 5;

  // Telefone
  if (profile.phone) {
    doc.setFontSize(9);
    setGray();
    doc.text(profile.phone, margin, y);
  }

  // Data
  doc.setFontSize(9);
  setGray();
  doc.text(
    `Data: ${new Date().toLocaleDateString("pt-BR")}`,
    pageWidth - margin,
    y,
    { align: "right" }
  );
  y += 8;

  // Linha separadora
  doc.setDrawColor(...black);
  doc.setLineWidth(0.8);
  doc.line(margin, y, margin + contentWidth, y);
  y += 8;

  // ── CLIENTE ───────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setGray();
  doc.text("CLIENTE", margin, y);
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  setBlack();
  doc.text(quote.clientName, margin, y);
  y += 5;

  if (quote.clientPhone) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setBlack();
    doc.text(quote.clientPhone, margin, y);
    y += 5;
  }
  if (quote.clientAddress) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setBlack();
    doc.text(quote.clientAddress, margin, y);
    y += 5;
  }
  y += 4;

  // ── SERVIÇO ───────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setGray();
  doc.text("SERVIÇO", margin, y);
  y += 5;

  const locationLabels: Record<string, string> = {
    house: "Residencial",
    commercial: "Comercial",
    industrial: "Industrial",
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setBlack();
  doc.text(quote.serviceType, margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setBlack();
  doc.text(`Tipo: ${locationLabels[quote.locationType] ?? quote.locationType}`, margin, y);
  y += 8;

  // ── ITENS ─────────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setGray();
  doc.text("ITENS", margin, y);
  y += 5;

  // Cabeçalho da tabela
  const colItem = margin;
  const colQty = margin + contentWidth * 0.52;
  const colUnit = margin + contentWidth * 0.66;
  const colTotal = margin + contentWidth * 0.84;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setGray();
  doc.text("Descrição", colItem, y);
  doc.text("Qtd", colQty, y);
  doc.text("Unit.", colUnit, y);
  doc.text("Total", colTotal, y);
  y += 3;

  drawHRule(y, 0.5);
  y += 5;

  // Linhas de itens
  doc.setFontSize(10);
  for (const item of quote.items) {
    const itemTotal = item.quantity * item.unitPrice;

    // Nome (trunca se necessário)
    const maxNameWidth = contentWidth * 0.50;
    const nameLines = doc.splitTextToSize(item.name, maxNameWidth);

    doc.setFont("helvetica", "normal");
    setBlack();
    doc.text(nameLines, colItem, y);

    doc.text(`${item.quantity} ${item.unit}`, colQty, y);
    doc.text(formatCurrency(item.unitPrice), colUnit, y);

    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(itemTotal), colTotal, y);

    // A linha separadora fica ABAIXO do conteúdo: calcula a altura correta
    const lineHeight = nameLines.length * 5;
    y += lineHeight;

    drawHRule(y, 0.2);
    y += 4;
  }

  y += 2;

  // ── TOTAIS ────────────────────────────────────────────────────────────────
  const subtotal = calculateSubtotal(quote.items);
  const discount = calculateDiscount(subtotal, quote.discountType, quote.discountValue);
  const total = subtotal - discount;

  const totalsX = margin + contentWidth * 0.55;
  const valX = pageWidth - margin;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setGray();
  doc.text("Subtotal:", totalsX, y);
  setBlack();
  doc.text(formatCurrency(subtotal), valX, y, { align: "right" });
  y += 5;

  if (discount > 0) {
    setGray();
    doc.text("Desconto:", totalsX, y);
    setBlack();
    doc.text(`-${formatCurrency(discount)}`, valX, y, { align: "right" });
    y += 5;
  }

  drawHRule(y, 0.5);
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  setBlack();
  doc.text("TOTAL:", totalsX, y);
  doc.text(formatCurrency(total), valX, y, { align: "right" });
  y += 10;

  // ── CONDIÇÕES ─────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setGray();
  doc.text("CONDIÇÕES", margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setBlack();

  if (quote.paymentMethods.length > 0) {
    doc.text(`Pagamento: ${quote.paymentMethods.join(", ")}`, margin, y);
    y += 5;
  }
  if (quote.deadline) {
    doc.text(`Prazo de execução: ${quote.deadline}`, margin, y);
    y += 5;
  }
  if (quote.warranty) {
    doc.text(`Garantia: ${quote.warranty}`, margin, y);
    y += 5;
  }

  doc.setFontSize(10);
  setGray();
  doc.text(
    `Validade do orçamento: ${profile.defaultValidity} dias`,
    margin,
    y
  );
  y += 5;

  // ── OBSERVAÇÕES ───────────────────────────────────────────────────────────
  if (quote.observations) {
    y += 3;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setGray();
    doc.text("OBSERVAÇÕES", margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setBlack();
    const lines = doc.splitTextToSize(quote.observations, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 3;
  }

  // ── RODAPÉ ────────────────────────────────────────────────────────────────
  const footerY = pageHeight - 12;
  doc.setDrawColor(...black);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 4, margin + contentWidth, footerY - 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setGray();
  doc.text(
    `Gerado em ${new Date().toLocaleDateString("pt-BR")} · ${profile.name}`,
    margin,
    footerY
  );
  if (profile.phone) {
    doc.text(profile.phone, pageWidth - margin, footerY, { align: "right" });
  }

  return doc.output("blob");
}

export async function shareQuotePDF(quote: Quote, profile: UserProfile) {
  const blob = await generateQuotePDF(quote, profile);
  const fileName = `orcamento-${getQuoteNumber(quote.number, profile.quotePrefix)}.pdf`;

  // Try native share on mobile (only if supported and can share files)
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function"
  ) {
    const file = new File([blob], fileName, { type: "application/pdf" });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `Orçamento ${getQuoteNumber(quote.number, profile.quotePrefix)}`,
          text: `Orçamento para ${quote.clientName}`,
          files: [file],
        });
        return;
      } catch {
        // user cancelled or error — fall through to download
      }
    }
  }

  // Reliable download fallback
  downloadBlob(blob, fileName);
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

export async function openQuotePDFInTab(quote: Quote, profile: UserProfile) {
  const blob = await generateQuotePDF(quote, profile);
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
