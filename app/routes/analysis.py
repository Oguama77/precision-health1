from fastapi import APIRouter, Depends, UploadFile, File
from ..models.user import User
from ..schemas.analysis import AnalysisResponse
from ..services.analysis_service import analyze_skin_image
from ..core.security import get_current_user

router = APIRouter()

@router.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_image(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Analyze uploaded skin image."""
    # Read the image contents
    contents = await image.read()
    
    # Call the analysis service
    result = await analyze_skin_image(contents, current_user.username)
    
    return result 