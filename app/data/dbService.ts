/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  NYAMASI FEMS — DATA SERVICE LAYER  (dbService.ts)
 *
 *  All reads and writes flow through here. Every screen imports ONLY from this
 *  file — never from mockDB directly.
 *
 *  Swap the internals for Firebase/Firestore or a REST API without touching
 *  a single screen.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { db } from "./mockDB";
import type {
  User, Employee, Report, CheckIn, PayrollRecord,
  UserRole, EmpRole, EmpStatus, PayStatus,
} from "./mockDB";

// ─── Re-export types so screens only need one import path ─────────────────────
export type {
  User, Employee, Report, CheckIn, PayrollRecord,
  UserRole, EmpRole, EmpStatus, PayStatus,
};

// ─── Utility helpers ──────────────────────────────────────────────────────────

/** Generate a sortable ISO date string for "today". */
const todayISO = (): string => new Date().toISOString().split("T")[0];

/** Simulate async network latency (remove in production). */
const delay = (ms = 0) => new Promise<void>((r) => setTimeout(r, ms));

/** Build a simple incremental ID. In production, use uuid or Firestore auto-id. */
const newId = (prefix: string, collection: { id: string }[]): string => {
  const nums = collection.map((x) => parseInt(x.id.replace(prefix, ""), 10)).filter(Boolean);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
};

/** Derive initials from full name. */
const toInitials = (fullName: string): string =>
  fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

/** Friendly display date from ISO.  "2026-04-12" → "Apr 12, 2026" */
const isoToDisplay = (iso: string): string => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

/** Short display date. "2026-04-12" → "Apr 12" */
const isoToShort = (iso: string): string => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/** Day name from ISO. "2026-04-12" → "Sunday" */
const isoToDayName = (iso: string): string => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long" });
};

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION A: AUTHENTICATION
// ─────────────────────────────────────────────────────────────────────────────

export interface LoginResult {
  success: boolean;
  user: User | null;
  employee: Employee | null;
  error?: string;
}

/**
 * Authenticate a user by phone + password.
 * Returns the User and linked Employee (if any).
 */
export const login = async (phone: string, password: string): Promise<LoginResult> => {
  await delay(400);
  const user = db.users.find((u) => u.phone === phone && u.password === password && u.active);
  if (!user) {
    return { success: false, user: null, employee: null, error: "Invalid credentials" };
  }
  const employee = user.employeeId
    ? db.employees.find((e) => e.id === user.employeeId) ?? null
    : null;
  return { success: true, user, employee };
};

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION B: EMPLOYEES
// ─────────────────────────────────────────────────────────────────────────────

/** Return all employees (optional status filter). */
export const getEmployees = async (statusFilter?: EmpStatus): Promise<Employee[]> => {
  await delay();
  const list = statusFilter
    ? db.employees.filter((e) => e.status === statusFilter)
    : [...db.employees];
  return list.sort((a, b) => a.fullName.localeCompare(b.fullName));
};

/** Return a single employee by id. */
export const getEmployeeById = async (id: string): Promise<Employee | null> => {
  await delay();
  return db.employees.find((e) => e.id === id) ?? null;
};

/** Return employees that are currently online. */
export const getOnlineEmployees = async (): Promise<Employee[]> => {
  await delay();
  return db.employees.filter((e) => e.online && e.status === "active");
};

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  role: EmpRole;
  department?: string;
  phone: string;
  email: string;
  assignedArea: string;
  baseSalary: number;
  dailyTarget: number;
  monthlyTarget: number;
  password: string;         // initial password for the auto-created user account
  createdBy: string;        // userId of the admin performing the action
}

/**
 * Admin: create an employee AND a linked user account atomically.
 * Returns both created records.
 */
