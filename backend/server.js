const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const TEMPLATE_PATH = path.join(__dirname, 'pdf', 'EditCut.pdf');
const FIELD_LIST_PATH = path.join(__dirname, 'pdf_fields.json');

app.post('/api/fill-pdf', async (req, res) => {
  try {
    if (!fs.existsSync(TEMPLATE_PATH)) {
      return res.status(404).json({ error: 'Template PDF not found' });
    }
    const existingPdfBytes = fs.readFileSync(TEMPLATE_PATH);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();

    // Use field names from JSON file
    const fieldNames = JSON.parse(fs.readFileSync(FIELD_LIST_PATH, 'utf8'));

    // Fill only fields that exist in the PDF and are present in the request body
    for (const fieldName of fieldNames) {
      if (req.body[fieldName] !== undefined && req.body[fieldName] !== null && req.body[fieldName] !== '') {
        try {
          form.getTextField(fieldName).setText(req.body[fieldName]);
        } catch (e) {
          // Not a text field, ignore
        }
      }
    }

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Filled_Solar_Subsidy.pdf');
    res.status(200).send(Buffer.from(pdfBytes));
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate PDF', details: err.message });
  }
});

// Utility route to list all PDF form field names (from JSON)
app.get('/api/list-pdf-fields', async (req, res) => {
  try {
    const fieldNames = JSON.parse(fs.readFileSync(FIELD_LIST_PATH, 'utf8'));
    res.json({ fields: fieldNames });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list PDF fields', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});