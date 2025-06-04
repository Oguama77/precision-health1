from pydantic import BaseModel

class UserSignupRequest(BaseModel):
    username: str
    password: str
    email: str
    full_name: str

class UserSignupResponse(BaseModel):
    message: str 