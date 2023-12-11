const express = require('express');
const app = express();
const fs = require('fs');
const xlsx = require('xlsx');
const PDFDocument = require('pdfkit'); 
const path = require('path');
const ExcelJS = require('exceljs')

app.use(express.json());

// Sample function to generate an Excel file


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

function generateExcelFile(number1, number2, result) {
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.aoa_to_sheet([
        ['Number 1', 'Number 2', 'Result'],
        [number1, number2, result]
    ]);
    xlsx.utils.book_append_sheet(wb, ws, 'Results');

    const excelFilePath = 'public/result.xlsx'; // Relative path for the Excel file
    xlsx.writeFile(wb, excelFilePath);

    return excelFilePath;
}

app.post('/calculate', (req, res) => {
    const { number1, number2 } = req.body;
    const result = parseFloat(number1) + parseFloat(number2);

    const excelFilePath = generateExcelFile(number1, number2, result);

    res.send(result.toString());
});

app.get('/print', async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile('result.xlsx');

        const worksheet = workbook.getWorksheet('Results');
        const pdfDoc = new PDFDocument();
        const writeStream = fs.createWriteStream('file.pdf');

        pdfDoc.pipe(writeStream);

        const columnSpacing = 100;
        const rowHeight = 30;
        const fontSize = 12;
        const startX = 50; // Initial X position for the table
        let currentX = startX;
        let currentY = 50; // Initial Y position for the table

        worksheet.eachRow((row, rowIndex) => {
            currentX = startX; // Reset X position for new row

            row.eachCell((cell, colIndex) => {
                pdfDoc.fontSize(fontSize).text(cell.text, currentX, currentY, { lineBreak: false });
                currentX += columnSpacing;
            });

            currentY += rowHeight; // Move to the next row
        });

        pdfDoc.end();

        writeStream.on('finish', () => {
            res.setHeader('Content-Type', 'application/pdf');
            res.sendFile(path.join(__dirname, 'file.pdf'));
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
