import torch
import torchvision.transforms as transforms
from PIL import Image
import io
import base64
import logging
from langchain_openai import ChatOpenAI
from langchain.schema.messages import HumanMessage, SystemMessage
from fastapi import HTTPException

logger = logging.getLogger(__name__)

async def analyze_skin_image(image_contents: bytes, username: str) -> dict:
    """Analyze skin image using AI model."""
    try:
        # Log the analysis request
        logger.info(f"Analysis request received from user: {username}")
        
        # Process the image
        pil_image = Image.open(io.BytesIO(image_contents))
        
        # Convert to RGB if necessary
        if pil_image.mode != 'RGB':
            pil_image = pil_image.convert('RGB')
        
        # Prepare the image for analysis
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
        ])
        
        image_tensor = transform(pil_image)
        image_tensor = image_tensor.unsqueeze(0)  # Add batch dimension
        
        # Convert the image to base64 for the API
        buffered = io.BytesIO()
        pil_image.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        # Initialize OpenAI client
        llm = ChatOpenAI(
            model="gpt-4-vision-preview",
            max_tokens=1500,
            temperature=0
        )
        
        # Create the messages for the API
        messages = [
            SystemMessage(content=(
                "You are a dermatologist specialized in analyzing skin conditions. "
                "Provide a detailed analysis of the skin image, including potential conditions, "
                "recommendations, and general skin health observations. Be thorough but clear."
            )),
            HumanMessage(content=[
                {
                    "type": "text",
                    "text": "Please analyze this skin image and provide a detailed assessment."
                },
                {
                    "type": "image_url",
                    "image_url": f"data:image/jpeg;base64,{img_str}"
                }
            ])
        ]
        
        # Get the analysis from the API
        response = llm.invoke(messages)
        
        # Log successful analysis
        logger.info(f"Analysis completed successfully for user: {username}")
        
        # Return the analysis results
        return {
            "analysis": response.content,
            "success": True
        }
        
    except Exception as e:
        # Log the error
        logger.error(f"Error during analysis for user {username}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 