from fastapi import APIRouter, Depends, UploadFile, File, Form
from ..models.user import User
from ..schemas.analysis import AnalysisResponse
from ..services.analysis_service import analyze_skin_image
from ..core.security import get_current_user

router = APIRouter()

@router.post("/api/analyze")
async def analyze_image(
    image: UploadFile = File(...),
    name: str = Form(""),
    duration: str = Form(""),
    symptoms: str = Form(""),
    current_user: User = Depends(get_current_user)
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
    result = await analyze_skin_image(contents, current_user.username, patient_info)
    
    return result
