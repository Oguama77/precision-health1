# Precision Skin Insights Backend

This is the backend service for the Precision Skin Insights application, which provides AI-powered dermatological analysis using LangGraph and GPT-4 Vision.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the backend directory with your OpenAI API key:
```
OPENAI_API_KEY=your_api_key_here
```

## Running the Server

Start the FastAPI server:
```bash
python main.py
```

The server will run on `http://localhost:8000`.

## API Endpoints

### POST /api/analyze
Analyzes a skin condition from an uploaded image.

**Request Body (multipart/form-data):**
- `image`: Image file
- `name`: Patient name
- `duration`: Duration of symptoms
- `symptoms`: Description of symptoms

**Response:**
```json
[
  {
    "condition": "string",
    "confidence": number,
    "severity": "string",
    "description": "string",
    "recommendations": ["string"]
  }
]
```

## Integration with Frontend

The backend is configured to accept requests from the React frontend running on `http://localhost:5173`. CORS is enabled for this origin. 