export const createEmployee = async (
  input: CreateEmployeeInput
): Promise<{ employee: Employee; user: User }> => {
  await delay(300);

  const fullName = `${input.firstName} ${input.lastName}`;
  const empId    = newId("e", db.employees);
  const userId   = newId("u", db.users);
  const now      = new Date().toISOString();

  const employee: Employee = {
    id: empId,
    firstName: input.firstName,
    lastName: input.lastName,
    fullName,
    initials: toInitials(fullName),
    role: input.role,
    department: input.department ?? "Field Sales",
    phone: input.phone,
    email: input.email,
    status: "active",
    online: false,
    assignedArea: input.assignedArea,
    lastKnownLocation: {
      latitude: -1.2921,
      longitude: 36.8219,
      name: "Nairobi (pending first check-in)",
      timestamp: now,
    },
    salary: { base: input.baseSalary, currency: "KES" },
    targets: { daily: input.dailyTarget, monthly: input.monthlyTarget },
    rating: 0,
    joinDate: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    joinDateISO: now.split("T")[0],
    createdAt: now,
    createdBy: input.createdBy,
  };

  const user: User = {
    id: userId,
    phone: input.phone,
    password: input.password,
    role: "employee",
    employeeId: empId,
    active: true,
    createdAt: now,
  };

  // Write to store
  db.employees.push(employee);
  db.users.push(user);

  return { employee, user };
};

/** Update mutable employee fields. */
export const updateEmployee = async (
  id: string,
  updates: Partial<Pick<Employee,
    "firstName" | "lastName" | "role" | "phone" | "email" |
    "assignedArea" | "status" | "rating" | "online"
  > & {
    baseSalary?: number;
    dailyTarget?: number;
    monthlyTarget?: number;
  }>
): Promise<Employee | null> => {
  await delay(200);
  const idx = db.employees.findIndex((e) => e.id === id);
  if (idx === -1) return null;

  const emp = { ...db.employees[idx] };
  if (updates.firstName)    emp.firstName = updates.firstName;
  if (updates.lastName)     emp.lastName  = updates.lastName;
  if (updates.firstName || updates.lastName) {
    emp.fullName = `${emp.firstName} ${emp.lastName}`;
    emp.initials = toInitials(emp.fullName);
  }
  if (updates.role)         emp.role         = updates.role;
  if (updates.phone)        emp.phone        = updates.phone;
  if (updates.email)        emp.email        = updates.email;
  if (updates.assignedArea) emp.assignedArea = updates.assignedArea;
  if (updates.status)       emp.status       = updates.status;
  if (updates.rating !== undefined) emp.rating = updates.rating;
  if (updates.online !== undefined) emp.online = updates.online;
  if (updates.baseSalary  !== undefined) emp.salary.base     = updates.baseSalary;
  if (updates.dailyTarget !== undefined) emp.targets.daily   = updates.dailyTarget;
  if (updates.monthlyTarget !== undefined) emp.targets.monthly = updates.monthlyTarget;

  db.employees[idx] = emp;
  return emp;
};

/** Soft-delete: mark employee and their user account as inactive. */
export const deactivateEmployee = async (id: string): Promise<boolean> => {
  await delay(200);
  const empIdx = db.employees.findIndex((e) => e.id === id);
  if (empIdx === -1) return false;
  db.employees[empIdx].status = "inactive";
  db.employees[empIdx].online = false;

  const userIdx = db.users.findIndex((u) => u.employeeId === id);
  if (userIdx !== -1) db.users[userIdx].active = false;

  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION C: REPORTS
// ─────────────────────────────────────────────────────────────────────────────

/** All reports, newest first. */
export const getAllReports = async (): Promise<Report[]> => {
  await delay();
  return [...db.reports].sort((a, b) => b.dateISO.localeCompare(a.dateISO));
};

/** Reports for a specific employee, newest first. */
export const getReportsByEmployee = async (employeeId: string): Promise<Report[]> => {
  await delay();
  return db.reports
    .filter((r) => r.employeeId === employeeId)
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO));
};

/** Reports for a specific date (all employees). */
export const getReportsByDate = async (dateISO: string): Promise<Report[]> => {
  await delay();
  return db.reports.filter((r) => r.dateISO === dateISO);
};

/** Reports within a date range. */
export const getReportsByDateRange = async (
  fromISO: string,
  toISO: string
): Promise<Report[]> => {
  await delay();
  return db.reports
    .filter((r) => r.dateISO >= fromISO && r.dateISO <= toISO)
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO));
};

