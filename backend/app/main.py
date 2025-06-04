from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import CORS_ORIGINS
from .routes import auth, analysis
from .utils.logging import setup_logging

# Setup logging
logger = setup_logging()

app = FastAPI(
    title="Precision Health AI",
    description="AI-powered skin analysis application",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],
    max_age=3600  # Cache preflight requests for 1 hour
)

# Include routers
app.include_router(auth.router, tags=["authentication"])
app.include_router(analysis.router, tags=["analysis"])

@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Precision Health AI API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting server...")
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
