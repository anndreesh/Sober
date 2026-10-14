from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel


class StatusResponse(BaseModel):
    status: str = 'ok'
    timestamp: datetime
    app: str = 'Sober Free Web'
    data: Optional[Dict[str, Any]] = None