export interface AddReportInput {
  employeeId: string;
  sales: number;
  customersReached: number;
  samplersGiven: number;
  notes: string;
  location: string;
  coords?: { latitude: number; longitude: number } | null;
  dateISO?: string;        // defaults to today
}

/** Employee submits a daily report. Auto-flags low-sales entries. */
export const addReport = async (input: AddReportInput): Promise<Report> => {
  await delay(300);

  const dateISO = input.dateISO ?? todayISO();
  const id = newId("r", db.reports);
  const now = new Date().toISOString();

  // Auto-flag heuristic: sales below 10 = flagged
  const flagged = input.sales < 10;

  const report: Report = {
    id,
    employeeId: input.employeeId,
    date:      isoToDisplay(dateISO),
    dateISO,
    dayName:   isoToDayName(dateISO),
    shortDate: isoToShort(dateISO),
    sales: input.sales,
    customersReached: input.customersReached,
    samplersGiven: input.samplersGiven,
    notes: input.notes,
    location: input.location,
    coords: input.coords ?? null,
    submitted: true,
    approved: false,
    flagged,
    createdAt: now,
  };

  db.reports.push(report);
  return report;
};

/** Admin approves a report. */
export const approveReport = async (reportId: string): Promise<boolean> => {
  await delay(200);
  const idx = db.reports.findIndex((r) => r.id === reportId);
  if (idx === -1) return false;
  db.reports[idx].approved = true;
  db.reports[idx].flagged  = false;
  return true;
};

