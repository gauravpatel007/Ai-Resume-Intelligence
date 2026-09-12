import fitz  # PyMuPDF
import io

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts raw text from a PDF file using PyMuPDF.
    Returns the extracted text, or raises a ValueError if empty or unreadable.
    """
    try:
        pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
        extracted_text = ""
        
        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            extracted_text += page.get_text() + "\n"
            
        pdf_document.close()
        
        cleaned_text = extracted_text.strip()
        if not cleaned_text:
            raise ValueError("The PDF appears to be empty or scanned (contains no parseable text).")
            
        return cleaned_text
        
    except fitz.FileDataError:
        raise ValueError("The file is corrupted or not a valid PDF.")
    except Exception as e:
        raise ValueError(f"An error occurred while reading the PDF: {str(e)}")
