"""
main.py
FastAPI gateway service wrapping the Google OR-Tools CP-SAT scheduler engine.
"""

from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
from typing import Any, List, Optional
from csp_solver import solve_schedule

app = FastAPI(
    title="Enterprise Shift-Scheduler CP-SAT Solver Worker Engine",
    version="1.0.0"
)

class SolverRequest(BaseModel):
    job_id: str = Field(..., description="The unique schedule_jobs trace identifier")
    week_start_date: str = Field(..., regex=r"^\d{4}-\d{2}-\d{2}$")
    employees: List[dict]
    constraints: Optional[List[dict]] = []
    requirements: Optional[List[dict]] = []
    max_solve_seconds: Optional[float] = 30.0

@app.post("/api/v1/optimize", status_code=status.HTTP_200_OK)
def run_optimization(payload: SolverRequest):
    try:
        raw_payload = payload.dict()
        result = solve_schedule(raw_payload, max_solve_seconds=payload.max_solve_seconds)
        
        if result["status"] in ("INFEASIBLE", "MODEL_INVALID"):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Solver could not resolve parameters. Status returned: {result['status']}"
            )
        return result
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal Solver Exception: {str(err)}"
        )