/** Admin toggles a flag on a report. */
export const flagReport = async (reportId: string, flagged: boolean): Promise<boolean> => {
  await delay(100);
  const idx = db.reports.findIndex((r) => r.id === reportId);
  if (idx === -1) return false;
  db.reports[idx].flagged = flagged;
  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION D: DERIVED / COMPUTED DATA
//  Never stored — always computed dynamically from the reports collection.
// ─────────────────────────────────────────────────────────────────────────────

export interface EmployeeMonthlyAggregate {
  employee: Employee;
  totalSales: number;
  totalCustomers: number;
  totalSamplers: number;
  daysReported: number;
  target: number;
  achievePct: number;
  avgSalesPerDay: number;
  trend: "up" | "down" | "flat";
  bestDayISO: string;
  bestDayDisplay: string;
}

/**
 * Compute per-employee totals for a given month.
 * month: "Apr" | "Mar" … year: "2026"
 */
export const getMonthlyAggregates = async (
  month: string,
  year: string
): Promise<EmployeeMonthlyAggregate[]> => {
  await delay();

  // Build a prefix to filter dateISO: "2026-04-"
  const monthIndex = [
    "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
  ].indexOf(month);
  if (monthIndex === -1) return [];
  const prefix = `${year}-${String(monthIndex + 1).padStart(2, "0")}-`;

  const periodReports = db.reports.filter((r) => r.dateISO.startsWith(prefix));

  return db.employees
    .filter((e) => e.status === "active")
    .map((emp) => {
      const empReports = periodReports.filter((r) => r.employeeId === emp.id);
      if (!empReports.length) return null;

      const totalSales     = empReports.reduce((s, r) => s + r.sales, 0);
      const totalCustomers = empReports.reduce((s, r) => s + r.customersReached, 0);
      const totalSamplers  = empReports.reduce((s, r) => s + r.samplersGiven, 0);
      const daysReported   = empReports.length;
      const avgSalesPerDay = daysReported ? parseFloat((totalSales / daysReported).toFixed(1)) : 0;
      const target         = emp.targets.monthly;
      const achievePct     = Math.round((totalSales / target) * 100);

      // Best day = max sales
      const best = empReports.reduce((b, r) => (r.sales > b.sales ? r : b), empReports[0]);

      // Trend: compare first-half vs second-half of reported days
      const mid      = Math.floor(daysReported / 2);
      const sorted   = [...empReports].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
      const firstAvg = sorted.slice(0, mid).reduce((s, r) => s + r.sales, 0) / (mid || 1);
      const lastAvg  = sorted.slice(mid).reduce((s, r) => s + r.sales, 0) / (daysReported - mid || 1);
      const trend: "up" | "down" | "flat" =
        lastAvg > firstAvg * 1.05 ? "up" : lastAvg < firstAvg * 0.95 ? "down" : "flat";

      return {
        employee: emp,
        totalSales,
        totalCustomers,
        totalSamplers,
        daysReported,
        target,
        achievePct,
        avgSalesPerDay,
        trend,
        bestDayISO: best.dateISO,
        bestDayDisplay: best.shortDate,
      } as EmployeeMonthlyAggregate;
    })
    .filter(Boolean) as EmployeeMonthlyAggregate[];
};

export interface DashboardKpis {
  totalSales: number;
  totalCustomers: number;
  totalSamplers: number;
  totalEmployees: number;
  onlineEmployees: number;
  topPerformer: Employee | null;
  conversionRate: number;       // samplers-to-sales %
  avgSalesPerEmployee: number;
}

/** Compute KPIs for a given date range. Used by AdminDashboard. */
export const getDashboardKpis = async (
  fromISO: string,
  toISO: string
): Promise<DashboardKpis> => {
  await delay();

  const rangeReports = db.reports.filter(
    (r) => r.dateISO >= fromISO && r.dateISO <= toISO && r.submitted
  );

  const totalSales     = rangeReports.reduce((s, r) => s + r.sales, 0);
  const totalCustomers = rangeReports.reduce((s, r) => s + r.customersReached, 0);
  const totalSamplers  = rangeReports.reduce((s, r) => s + r.samplersGiven, 0);

  // Per-employee totals to find top performer
  const byEmployee: Record<string, number> = {};
  rangeReports.forEach((r) => {
    byEmployee[r.employeeId] = (byEmployee[r.employeeId] ?? 0) + r.sales;
  });
  const topEmpId = Object.entries(byEmployee).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const topPerformer = topEmpId ? (db.employees.find((e) => e.id === topEmpId) ?? null) : null;

  const activeEmployees = db.employees.filter((e) => e.status === "active");
  const onlineEmployees = activeEmployees.filter((e) => e.online).length;
  const participatingCount = Object.keys(byEmployee).length || 1;

  const conversionRate =
    totalSamplers > 0 ? Math.round((totalSales / totalSamplers) * 100) : 0;

  return {
    totalSales,
    totalCustomers,
    totalSamplers,
    totalEmployees: activeEmployees.length,
    onlineEmployees,
    topPerformer,
    conversionRate,
    avgSalesPerEmployee: Math.round(totalSales / participatingCount),
  };
};

export interface ChartDataset {
  labels: string[];
  sales: number[];
  customers: number[];
  samplers: number[];
}

/** Build chart datasets from real report data.  */
export const getChartData = async (
  mode: "daily" | "weekly" | "monthly",
  referenceISO: string  // "today" anchor date e.g. "2026-04-12"
): Promise<ChartDataset> => {
  await delay();

  const anchor = new Date(referenceISO + "T00:00:00");

  if (mode === "daily") {
    // Last 7 days
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(anchor);
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    });
    const dayLabels = days.map((iso) =>
      new Date(iso + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })
    );
    const sales     = days.map((iso) => db.reports.filter((r) => r.dateISO === iso).reduce((s, r) => s + r.sales, 0));
    const customers = days.map((iso) => db.reports.filter((r) => r.dateISO === iso).reduce((s, r) => s + r.customersReached, 0));
    const samplers  = days.map((iso) => db.reports.filter((r) => r.dateISO === iso).reduce((s, r) => s + r.samplersGiven, 0));
    return { labels: dayLabels, sales, customers, samplers };
  }

  if (mode === "weekly") {
    // Last 4 weeks
    const weeks: string[][] = Array.from({ length: 4 }, (_, wi) => {
      return Array.from({ length: 7 }, (_, di) => {
        const d = new Date(anchor);
        d.setDate(d.getDate() - ((3 - wi) * 7 + (6 - di)));
        return d.toISOString().split("T")[0];
      });
    });
    const labels    = weeks.map((_, i) => `Wk ${i + 1}`);
    const sales     = weeks.map((wk) => wk.reduce((s, iso) => s + db.reports.filter((r) => r.dateISO === iso).reduce((a, r) => a + r.sales, 0), 0));
    const customers = weeks.map((wk) => wk.reduce((s, iso) => s + db.reports.filter((r) => r.dateISO === iso).reduce((a, r) => a + r.customersReached, 0), 0));
    const samplers  = weeks.map((wk) => wk.reduce((s, iso) => s + db.reports.filter((r) => r.dateISO === iso).reduce((a, r) => a + r.samplersGiven, 0), 0));
    return { labels, sales, customers, samplers };
  }

  // monthly: last 6 months
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(anchor);
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return {
      label: d.toLocaleDateString("en-US", { month: "short" }),
      prefix: d.toISOString().slice(0, 7) + "-",
    };
  });
  const labels    = months.map((m) => m.label);
  const sales     = months.map(({ prefix }) => db.reports.filter((r) => r.dateISO.startsWith(prefix)).reduce((s, r) => s + r.sales, 0));
  const customers = months.map(({ prefix }) => db.reports.filter((r) => r.dateISO.startsWith(prefix)).reduce((s, r) => s + r.customersReached, 0));
  const samplers  = months.map(({ prefix }) => db.reports.filter((r) => r.dateISO.startsWith(prefix)).reduce((s, r) => s + r.samplersGiven, 0));
  return { labels, sales, customers, samplers };
};

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION E: CHECK-INS
// ─────────────────────────────────────────────────────────────────────────────

