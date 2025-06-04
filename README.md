# Precision Health AI - Backend

A modular FastAPI application for AI-powered skin analysis.

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app initialization
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py        # Configuration and environment variables
│   │   └── security.py      # Authentication and security utilities
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py          # Pydantic models for data structures
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── analysis.py      # Request/response schemas for analysis
│   │   └── user.py          # Request/response schemas for users
│   ├── services/
│   │   ├── __init__.py
│   │   ├── analysis_service.py  # Business logic for image analysis
│   │   └── user_service.py      # Business logic for user management
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py          # Authentication endpoints
│   │   └── analysis.py      # Analysis endpoints
│   └── utils/
│       ├── __init__.py
│       └── logging.py       # Logging utilities
├── run.py                   # Application entry point
├── requirements.txt         # Python dependencies
└── users.json              # User data storage (JSON file)
```

## Architecture Overview

### Core Layer
- **config.py**: Environment variables, configuration settings
- **security.py**: Authentication, JWT tokens, password hashing

### Models Layer
- **user.py**: User data models and token models

### Schemas Layer
- **analysis.py**: API request/response schemas for analysis endpoints
- **user.py**: API request/response schemas for user endpoints

### Services Layer
- **analysis_service.py**: Business logic for image processing and AI analysis
- **user_service.py**: Business logic for user management and authentication

### Routes Layer
- **auth.py**: Authentication endpoints (login, signup, user info)
- **analysis.py**: Image analysis endpoints

### Utils Layer
- **logging.py**: Logging configuration and utilities

## Installation

1. Create a virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file with your configuration:
```
OPENAI_API_KEY=your_openai_api_key_here
SECRET_KEY=your_secret_key_here
```

## Running the Application

### Development Mode (with auto-reload)
```bash
python run.py
```

### Production Mode
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

## API Endpoints

### Authentication
- `POST /token` - Login and get access token
- `POST /signup` - Register new user
- `GET /users/me` - Get current user information

### Analysis
- `POST /api/analyze` - Analyze uploaded skin image

### Health Check
- `GET /` - Root endpoint with API information
- `GET /health` - Health check endpoint

## Features

- **Modular Architecture**: Clean separation of concerns
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Image Analysis**: AI-powered skin condition analysis using OpenAI's GPT-4 Vision
- **CORS Support**: Configured for frontend integration
- **Error Handling**: Comprehensive error handling and logging
- **Type Safety**: Full type hints using Pydantic models
- **Auto-documentation**: Automatic API documentation with FastAPI/Swagger

## Development

The application uses a modular structure that makes it easy to:
- Add new endpoints by creating new route files
- Add new business logic by creating new service files
- Extend data models by adding new model/schema files
- Add utility functions in the utils package

Each module has a specific responsibility, making the codebase maintainable and testable.

## Integration with Frontend

The backend is configured to accept requests from the React frontend running on `http://localhost:5173`. CORS is enabled for this origin. 