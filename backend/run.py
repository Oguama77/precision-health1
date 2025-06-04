#!/usr/bin/env python3
"""
Entry point for the Precision Health AI application.
Run this file to start the server.
"""

import uvicorn
from app.main import app
from app.utils.logging import setup_logging

if __name__ == "__main__":
    logger = setup_logging()
    logger.info("Starting Precision Health AI server...")
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,  # Enable auto-reload for development
        log_level="info"
    ) 