/** Return all check-ins for a given date. */
export const getCheckinsByDate = async (dateISO: string): Promise<CheckIn[]> => {
  await delay();
  return db.checkins.filter((c) => c.date === dateISO);
};

/** Return all check-ins for a specific employee. */
export const getCheckinsByEmployee = async (employeeId: string): Promise<CheckIn[]> => {
  await delay();
  return db.checkins
    .filter((c) => c.employeeId === employeeId)
    .sort((a, b) => b.checkInTime.localeCompare(a.checkInTime));
};

export interface CheckInInput {
  employeeId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  locationName: string;
}

/** Record a new check-in and mark the employee as online. */
export const recordCheckIn = async (input: CheckInInput): Promise<CheckIn> => {
  await delay(300);

  const now     = new Date().toISOString();
  const dateISO = now.split("T")[0];
  const id      = newId("c", db.checkins);

  const checkin: CheckIn = {
    id,
    employeeId: input.employeeId,
    coords: {
      latitude:  input.latitude,
      longitude: input.longitude,
      accuracy:  input.accuracy,
    },
    locationName: input.locationName,
    checkInTime:  now,
    checkOutTime: null,
    status: "checked-in",
    date:   dateISO,
  };

  db.checkins.push(checkin);

  // Mark employee online + update last known location
  const empIdx = db.employees.findIndex((e) => e.id === input.employeeId);
  if (empIdx !== -1) {
    db.employees[empIdx].online = true;
    db.employees[empIdx].lastKnownLocation = {
      latitude:  input.latitude,
      longitude: input.longitude,
      name:      input.locationName,
      timestamp: now,
    };
  }

  return checkin;
};

/** Record checkout and mark employee offline. */
export const recordCheckOut = async (checkinId: string): Promise<CheckIn | null> => {
  await delay(200);

  const idx = db.checkins.findIndex((c) => c.id === checkinId);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  db.checkins[idx].checkOutTime = now;
  db.checkins[idx].status = "checked-out";

  const empIdx = db.employees.findIndex(
    (e) => e.id === db.checkins[idx].employeeId
  );
  if (empIdx !== -1) db.employees[empIdx].online = false;

  return db.checkins[idx];
};

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION F: PAYROLL
// ─────────────────────────────────────────────────────────────────────────────

/** Return all payroll records for a given period. */
export const getPayrollByPeriod = async (
  month: string,
  year: string
): Promise<PayrollRecord[]> => {
  await delay();
  return db.payroll.filter(
    (p) => p.period.month === month && p.period.year === year
  );
};

