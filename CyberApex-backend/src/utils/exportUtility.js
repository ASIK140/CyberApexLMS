'use strict';

const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

/**
 * Professional Report Export Utility
 */
class ReportExportUtility {
    
    /**
     * Generate a branded PDF report
     * @param {Object} res - Express response object
     * @param {String} title - Report title
     * @param {Array} columns - Table columns { header, key, width }
     * @param {Array} data - Data rows
     * @param {String} filename - Output filename
     */
    static async generatePDF(res, title, columns, data, filename) {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        doc.pipe(res);

        // --- Header Branding ---
        // Top border line with gradient-like effect (simulated)
        doc.rect(0, 0, doc.page.width, 10).fill('#dc2626'); // CyberApex Red
        
        doc.font('Helvetica-Bold').fontSize(24).fillColor('#ffffff').text('CyberApex LMS', 50, 40);
        doc.fontSize(8).fillColor('#9ca3af').text('ENTERPRISE CYBERSECURITY LEARNING MANAGEMENT SYSTEM', 50, 65);
        
        doc.fillColor('#000000').fontSize(16).text(title.toUpperCase(), 0, 100, { align: 'right', width: doc.page.width - 50 });
        doc.fontSize(10).fillColor('#6b7280').text(`Generated on: ${new Date().toLocaleString()}`, 0, 120, { align: 'right', width: doc.page.width - 50 });
        
        doc.moveDown(4);

        // --- Table Headers ---
        let currentY = doc.y;
        doc.rect(50, currentY, doc.page.width - 100, 25).fill('#1f2937');
        
        doc.fontSize(10).fillColor('#ffffff').font('Helvetica-Bold');
        let currentX = 55;
        columns.forEach(col => {
            doc.text(col.header, currentX, currentY + 7, { width: col.width || 80 });
            currentX += col.width || 80;
        });

        // --- Data Rows ---
        doc.font('Helvetica').fontSize(9).fillColor('#374151');
        currentY += 25;
        
        data.forEach((row, index) => {
            // Zebra striping
            if (index % 2 === 0) {
                doc.rect(50, currentY, doc.page.width - 100, 20).fill('#f9fafb');
            }
            
            doc.fillColor('#374151');
            currentX = 55;
            columns.forEach(col => {
                const val = row[col.key] !== undefined ? String(row[col.key]) : 'N/A';
                doc.text(val, currentX, currentY + 5, { width: (col.width || 80) - 5, ellipsis: true });
                currentX += col.width || 80;
            });
            
            currentY += 20;

            // New page if needed
            if (currentY > 700) {
                doc.addPage();
                currentY = 50;
            }
        });

        // --- Footer ---
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            doc.fontSize(8).fillColor('#9ca3af')
               .text(`CyberApex LMS | Enterprise Security Platform | Confidential | Page ${i + 1} of ${range.count}`, 
                     50, doc.page.height - 40, { align: 'center' });
        }

        doc.end();
    }

    /**
     * Generate an Excel report with professional styling
     */
    static async generateExcel(res, title, columns, data, filename) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Report');

        // Styles
        const headerStyle = {
            font: { bold: true, color: { argb: 'FFFFFF' }, size: 12 },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F2937' } },
            alignment: { vertical: 'middle', horizontal: 'center' }
        };

        // Add Header Row
        sheet.columns = columns.map(col => ({
            header: col.header.toUpperCase(),
            key: col.key,
            width: (col.width / 5) || 20 // Convert PDF width to approx Excel width
        }));

        sheet.getRow(1).eachCell(cell => { cell.style = headerStyle; });

        // Add Data
        sheet.addRows(data);

        // Styling rows
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                row.font = { size: 11 };
                if (rowNumber % 2 === 0) {
                    row.eachCell(cell => {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F9FAFB' } };
                    });
                }
            }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Pragma', 'no-cache');

        await workbook.xlsx.write(res);
        res.end();
    }

    /**
     * Generate a CSV report
     */
    static generateCSV(res, columns, data, filename) {
        const header = columns.map(c => c.header).join(',') + '\n';
        const rows = data.map(row => 
            columns.map(col => {
                let cell = row[col.key] || '';
                // Escape commas and quotes
                let cellStr = String(cell).replace(/"/g, '""');
                if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
                    cellStr = `"${cellStr}"`;
                }
                return cellStr;
            }).join(',')
        ).join('\n');

        // Add UTF-8 BOM for Excel compatibility
        const BOM = '\uFEFF';
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).send(BOM + header + rows);
    }
}

module.exports = ReportExportUtility;
