from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
from pypdf import PdfReader, PdfWriter

app = FastAPI()

# CORS middleware must be added before any routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMPLATE_PATH = "templates/ALL IN ONE FILLABLE DOCUMENTS SOLAR SUBSIDY.pdf"
OUTPUT_PATH = "uploads/filled.pdf"

FIELD_MAP = {
    "applicant_name": [
        "Name of the applicant", "Name of the plant owner", "Eligible Consumer"
    ],
    "mobile": [
        "Mobile", "Phone", "Applicant Mobile", "Vendor Mobile"
    ],
    "email": [
        "Email", "Applicant Email", "Vendor Email"
    ],
    "address": [
        "Address of Installation", "Full Address of Vendor", "Applicant Address"
    ],
    "plant_capacity": [
        "Plant Capacity", "Capacity"
    ],
    "plant_type": [
        "Rooftop/Ground"
    ],
    "total_cost": [
        "Total Cost"
    ],
    "latitude": [
        "Latitude"
    ],
    "longitude": [
        "Longitude"
    ],
    # Add more mappings as needed
}

def fill_pdf(input_pdf_path, output_pdf_path, data):
    reader = PdfReader(input_pdf_path)
    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    # For each page, update all mapped fields
    for page_num, page in enumerate(writer.pages):
        for logical_name, pdf_fields in FIELD_MAP.items():
            value = data.get(logical_name, "")
            for field in pdf_fields:
                try:
                    writer.update_page_form_field_values(page, {field: value})
                except Exception:
                    pass  # Field might not exist on this page
    with open(output_pdf_path, "wb") as f:
        writer.write(f)

@app.post("/fill-pdf/")
async def fill_pdf_endpoint(
    applicant_name: str = Form(...),
    mobile: str = Form(...),
    email: str = Form(...),
    address: str = Form(...),
    plant_capacity: str = Form(...),
    plant_type: str = Form(...),
    total_cost: str = Form(...),
    latitude: str = Form(...),
    longitude: str = Form(...),
):
    os.makedirs("uploads", exist_ok=True)
    data = {
        "applicant_name": applicant_name,
        "mobile": mobile,
        "email": email,
        "address": address,
        "plant_capacity": plant_capacity,
        "plant_type": plant_type,
        "total_cost": total_cost,
        "latitude": latitude,
        "longitude": longitude,
    }
    fill_pdf(TEMPLATE_PATH, OUTPUT_PATH, data)
    return {"pdf_url": "/download-pdf/"}

@app.get("/download-pdf/")
def download_pdf():
    return FileResponse(OUTPUT_PATH, media_type="application/pdf", filename="Filled_Solar_Subsidy.pdf") 