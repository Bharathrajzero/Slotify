"""
csp_solver.py
Core CP-SAT solver engine for the Enterprise Shift-Scheduler & Conflict Resolver.
"""

from __future__ import annotations

import json
import sys
import time
import logging
from dataclasses import dataclass
from typing import Any
from ortools.sat.python import cp_model

logger = logging.getLogger("csp_solver")
logging.basicConfig(level=logging.INFO)

DAYS_PER_WEEK = 7
SHIFTS_PER_DAY = 3  # 0 = Morning, 1 = Afternoon, 2 = Night
NIGHT_SHIFT = 2
MORNING_SHIFT = 0

DEFAULT_SHIFT_DURATION_HOURS = 8.0
DEFAULT_MAX_SOLVE_SECONDS = 30.0

@dataclass(frozen=True)
class Employee:
    id: str
    role: str  # 'junior_staff' | 'senior_staff' | 'manager'
    max_hours_per_week: float
    shift_duration_hours: float = DEFAULT_SHIFT_DURATION_HOURS

@dataclass(frozen=True)
class Constraint:
    employee_id: str
    day_of_week: int
    shift_index: int
    is_hard_constraint: bool
    preference_weight: int  # -10..10

@dataclass(frozen=True)
class ShiftRequirement:
    day_of_week: int
    shift_index: int
    min_staff_count: int
    min_senior_count: int = 0
    subordinate_per_senior_ratio: int | None = None

def _parse_payload(payload: dict[str, Any]) -> tuple[list[Employee], list[Constraint], list[ShiftRequirement]]:
    employees = [
        Employee(
            id=e["id"],
            role=e["role"],
            max_hours_per_week=float(e.get("max_hours_per_week", 40.0)),
            shift_duration_hours=float(e.get("shift_duration_hours", DEFAULT_SHIFT_DURATION_HOURS))
        )
        for e in payload["employees"]
    ]
    
    constraints = [
        Constraint(
            employee_id=c["employee_id"],
            day_of_week=int(c["day_of_week"]),
            shift_index=int(c["shift_index"]),
            is_hard_constraint=bool(c["is_hard_constraint"]),
            preference_weight=int(c.get("preference_weight", 0))
        )
        for c in payload.get("constraints", [])
    ]
    
    requirements = [
        ShiftRequirement(
            day_of_week=int(r["day_of_week"]),
            shift_index=int(r["shift_index"]),
            min_staff_count=int(r["min_staff_count"]),
            min_senior_count=int(r.get("min_senior_count", 0)),
            subordinate_per_senior_ratio=int(r["subordinate_per_senior_ratio"]) if r.get("subordinate_per_senior_ratio") is not None else None
        )
        for r in payload.get("requirements", [])
    ]
    
    return employees, constraints, requirements

