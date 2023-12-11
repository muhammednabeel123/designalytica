const express = require('express');
const app = express();
const fs = require('fs');
const xlsx = require('xlsx');
const PDFDocument = require('pdfkit'); 
const path = require('path');
const ExcelJS = require('exceljs')

app.use(express.json());



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

        const table = {
            headers: [],
            rows: []
        };

        worksheet.eachRow((row, rowIndex) => {
            if (rowIndex === 1) {
                // Get headers from the first row
                row.eachCell((cell) => {
                    table.headers.push(cell.value);
                });
            } else {
                // Get data rows
                const rowData = [];
                row.eachCell((cell) => {
                    rowData.push(cell.value);
                });
                table.rows.push(rowData);
            }
        });

        pdfDoc.table(table, {
            prepareHeader: () => pdfDoc.fontSize(12),
            prepareRow: (row, i) => pdfDoc.fontSize(12).text(row.join('\t\t'), { continued: true }),
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
