from pydantic import BaseModel, Field
from typing import List, Optional

class ContractTypeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    color: Optional[str] = Field("#3B82F6", max_length=7)  # Hex color

class ContractTypeCreate(ContractTypeBase):
    pass

class ContractTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    color: Optional[str] = Field(None, max_length=7)

class ContractTypeResponse(ContractTypeBase):
    id: int
    company_id: int
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class ContractStatusBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    color: Optional[str] = Field("#10B981", max_length=7)  # Hex color

class ContractStatusCreate(ContractStatusBase):
    pass

class ContractStatusUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    color: Optional[str] = Field(None, max_length=7)

class ContractStatusResponse(ContractStatusBase):
    id: int
    company_id: int
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True
