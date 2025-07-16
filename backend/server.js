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

const TEMPLATE_PATH = path.join(__dirname, 'pdf', 'test.pdf');

// Expanded FIELD_MAP to cover all fields in the PDF
const FIELD_MAP = {
  category_of_customer: ['Category Of The Customer'],
  applicant_name: ['Name of the applicant', 'Name of the plant owner'],
  mobile_number: ['Mobile Number', 'Mobile', 'Phone'],
  email: ['Email', 'Email ID'],
  address: ['Address Of Installation'],
  state: ['State'],
  pin_code: ['Pin Code'],
  district: ['District'],
  project_model: ['Project Model'],
  total_cost: ['Total Cost Of Installation'],
  plant_type: ['Rooftop only / Rooftop plus ground'],
  plant_capacity_rooftop: ['plant capacity rooftop only'],
  total_plant_capacity: ['Total Plant Capacity'],
  latitude: ['Latitude'],
  longitude: ['Longitude'],
  net_meter_reg_no: ['Net Meter Registration Number'],
  reg_date: ['Registration Date'],
  service_number: ['Service Number'],
  category: ['Category'],
  load_kw: ['Load in kW'],
  vendor_name: ['Name of Vendor'],
  door_no: ['Door No'],
  street: ['Street'],
  city_village: ['City/Village '],
  mandal: ['Mandal'],
  vendor_phone: ['Phone'],
  vendor_mobile: ['Mobile'],
  vendor_email: ['Email ID'],
  pv_make: ['PV Make'],
  pv_serial: ['PV Serial number'],
  module_type: ['Type of module'],
  module_capacity: ['Capacity of each module'],
  full_vendor_address: ['Full Address Of Vendor'],
  text_73xafp: ['text_73xafp'],
  efficiency: ['Efficiency'],
  inverter_model: ['Inverter Model'],
};

app.post('/api/fill-pdf', async (req, res) => {
  try {
    if (!fs.existsSync(TEMPLATE_PATH)) {
      return res.status(404).json({ error: 'Template PDF not found' });
    }
    const existingPdfBytes = fs.readFileSync(TEMPLATE_PATH);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();

    // Fill all mapped fields on all pages
    const pages = pdfDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
      for (const [logical, pdfFields] of Object.entries(FIELD_MAP)) {
        const value = req.body[logical] || '';
        for (const field of pdfFields) {
          try {
            form.getTextField(field).setText(value);
          } catch (e) {
            // Field may not exist on this page, ignore
          }
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 