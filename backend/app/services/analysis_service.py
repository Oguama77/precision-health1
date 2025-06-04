import torch
import torchvision.transforms as transforms
from PIL import Image
import io
import base64
import logging
import json
import re
from langchain_openai import ChatOpenAI
from langchain.schema.messages import HumanMessage, SystemMessage
from fastapi import HTTPException

logger = logging.getLogger(__name__)

async def analyze_skin_image(image_contents: bytes, username: str, patient_info: dict = None) -> list:
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
            model="gpt-4o",
            max_tokens=2000,
            temperature=0
        )
        
        # Create enhanced prompt with patient information
        patient_context = ""
        if patient_info:
            patient_context = f"""
Patient Information:
- Name: {patient_info.get('name', 'Not provided')}
- Symptoms Duration: {patient_info.get('duration', 'Not provided')}
- Symptoms Description: {patient_info.get('symptoms', 'Not provided')}
"""
        
        # Create the messages for the API
        messages = [
            SystemMessage(content=(
                "You are a dermatologist specialized in analyzing skin conditions. "
                "Analyze the skin image and provide a detailed assessment in a structured format. "
                "Your response must be a JSON object with the following structure: "
                "{"
                '  "condition": "main condition identified",'
                '  "severity": "Mild/Moderate/Severe",'
                '  "description": "detailed description of the condition",'
                '  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]'
                "}"
                "Be thorough but clear. Include specific treatment recommendations."
            )),
            HumanMessage(content=[
                {
                    "type": "text",
                    "text": f"Please analyze this skin image and provide a detailed assessment.{patient_context}"
                },
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{img_str}"}
                }
            ])
        ]
        
        # Get the analysis from the API
        response = llm.invoke(messages)
        
        # Log successful analysis
        logger.info(f"Analysis completed successfully for user: {username}")
        
        # Parse the AI response to extract structured data
        ai_response = response.content.strip()
        
        try:
            # Try to extract JSON from the response
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                parsed_result = json.loads(json_str)
                
                # Ensure all required fields are present
                analysis_result = {
                    "condition": parsed_result.get("condition", "Skin condition identified"),
                    "severity": parsed_result.get("severity", "Moderate"),
                    "description": parsed_result.get("description", ai_response),
                    "recommendations": parsed_result.get("recommendations", [
                        "Consult with a dermatologist for proper diagnosis",
                        "Keep the affected area clean and dry",
                        "Avoid irritating products"
                    ])
                }
            else:
                # Fallback: create structured response from unstructured text
                analysis_result = {
                    "condition": "Dermatological Assessment",
                    "severity": "Moderate",
                    "description": ai_response,
                    "recommendations": [
                        "Consult with a dermatologist for proper diagnosis",
                        "Follow a gentle skincare routine",
                        "Monitor the condition for changes"
                    ]
                }
        except json.JSONDecodeError:
            # Fallback for non-JSON responses
            analysis_result = {
                "condition": "Dermatological Assessment", 
                "severity": "Moderate",
                "description": ai_response,
                "recommendations": [
                    "Consult with a dermatologist for proper diagnosis",
                    "Follow a gentle skincare routine", 
                    "Monitor the condition for changes"
                ]
            }
        
        # Return as an array to match frontend expectations
        return [analysis_result]
        
    except Exception as e:
        # Log the error
        logger.error(f"Error during analysis for user {username}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