def solve_schedule(payload: dict[str, Any], max_solve_seconds: float = DEFAULT_MAX_SOLVE_SECONDS) -> dict[str, Any]:
    start = time.monotonic()
    employees, constraints, requirements = _parse_payload(payload)
    
    if not employees:
        return {
            "status": "MODEL_INVALID",
            "objective_value": None,
            "wall_time_ms": 0,
            "assigned_shifts": [],
            "error": "No employees supplied."
        }

    model = cp_model.CpModel()
    
    # Tuning weights for optimization hierarchy
    PENALTY_UNDERSTAFF = 10000  # High cost: filling operational slots is the priority
    WEIGHT_PREFERENCE = 10      # Lower cost: satisfying scheduling preferences
    
    # Decision Matrix: x[emp_id, day, shift]
    x: dict[tuple[str, int, int], cp_model.IntVar] = {}
    for emp in employees:
        for day in range(DAYS_PER_WEEK):
            for shift in range(SHIFTS_PER_DAY):
                x[(emp.id, day, shift)] = model.NewBoolVar(f"x_{emp.id}_{day}_{shift}")

    # Constraint 1: At most one shift per day
    for emp in employees:
        for day in range(DAYS_PER_WEEK):
            model.AddAtMostOne(x[(emp.id, day, shift)] for shift in range(SHIFTS_PER_DAY))

    # Constraint 2: No Night to next-day Morning shift transitions
    for emp in employees:
        for day in range(DAYS_PER_WEEK - 1):
            model.Add(x[(emp.id, day, NIGHT_SHIFT)] + x[(emp.id, day + 1, MORNING_SHIFT)] <= 1)

    # Constraint 3: Hard blackout enforcement
    for c in constraints:
        if c.is_hard_constraint:
            key = (c.employee_id, c.day_of_week, c.shift_index)
            if key in x:
                model.Add(x[key] == 0)

    # Constraint 4: Max weekly working hours cap
    for emp in employees:
        hours_scaled = sum(
            x[(emp.id, day, shift)] * int(round(emp.shift_duration_hours * 100))
            for day in range(DAYS_PER_WEEK)
            for shift in range(SHIFTS_PER_DAY)
        )
        model.Add(hours_scaled <= int(round(emp.max_hours_per_week * 100)))

    # Constraint 5: Soft operational demand fulfillment & senior profiles
    senior_roles = {"senior_staff", "manager"}
    unmet_diagnostics = []
    objective_terms = []

    for req in requirements:
        slot_vars = [x[(emp.id, req.day_of_week, req.shift_index)] for emp in employees if (emp.id, req.day_of_week, req.shift_index) in x]
        if not slot_vars:
            continue
            
        # Introduce a non-negative under-staffing slack variable for this shift
        understaff_slack = model.NewIntVar(0, req.min_staff_count, f"understaff_{req.day_of_week}_{req.shift_index}")
        
        # Soft staffing rule: assigned + understaff_slack == required
        model.Add(sum(slot_vars) + understaff_slack == req.min_staff_count)
        
        # Penalize understaffing heavily inside the objective function
        objective_terms.append(understaff_slack * -PENALTY_UNDERSTAFF)

        # Senior staff profile boundaries
        if req.min_senior_count > 0:
            senior_vars = [x[(emp.id, req.day_of_week, req.shift_index)] for emp in employees if emp.role in senior_roles and (emp.id, req.day_of_week, req.shift_index) in x]
            if senior_vars:
                model.Add(sum(senior_vars) >= req.min_senior_count)
            else:
                unmet_diagnostics.append({"day": req.day_of_week, "shift": req.shift_index, "issue": "Missing senior profiles."})

        # Ratio evaluation rules
        if req.subordinate_per_senior_ratio and req.subordinate_per_senior_ratio > 0:
            junior_vars = [x[(emp.id, req.day_of_week, req.shift_index)] for emp in employees if emp.role == "junior_staff" and (emp.id, req.day_of_week, req.shift_index) in x]
            senior_vars = [x[(emp.id, req.day_of_week, req.shift_index)] for emp in employees if emp.role in senior_roles and (emp.id, req.day_of_week, req.shift_index) in x]
            model.Add(sum(senior_vars) * req.subordinate_per_senior_ratio >= sum(junior_vars))

    # Incorporate employee preference scoring 
    for c in constraints:
        if not c.is_hard_constraint and c.preference_weight != 0:
            key = (c.employee_id, c.day_of_week, c.shift_index)
            if key in x:
                objective_terms.append(x[key] * c.preference_weight * WEIGHT_PREFERENCE)

    # Optimize the model system matrix
    if objective_terms:
        model.Maximize(sum(objective_terms))

    # Solver Run Configuration
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = max_solve_seconds
    solver.parameters.num_search_workers = 8
    status = solver.Solve(model)

    wall_time_ms = int((time.monotonic() - start) * 1000)
    status_name = solver.StatusName(status)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {
            "status": status_name,
            "objective_value": None,
            "wall_time_ms": wall_time_ms,
            "assigned_shifts": [],
            "unmet_requirements": unmet_diagnostics
        }

    assigned_shifts = []
    for emp in employees:
        for day in range(DAYS_PER_WEEK):
            for shift in range(SHIFTS_PER_DAY):
                if solver.Value(x[(emp.id, day, shift)]) == 1:
                    assigned_shifts.append({
                        "employee_id": emp.id,
                        "day_of_week": day,
                        "shift_index": shift,
                        "is_sick_leave": False
                    })

    return {
        "status": status_name,
        "objective_value": solver.ObjectiveValue() if objective_terms else None,
        "wall_time_ms": wall_time_ms,
        "assigned_shifts": assigned_shifts
    }

def to_postgres_bulk_payload(solver_result: dict[str, Any], job_id: str, week_start_date: str) -> list[dict[str, Any]]:
    from datetime import date, timedelta
    week_start = date.fromisoformat(week_start_date)
    rows = []
    for shift in solver_result.get("assigned_shifts", []):
        shift_date = week_start + timedelta(days=shift["day_of_week"])
        rows.append({
            "employee_id": shift["employee_id"],
            "job_id": job_id,
            "shift_date": shift_date.isoformat(),
            "shift_index": str(shift["shift_index"]),
            "is_sick_leave": shift["is_sick_leave"],
            "is_manual_override": False
        })
    return rows