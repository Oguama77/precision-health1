from fastapi import APIRouter, UploadFile, File, Form
from ..schemas.analysis import AnalysisResponse
from ..services.analysis_service import analyze_skin_image

router = APIRouter()

@router.post("/api/analyze")
async def analyze_image(
    image: UploadFile = File(...),
    name: str = Form(""),
    duration: str = Form(""),
    symptoms: str = Form("")
):
    """Analyze uploaded skin image with patient information."""
    # Read the image contents
    contents = await image.read()
    
    # Create patient info dict
    patient_info = {
        "name": name or "Not provided",
        "duration": duration or "Not provided", 
        "symptoms": symptoms or "Not provided"
    }
    
    # Call the analysis service
    result = await analyze_skin_image(contents, "anonymous", patient_info)
    
    return result
