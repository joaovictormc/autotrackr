import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';

export type ReportFormat = 'pdf' | 'csv';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private async getOwnedVehicle(vehicleId: string, userId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        brand: { select: { name: true } },
        model: { select: { name: true } },
      },
    });
    if (!vehicle) throw new NotFoundException('Veículo não encontrado');
    if (vehicle.userId !== userId) throw new ForbiddenException();
    return vehicle;
  }

  private vehicleLabel(v: { brand: { name: string }; model: { name: string }; plate: string }) {
    return `${v.brand.name} ${v.model.name} · ${v.plate}`;
  }

  private brl(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  private csvEscape(value: unknown): string {
    const s = value == null ? '' : String(value);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  private toCsv(header: string[], rows: (string | number)[][]): Buffer {
    const lines = [header.join(';'), ...rows.map((r) => r.map((c) => this.csvEscape(c)).join(';'))];
    // BOM para o Excel reconhecer UTF-8
    return Buffer.from('﻿' + lines.join('\r\n'), 'utf-8');
  }

  private renderPdf(build: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      build(doc);
      doc.end();
    });
  }

  private pdfHeader(doc: PDFKit.PDFDocument, title: string, subtitle: string) {
    doc.fontSize(18).fillColor('#0ea5e9').text('AutoTrackr', { continued: false });
    doc.moveDown(0.2);
    doc.fontSize(14).fillColor('#111827').text(title);
    doc.fontSize(10).fillColor('#6b7280').text(subtitle);
    doc.fontSize(9).fillColor('#9ca3af').text(`Gerado em ${new Date().toLocaleString('pt-BR')}`);
    doc.moveDown(0.8);
  }

  private pdfTable(doc: PDFKit.PDFDocument, columns: { label: string; width: number }[], rows: string[][]) {
    const startX = doc.page.margins.left;
    const rowHeight = 20;
    let y = doc.y;

    const drawRow = (cells: string[], bold: boolean) => {
      if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.y;
      }
      let x = startX;
      doc.fontSize(9).fillColor(bold ? '#111827' : '#374151').font(bold ? 'Helvetica-Bold' : 'Helvetica');
      columns.forEach((col, i) => {
        doc.text(cells[i] ?? '', x + 2, y + 5, { width: col.width - 4, ellipsis: true });
        x += col.width;
      });
      doc.moveTo(startX, y + rowHeight).lineTo(x, y + rowHeight).strokeColor('#e5e7eb').stroke();
      y += rowHeight;
    };

    drawRow(columns.map((c) => c.label), true);
    rows.forEach((r) => drawRow(r, false));
    doc.font('Helvetica');
  }

  async maintenance(vehicleId: string, userId: string, format: ReportFormat) {
    const vehicle = await this.getOwnedVehicle(vehicleId, userId);
    const records = await this.prisma.maintenanceRecord.findMany({
      where: { vehicleId },
      include: { maintenanceType: { select: { name: true } } },
      orderBy: { date: 'desc' },
    });

    const fmtDate = (d: Date) => new Date(d).toLocaleDateString('pt-BR');

    if (format === 'csv') {
      const header = ['Tipo', 'Data', 'KM', 'Custo', 'Local', 'Status', 'Observações'];
      const rows = records.map((r) => [
        r.maintenanceType.name,
        fmtDate(r.date),
        r.mileage,
        r.cost != null ? Number(r.cost).toFixed(2) : '',
        r.location ?? '',
        r.isCompleted ? 'Concluído' : 'Pendente',
        r.notes ?? '',
      ]);
      return { buffer: this.toCsv(header, rows), mime: 'text/csv; charset=utf-8', ext: 'csv' };
    }

    const buffer = await this.renderPdf((doc) => {
      this.pdfHeader(doc, 'Relatório de Manutenções', this.vehicleLabel(vehicle));
      this.pdfTable(
        doc,
        [
          { label: 'Tipo', width: 130 },
          { label: 'Data', width: 65 },
          { label: 'KM', width: 60 },
          { label: 'Custo', width: 75 },
          { label: 'Local', width: 95 },
          { label: 'Status', width: 90 },
        ],
        records.map((r) => [
          r.maintenanceType.name,
          fmtDate(r.date),
          r.mileage.toLocaleString('pt-BR'),
          r.cost != null ? this.brl(Number(r.cost)) : '—',
          r.location ?? '—',
          r.isCompleted ? 'Concluído' : 'Pendente',
        ]),
      );
    });
    return { buffer, mime: 'application/pdf', ext: 'pdf' };
  }

  async revenue(vehicleId: string, userId: string, format: ReportFormat) {
    const vehicle = await this.getOwnedVehicle(vehicleId, userId);
    const records = await this.prisma.revenueRecord.findMany({
      where: { vehicleId },
      orderBy: { date: 'desc' },
    });
    const total = records.reduce((s, r) => s + Number(r.amount), 0);
    const fmtDate = (d: Date) => new Date(d).toLocaleDateString('pt-BR');

    if (format === 'csv') {
      const header = ['Categoria', 'Data', 'Valor', 'Observações'];
      const rows = records.map((r) => [r.category, fmtDate(r.date), Number(r.amount).toFixed(2), r.notes ?? '']);
      return { buffer: this.toCsv(header, rows), mime: 'text/csv; charset=utf-8', ext: 'csv' };
    }

    const buffer = await this.renderPdf((doc) => {
      this.pdfHeader(doc, 'Relatório de Receitas', this.vehicleLabel(vehicle));
      this.pdfTable(
        doc,
        [
          { label: 'Categoria', width: 180 },
          { label: 'Data', width: 90 },
          { label: 'Valor', width: 110 },
          { label: 'Observações', width: 135 },
        ],
        records.map((r) => [r.category, fmtDate(r.date), this.brl(Number(r.amount)), r.notes ?? '—']),
      );
      doc.moveDown(0.6);
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#10b981').text(`Total: ${this.brl(total)}`);
    });
    return { buffer, mime: 'application/pdf', ext: 'pdf' };
  }
}
