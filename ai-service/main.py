from fastapi import FastAPI, UploadFile, File
app = FastAPI()

@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    try:

        text = ""

        # PDF
        if file.filename.lower().endswith(".pdf"):

            pdf_bytes = await file.read()

            doc = fitz.open(
                stream=pdf_bytes,
                filetype="pdf"
            )

            for page in doc:
                text += page.get_text()

            # OCR if scanned PDF
            if len(text.strip()) < 30:

                ocr_text = ""

                for page in doc:
                    pix = page.get_pixmap()

                    img_bytes = pix.tobytes("png")

                    img = Image.open(
                        io.BytesIO(img_bytes)
                    )

                    ocr_text += (
                        pytesseract.image_to_string(img)
                    )

                text = ocr_text

        # IMAGE
        else:

            image_bytes = await file.read()

            img = Image.open(
                io.BytesIO(image_bytes)
            )

            text = pytesseract.image_to_string(img)

        return {
            "success": True,
            "text": text
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e)
        }