/** Return all payroll records for a specific employee. */
export const getPayrollByEmployee = async (employeeId: string): Promise<PayrollRecord[]> => {
  await delay();
  return db.payroll
    .filter((p) => p.employeeId === employeeId)
    .sort((a, b) =>
      `${b.period.year}-${b.period.month}`.localeCompare(
        `${a.period.year}-${a.period.month}`
      )
    );
};

/** Derived: compute gross pay for a payroll record. */
export const calcGross = (p: PayrollRecord): number =>
  p.baseSalary +
  p.bonuses.salesBonus +
  p.bonuses.performanceBonus +
  p.allowances.reduce((s, a) => s + a.amount, 0);

/** Derived: compute total deductions. */
export const calcTotalDeductions = (p: PayrollRecord): number =>
  p.deductions.reduce((s, d) => s + d.amount, 0);

/** Derived: net pay. */
export const calcNet = (p: PayrollRecord): number =>
  calcGross(p) - calcTotalDeductions(p);

export interface PayrollUpdateInput {
  salesBonus?: number;
  performanceBonus?: number;
  allowances?: { label: string; amount: number }[];
  deductions?: { label: string; amount: number }[];
  daysWorked?: number;
  notes?: string;
}

/** Admin: update a payroll record (adjust bonus, allowances, deductions). */
export const updatePayrollRecord = async (
  id: string,
  updates: PayrollUpdateInput
): Promise<PayrollRecord | null> => {
  await delay(200);
  const idx = db.payroll.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  const record = { ...db.payroll[idx] };
  if (updates.salesBonus      !== undefined) record.bonuses.salesBonus      = updates.salesBonus;
  if (updates.performanceBonus !== undefined) record.bonuses.performanceBonus = updates.performanceBonus;
  if (updates.allowances)  record.allowances = updates.allowances;
  if (updates.deductions)  record.deductions  = updates.deductions;
  if (updates.daysWorked   !== undefined) record.attendance.daysWorked = updates.daysWorked;
  if (updates.notes        !== undefined) record.notes = updates.notes;

  db.payroll[idx] = record;
  return record;
};

/** Admin: mark a payroll record as paid. */
export const markPayrollPaid = async (id: string): Promise<PayrollRecord | null> => {
  await delay(200);
  const idx = db.payroll.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  db.payroll[idx].status = "paid";
  db.payroll[idx].paidAt = new Date().toISOString();
  return db.payroll[idx];
};

/** Derived: payroll summary totals for a period (used by PayrollScreen header). */
export interface PayrollPeriodSummary {
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  paidCount: number;
  pendingCount: number;
  draftCount: number;
}

export const getPayrollPeriodSummary = async (
  month: string,
  year: string
): Promise<PayrollPeriodSummary> => {
  await delay();
  const records = db.payroll.filter(
    (p) => p.period.month === month && p.period.year === year
  );
  return {
    totalGross:      records.reduce((s, p) => s + calcGross(p), 0),
    totalNet:        records.reduce((s, p) => s + calcNet(p), 0),
    totalDeductions: records.reduce((s, p) => s + calcTotalDeductions(p), 0),
    paidCount:       records.filter((p) => p.status === "paid").length,
    pendingCount:    records.filter((p) => p.status === "pending").length,
    draftCount:      records.filter((p) => p.status === "draft").length,
  };
};

/**
 * Auto-generate payroll for a period using base salary + reports.
 * Calculates salesBonus as: totalSales × 100 KES per unit (configurable).
 */
export const generatePayrollForPeriod = async (
  month: string,
  year: string,
  salesBonusPerUnit: number = 100
): Promise<PayrollRecord[]> => {
  await delay(500);

  const monthIndex = [
    "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
  ].indexOf(month);
  if (monthIndex === -1) return [];
  const prefix = `${year}-${String(monthIndex + 1).padStart(2, "0")}-`;

  const periodReports = db.reports.filter((r) => r.dateISO.startsWith(prefix));
  const now = new Date().toISOString();
  const generated: PayrollRecord[] = [];

  for (const emp of db.employees.filter((e) => e.status === "active")) {
    // Skip if already exists
    const exists = db.payroll.find(
      (p) => p.employeeId === emp.id && p.period.month === month && p.period.year === year
    );
    if (exists) continue;

    const empReports = periodReports.filter((r) => r.employeeId === emp.id);
    const totalSales = empReports.reduce((s, r) => s + r.sales, 0);
    const daysWorked = empReports.length;

    const record: PayrollRecord = {
      id: newId("p", db.payroll),
      employeeId: emp.id,
      period: { month, year, label: `${month} ${year}` },
      baseSalary: emp.salary.base,
      bonuses: {
        salesBonus: totalSales * salesBonusPerUnit,
        performanceBonus: 0,
      },
      allowances: [
        { label: "Transport", amount: 1500 },
        { label: "Airtime",   amount: 600  },
      ],
      deductions: [
        { label: "NHIF", amount: 1700 },
        { label: "NSSF", amount: 1080 },
        { label: "PAYE", amount: Math.round(emp.salary.base * 0.1) },
      ],
      attendance: { daysWorked, totalDays: 24 },
      status: "draft",
      generatedAt: now,
      paidAt: null,
      notes: `Auto-generated. ${totalSales} units sold.`,
    };

    db.payroll.push(record);
    generated.push(record);
  }

  return generated;
};

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION G: CONVENIENCE / CROSS-ENTITY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hydrate a report with its employee's current profile.
 * Useful when ReportsScreen needs to display role/initials alongside reports.
 */
export interface HydratedReport extends Report {
  employee: Employee | null;
}

export const getHydratedReports = async (
  dateISO?: string
): Promise<HydratedReport[]> => {
  await delay();
  const base = dateISO
    ? db.reports.filter((r) => r.dateISO === dateISO)
    : [...db.reports];

  return base
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
    .map((r) => ({
      ...r,
      employee: db.employees.find((e) => e.id === r.employeeId) ?? null,
    }));
};

/**
 * Return an employee's today summary: today's report (if submitted),
 * today's check-in, and year-to-date totals.
 */
export interface EmployeeTodaySummary {
  todayReport: Report | null;
  todayCheckin: CheckIn | null;
  weekSales: number;
  weekCustomers: number;
  weekSamplers: number;
  monthSales: number;
  monthTarget: number;
}

export const getEmployeeTodaySummary = async (
  employeeId: string
): Promise<EmployeeTodaySummary> => {
  await delay();
  const iso     = todayISO();
  const weekAgo = new Date(iso);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekAgoISO = weekAgo.toISOString().split("T")[0];

  const monthPrefix = iso.slice(0, 7) + "-";

  const todayReport  = db.reports.find((r) => r.employeeId === employeeId && r.dateISO === iso) ?? null;
  const todayCheckin = db.checkins.find((c) => c.employeeId === employeeId && c.date === iso) ?? null;

  const weekReports  = db.reports.filter((r) => r.employeeId === employeeId && r.dateISO >= weekAgoISO && r.dateISO <= iso);
  const monthReports = db.reports.filter((r) => r.employeeId === employeeId && r.dateISO.startsWith(monthPrefix));

  const emp = db.employees.find((e) => e.id === employeeId);

  return {
    todayReport,
    todayCheckin,
    weekSales:     weekReports.reduce((s, r) => s + r.sales, 0),
    weekCustomers: weekReports.reduce((s, r) => s + r.customersReached, 0),
    weekSamplers:  weekReports.reduce((s, r) => s + r.samplersGiven, 0),
    monthSales:    monthReports.reduce((s, r) => s + r.sales, 0),
    monthTarget:   emp?.targets.monthly ?? 0,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION H: RIDER MODULE STUB  (extend when Rider module is built)
// ─────────────────────────────────────────────────────────────────────────────
// Rider entities will live in /riders and /deliveries collections.
// The pattern below reserves the namespace; wire real logic later.

export const getRiderById = async (_riderId: string) => {
  // TODO: implement when Rider module is ready
  return null;
};

export const getRiderDeliveries = async (_riderId: string) => {
  // TODO: implement when Rider module is ready
  return [];
};
