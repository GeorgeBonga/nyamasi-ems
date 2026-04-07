/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  NYAMASI FEMS — DATA SERVICE LAYER  (dbService.ts)
 *
 *  All reads and writes flow through here. Every screen imports ONLY from this
 *  file — never from mockDB directly.
 *
 *  Key features:
 *  • Geo-fence validation on check-in (500 m radius)
 *  • Late submission flag (after 19:00 EAT)
 *  • Payment breakdown: Cash + M-Pesa + Debt (must equal totalAmount)
 *  • Product line items (4 Hibiscus SKUs)
 *  • Photo proof required before submission
 *  • Auto-calculated totals (totalAmount, totalItems)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { db, PRODUCTS } from "./mockDB";
import type {
  User, Employee, Report, CheckIn, PayrollRecord,
  SalesBreakdown, ProductLineItem, ProductSKU,
  UserRole, EmpRole, EmpStatus, PayStatus,
} from "./mockDB";

// ─── Re-export types so screens only need one import path ─────────────────────
export type {
  User, Employee, Report, CheckIn, PayrollRecord,
  SalesBreakdown, ProductLineItem, ProductSKU,
  UserRole, EmpRole, EmpStatus, PayStatus,
};

export { PRODUCTS };

// ─── Utility helpers ──────────────────────────────────────────────────────────

const todayISO = (): string => new Date().toISOString().split("T")[0];

const delay = (ms = 0) => new Promise<void>((r) => setTimeout(r, ms));

const newId = (prefix: string, collection: { id: string }[]): string => {
  const nums = collection
    .map((x) => parseInt(x.id.replace(prefix, ""), 10))
    .filter((n) => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
};

const toInitials = (fullName: string): string =>
  fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const isoToDisplay = (iso: string): string => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const isoToShort = (iso: string): string => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const isoToDayName = (iso: string): string => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long" });
};

/**
 * Haversine distance in metres between two GPS coordinates.
 */
export const haversineDistance = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const R = 6371000; // Earth radius in metres
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * True if current wall-clock time in EAT (UTC+3) is at or past 19:00.
 */
const isLateSubmission = (): boolean => {
  const nowUTC = new Date();
  const eatHour = (nowUTC.getUTCHours() + 3) % 24;
  return eatHour >= 19;
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

export const login = async (phone: string, password: string): Promise<LoginResult> => {
  await delay(400);
  const user = db.users.find(
    (u) => u.phone === phone && u.password === password && u.active
  );
  if (!user) {
    return { success: false, user: null, employee: null, error: "Invalid credentials" };
  }
  const employee = user.employeeId
    ? (db.employees.find((e) => e.id === user.employeeId) ?? null)
    : null;
  return { success: true, user, employee };
};

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION B: EMPLOYEES
// ─────────────────────────────────────────────────────────────────────────────

export const getEmployees = async (statusFilter?: EmpStatus): Promise<Employee[]> => {
  await delay();
  const list = statusFilter
    ? db.employees.filter((e) => e.status === statusFilter)
    : [...db.employees];
  return list.sort((a, b) => a.fullName.localeCompare(b.fullName));
};

export const getEmployeeById = async (id: string): Promise<Employee | null> => {
  await delay();
  return db.employees.find((e) => e.id === id) ?? null;
};

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
  password: string;
  createdBy: string;
  assignedLocationName: string;
  assignedLocationLat: number;
  assignedLocationLng: number;
  assignedLocationRadius?: number;
}

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
    firstName:   input.firstName,
    lastName:    input.lastName,
    fullName,
    initials:    toInitials(fullName),
    role:        input.role,
    department:  input.department ?? "Field Sales",
    phone:       input.phone,
    email:       input.email,
    status:      "active",
    online:      false,
    assignedArea: input.assignedArea,
    assignedLocation: {
      name:         input.assignedLocationName,
      latitude:     input.assignedLocationLat,
      longitude:    input.assignedLocationLng,
      radiusMeters: input.assignedLocationRadius ?? 500,
    },
    lastKnownLocation: {
      latitude:  input.assignedLocationLat,
      longitude: input.assignedLocationLng,
      name:      input.assignedLocationName,
      timestamp: now,
    },
    salary:  { base: input.baseSalary, currency: "KES" },
    targets: { daily: input.dailyTarget, monthly: input.monthlyTarget },
    rating:  0,
    joinDate:    new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    joinDateISO: now.split("T")[0],
    createdAt:   now,
    createdBy:   input.createdBy,
  };

  const user: User = {
    id:         userId,
    phone:      input.phone,
    password:   input.password,
    role:       "employee",
    employeeId: empId,
    active:     true,
    createdAt:  now,
  };

  db.employees.push(employee);
  db.users.push(user);

  return { employee, user };
};

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
  if (updates.firstName)   emp.firstName   = updates.firstName;
  if (updates.lastName)    emp.lastName    = updates.lastName;
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
  if (updates.baseSalary     !== undefined) emp.salary.base       = updates.baseSalary;
  if (updates.dailyTarget    !== undefined) emp.targets.daily     = updates.dailyTarget;
  if (updates.monthlyTarget  !== undefined) emp.targets.monthly   = updates.monthlyTarget;

  db.employees[idx] = emp;
  return emp;
};

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

export const getAllReports = async (): Promise<Report[]> => {
  await delay();
  return [...db.reports].sort((a, b) => b.dateISO.localeCompare(a.dateISO));
};

export const getReportsByEmployee = async (employeeId: string): Promise<Report[]> => {
  await delay();
  return db.reports
    .filter((r) => r.employeeId === employeeId)
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO));
};

export const getReportsByDate = async (dateISO: string): Promise<Report[]> => {
  await delay();
  return db.reports.filter((r) => r.dateISO === dateISO);
};

export const getReportsByDateRange = async (
  fromISO: string,
  toISO: string
): Promise<Report[]> => {
  await delay();
  return db.reports
    .filter((r) => r.dateISO >= fromISO && r.dateISO <= toISO)
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO));
};

// ── AddReport Input ───────────────────────────────────────────────────────────

export interface ProductEntry {
  sku: ProductSKU;
  qty: number;
}

export interface AddReportInput {
  employeeId: string;
  /** Product quantities per SKU */
  products: ProductEntry[];
  /** Payment breakdown — must satisfy: cash + mpesa + debt === totalAmount */
  cash: number;
  mpesa: number;
  debt: number;
  customersReached: number;
  samplersGiven: number;
  notes: string;
  location: string;
  coords?: { latitude: number; longitude: number } | null;
  photoUri: string;   // required — URI of sales photo proof
  dateISO?: string;   // defaults to today
}

export interface AddReportResult {
  success: boolean;
  report?: Report;
  error?: string;
}

/**
 * Employee submits a daily report.
 *
 * Validation:
 *  1. Photo proof must be provided.
 *  2. At least one product must have qty > 0.
 *  3. cash + mpesa + debt must equal the computed totalAmount.
 *  4. Flags late submission (after 19:00 EAT).
 *  5. Auto-flags low-sales reports (totalItems < 5).
 */
export const addReport = async (input: AddReportInput): Promise<AddReportResult> => {
  await delay(300);

  // ── 1. Photo proof ────────────────────────────────────────────────────────
  if (!input.photoUri || input.photoUri.trim() === "") {
    return { success: false, error: "A sales photo is required before submitting." };
  }

  // ── 2. Product entries ────────────────────────────────────────────────────
  const nonZeroProducts = input.products.filter((p) => p.qty > 0);
  if (nonZeroProducts.length === 0) {
    return { success: false, error: "Enter at least one product quantity." };
  }

  // ── 3. Build line items & compute totals ──────────────────────────────────
  const items: ProductLineItem[] = nonZeroProducts.map(({ sku, qty }) => {
    const product = PRODUCTS.find((p) => p.sku === sku)!;
    return { sku, qty, unitPrice: product.unitPrice, subtotal: product.unitPrice * qty };
  });

  const totalItems  = items.reduce((s, l) => s + l.qty, 0);
  const totalAmount = items.reduce((s, l) => s + l.subtotal, 0);

  // ── 4. Payment validation ─────────────────────────────────────────────────
  const paymentTotal = input.cash + input.mpesa + input.debt;
  if (paymentTotal !== totalAmount) {
    return {
      success: false,
      error: `Payment mismatch: Cash (${input.cash}) + M-Pesa (${input.mpesa}) + Debt (${input.debt}) = ${paymentTotal} KES but total sales = ${totalAmount} KES.`,
    };
  }

  const salesBreakdown: SalesBreakdown = {
    items,
    totalItems,
    totalAmount,
    cash:  input.cash,
    mpesa: input.mpesa,
    debt:  input.debt,
  };

  // ── 5. Late submission flag ───────────────────────────────────────────────
  const lateFlag = isLateSubmission();

  // ── 6. Low-sales flag ─────────────────────────────────────────────────────
  const flagged = totalItems < 5;

  const dateISO = input.dateISO ?? todayISO();
  const now     = new Date().toISOString();
  const id      = newId("r", db.reports);

  const report: Report = {
    id,
    employeeId: input.employeeId,
    date:       isoToDisplay(dateISO),
    dateISO,
    dayName:    isoToDayName(dateISO),
    shortDate:  isoToShort(dateISO),
    salesBreakdown,
    sales:         totalItems,
    totalSalesKES: totalAmount,
    customersReached: input.customersReached,
    samplersGiven:    input.samplersGiven,
    notes:    input.notes,
    location: input.location,
    coords:   input.coords ?? null,
    photoUri: input.photoUri,
    submitted:   true,
    submittedAt: now,
    lateFlag,
    approved: false,
    flagged,
    createdAt: now,
  };

  db.reports.push(report);
  return { success: true, report };
};

export const approveReport = async (reportId: string): Promise<boolean> => {
  await delay(200);
  const idx = db.reports.findIndex((r) => r.id === reportId);
  if (idx === -1) return false;
  db.reports[idx].approved = true;
  db.reports[idx].flagged  = false;
  return true;
};

export const flagReport = async (reportId: string, flagged: boolean): Promise<boolean> => {
  await delay(100);
  const idx = db.reports.findIndex((r) => r.id === reportId);
  if (idx === -1) return false;
  db.reports[idx].flagged = flagged;
  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION D: DERIVED / COMPUTED DATA
// ─────────────────────────────────────────────────────────────────────────────

export interface EmployeeMonthlyAggregate {
  employee: Employee;
  totalSales: number;
  totalSalesKES: number;
  totalCash: number;
  totalMpesa: number;
  totalDebt: number;
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

export const getMonthlyAggregates = async (
  month: string,
  year: string
): Promise<EmployeeMonthlyAggregate[]> => {
  await delay();
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
      const totalSalesKES  = empReports.reduce((s, r) => s + r.totalSalesKES, 0);
      const totalCash      = empReports.reduce((s, r) => s + r.salesBreakdown.cash, 0);
      const totalMpesa     = empReports.reduce((s, r) => s + r.salesBreakdown.mpesa, 0);
      const totalDebt      = empReports.reduce((s, r) => s + r.salesBreakdown.debt, 0);
      const totalCustomers = empReports.reduce((s, r) => s + r.customersReached, 0);
      const totalSamplers  = empReports.reduce((s, r) => s + r.samplersGiven, 0);
      const daysReported   = empReports.length;
      const avgSalesPerDay = daysReported
        ? parseFloat((totalSales / daysReported).toFixed(1))
        : 0;
      const target    = emp.targets.monthly;
      const achievePct = Math.round((totalSales / target) * 100);

      const best = empReports.reduce(
        (b, r) => (r.sales > b.sales ? r : b),
        empReports[0]
      );

      const mid     = Math.floor(daysReported / 2);
      const sorted  = [...empReports].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
      const firstAvg = sorted.slice(0, mid).reduce((s, r) => s + r.sales, 0) / (mid || 1);
      const lastAvg  = sorted.slice(mid).reduce((s, r) => s + r.sales, 0) / (daysReported - mid || 1);
      const trend: "up" | "down" | "flat" =
        lastAvg > firstAvg * 1.05 ? "up"
        : lastAvg < firstAvg * 0.95 ? "down"
        : "flat";

      return {
        employee: emp,
        totalSales, totalSalesKES,
        totalCash, totalMpesa, totalDebt,
        totalCustomers, totalSamplers,
        daysReported, target, achievePct, avgSalesPerDay, trend,
        bestDayISO: best.dateISO,
        bestDayDisplay: best.shortDate,
      } as EmployeeMonthlyAggregate;
    })
    .filter(Boolean) as EmployeeMonthlyAggregate[];
};

export interface EmployeeYearlyAggregate {
  employee: Employee;
  year: string;

  totalSales: number;
  totalSalesKES: number;
  totalCash: number;
  totalMpesa: number;
  totalDebt: number;

  totalCustomers: number;
  totalSamplers: number;

  monthsReported: number;

  target: number;
  achievePct: number;

  avgSalesPerMonth: number;

  trend: "up" | "down" | "flat";

  bestMonth: string;
  bestMonthDisplay: string; 
}

export const getYearlyAggregates = async (
  year?: string
): Promise<EmployeeYearlyAggregate[]> => {
  await delay();

  let years: string[];

  if (year) {
    years = [year]; // single year mode
  } else {
    const currentYear = new Date().getFullYear();
    years = Array.from({ length: 5 }, (_, i) => String(currentYear - i)); // last 5 years
  }

  const results: EmployeeYearlyAggregate[] = [];

  for (const yr of years) {
    const yearReports = db.reports.filter((r) =>
      r.dateISO.startsWith(yr)
    );

    const yearlyData = db.employees
      .filter((e) => e.status === "active")
      .map((emp) => {
        const empReports = yearReports.filter(
          (r) => r.employeeId === emp.id
        );
        if (!empReports.length) return null;

        const totalSales = empReports.reduce((s, r) => s + r.sales, 0);
        const totalSalesKES = empReports.reduce(
          (s, r) => s + r.totalSalesKES,
          0
        );
        const totalCash = empReports.reduce(
          (s, r) => s + r.salesBreakdown.cash,
          0
        );
        const totalMpesa = empReports.reduce(
          (s, r) => s + r.salesBreakdown.mpesa,
          0
        );
        const totalDebt = empReports.reduce(
          (s, r) => s + r.salesBreakdown.debt,
          0
        );

        const totalCustomers = empReports.reduce(
          (s, r) => s + r.customersReached,
          0
        );
        const totalSamplers = empReports.reduce(
          (s, r) => s + r.samplersGiven,
          0
        );

        // Unique months worked
        const monthsSet = new Set(
          empReports.map((r) => r.dateISO.slice(0, 7))
        );
        const monthsReported = monthsSet.size;

        const avgSalesPerMonth = monthsReported
          ? parseFloat((totalSales / monthsReported).toFixed(1))
          : 0;

        // Yearly target
        const target = emp.targets.monthly * 12;
        const achievePct = target
          ? Math.round((totalSales / target) * 100)
          : 0;

        // Best month
        const monthMap: Record<string, number> = {};
        empReports.forEach((r) => {
          const m = r.dateISO.slice(0, 7); // YYYY-MM
          monthMap[m] = (monthMap[m] || 0) + r.sales;
        });

        const entries = Object.entries(monthMap);
        const [bestMonth] = entries.reduce((best, curr) =>
          curr[1] > best[1] ? curr : best
        );

        const bestMonthDisplay = new Date(
          bestMonth + "-01"
        ).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });

        // Trend (first half vs second half)
        const sorted = [...empReports].sort((a, b) =>
          a.dateISO.localeCompare(b.dateISO)
        );

        const mid = Math.floor(sorted.length / 2);

        const firstHalfAvg =
          sorted.slice(0, mid).reduce((s, r) => s + r.sales, 0) /
          (mid || 1);

        const secondHalfAvg =
          sorted.slice(mid).reduce((s, r) => s + r.sales, 0) /
          (sorted.length - mid || 1);

        const trend: "up" | "down" | "flat" =
          secondHalfAvg > firstHalfAvg * 1.05
            ? "up"
            : secondHalfAvg < firstHalfAvg * 0.95
            ? "down"
            : "flat";

        return {
          employee: emp,
          year: yr,

          totalSales,
          totalSalesKES,
          totalCash,
          totalMpesa,
          totalDebt,

          totalCustomers,
          totalSamplers,

          monthsReported,
          target,
          achievePct,

          avgSalesPerMonth,
          trend,

          bestMonth,
          bestMonthDisplay,
        } as EmployeeYearlyAggregate;
      })
      .filter(Boolean) as EmployeeYearlyAggregate[];

    results.push(...yearlyData);
  }

  return results;
};

export interface DashboardKpis {
  totalSales: number;
  totalSalesKES: number;
  totalCash: number;
  totalMpesa: number;
  totalDebt: number;
  totalCustomers: number;
  totalSamplers: number;
  totalEmployees: number;
  onlineEmployees: number;
  topPerformer: Employee | null;
  conversionRate: number;
  avgSalesPerEmployee: number;
}

export const getDashboardKpis = async (
  fromISO: string,
  toISO: string
): Promise<DashboardKpis> => {
  await delay();
  const rangeReports = db.reports.filter(
    (r) => r.dateISO >= fromISO && r.dateISO <= toISO && r.submitted
  );

  const totalSales     = rangeReports.reduce((s, r) => s + r.sales, 0);
  const totalSalesKES  = rangeReports.reduce((s, r) => s + r.totalSalesKES, 0);
  const totalCash      = rangeReports.reduce((s, r) => s + r.salesBreakdown.cash, 0);
  const totalMpesa     = rangeReports.reduce((s, r) => s + r.salesBreakdown.mpesa, 0);
  const totalDebt      = rangeReports.reduce((s, r) => s + r.salesBreakdown.debt, 0);
  const totalCustomers = rangeReports.reduce((s, r) => s + r.customersReached, 0);
  const totalSamplers  = rangeReports.reduce((s, r) => s + r.samplersGiven, 0);

  const byEmployee: Record<string, number> = {};
  rangeReports.forEach((r) => {
    byEmployee[r.employeeId] = (byEmployee[r.employeeId] ?? 0) + r.sales;
  });
  const topEmpId = Object.entries(byEmployee).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const topPerformer = topEmpId
    ? (db.employees.find((e) => e.id === topEmpId) ?? null)
    : null;

  const activeEmployees   = db.employees.filter((e) => e.status === "active");
  const onlineEmployees   = activeEmployees.filter((e) => e.online).length;
  const participatingCount = Object.keys(byEmployee).length || 1;

  return {
    totalSales, totalSalesKES,
    totalCash, totalMpesa, totalDebt,
    totalCustomers, totalSamplers,
    totalEmployees:      activeEmployees.length,
    onlineEmployees,
    topPerformer,
    conversionRate:      totalSamplers > 0
      ? Math.round((totalSales / totalSamplers) * 100)
      : 0,
    avgSalesPerEmployee: Math.round(totalSales / participatingCount),
  };
};

export interface ChartDataset {
  labels: string[];
  sales: number[];
  customers: number[];
  samplers: number[];
}

export const getChartData = async (
    mode: "daily" | "weekly" | "monthly" | "custom",
  referenceISO: string,
   from?: string,
  to?: string
): Promise<ChartDataset> => {
  await delay();
  const anchor = new Date(referenceISO + "T00:00:00");

  if (mode === "custom" && from && to) {
  const start = new Date(from + "T00:00:00");
  const end = new Date(to + "T00:00:00");

  const days: string[] = [];

  const current = new Date(start);
  while (current <= end) {
    days.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  const labels = days.map((iso) =>
    new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short" })
  );

  const sales = days.map((iso) =>
    db.reports
      .filter((r) => r.dateISO === iso)
      .reduce((s, r) => s + r.sales, 0)
  );

  const customers = days.map((iso) =>
    db.reports
      .filter((r) => r.dateISO === iso)
      .reduce((s, r) => s + r.customersReached, 0)
  );

  const samplers = days.map((iso) =>
    db.reports
      .filter((r) => r.dateISO === iso)
      .reduce((s, r) => s + r.samplersGiven, 0)
  );

  return { labels, sales, customers, samplers };
}

  if (mode === "daily") {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(anchor);
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    });
    const dayLabels = days.map((iso) =>
      new Date(iso + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })
    );
    const sales     = days.map((iso) =>
      db.reports.filter((r) => r.dateISO === iso).reduce((s, r) => s + r.sales, 0)
    );
    const customers = days.map((iso) =>
      db.reports.filter((r) => r.dateISO === iso).reduce((s, r) => s + r.customersReached, 0)
    );
    const samplers = days.map((iso) =>
      db.reports.filter((r) => r.dateISO === iso).reduce((s, r) => s + r.samplersGiven, 0)
    );
    return { labels: dayLabels, sales, customers, samplers };
  }

  if (mode === "weekly") {
    const weeks: string[][] = Array.from({ length: 4 }, (_, wi) =>
      Array.from({ length: 7 }, (_, di) => {
        const d = new Date(anchor);
        d.setDate(d.getDate() - ((3 - wi) * 7 + (6 - di)));
        return d.toISOString().split("T")[0];
      })
    );
    const labels    = weeks.map((_, i) => `Wk ${i + 1}`);
    const sales     = weeks.map((wk) =>
      wk.reduce(
        (s, iso) =>
          s + db.reports.filter((r) => r.dateISO === iso).reduce((a, r) => a + r.sales, 0),
        0
      )
    );
    const customers = weeks.map((wk) =>
      wk.reduce(
        (s, iso) =>
          s + db.reports.filter((r) => r.dateISO === iso).reduce((a, r) => a + r.customersReached, 0),
        0
      )
    );
    const samplers = weeks.map((wk) =>
      wk.reduce(
        (s, iso) =>
          s + db.reports.filter((r) => r.dateISO === iso).reduce((a, r) => a + r.samplersGiven, 0),
        0
      )
    );
    return { labels, sales, customers, samplers };
  }

  // monthly
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(anchor);
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return {
      label:  d.toLocaleDateString("en-US", { month: "short" }),
      prefix: d.toISOString().slice(0, 7) + "-",
    };
  });
  const labels    = months.map((m) => m.label);
  const sales     = months.map(({ prefix }) =>
    db.reports.filter((r) => r.dateISO.startsWith(prefix)).reduce((s, r) => s + r.sales, 0)
  );
  const customers = months.map(({ prefix }) =>
    db.reports.filter((r) => r.dateISO.startsWith(prefix)).reduce((s, r) => s + r.customersReached, 0)
  );
  const samplers = months.map(({ prefix }) =>
    db.reports.filter((r) => r.dateISO.startsWith(prefix)).reduce((s, r) => s + r.samplersGiven, 0)
  );
  return { labels, sales, customers, samplers };
};

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION E: CHECK-INS
// ─────────────────────────────────────────────────────────────────────────────

export const getCheckinsByDate = async (dateISO: string): Promise<CheckIn[]> => {
  await delay();
  return db.checkins.filter((c) => c.date === dateISO);
};

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

export interface CheckInResult {
  success: boolean;
  checkin?: CheckIn;
  error?: string;
  distanceMeters?: number;
}

/**
 * Record a new check-in.
 *
 * Validation:
 *  • Employee must exist.
 *  • Employee's GPS must be within 50 m of their assigned location.
 *  • Prevents duplicate check-ins on the same day.
 */
export const recordCheckIn = async (input: CheckInInput): Promise<CheckInResult> => {
  await delay(300);

  const emp = db.employees.find((e) => e.id === input.employeeId);
  if (!emp) return { success: false, error: "Employee not found." };

  // ── Geo-fence check ───────────────────────────────────────────────────────
  const dist = haversineDistance(
    input.latitude, input.longitude,
    emp.assignedLocation.latitude, emp.assignedLocation.longitude
  );
  const withinRadius = dist <= emp.assignedLocation.radiusMeters;
  if (!withinRadius) {
    return {
      success: false,
      distanceMeters: Math.round(dist),
      error: `You are ${Math.round(dist)} m away from ${emp.assignedLocation.name}. You must be within ${emp.assignedLocation.radiusMeters} m to check in.`,
    };
  }

  // ── Duplicate check ───────────────────────────────────────────────────────
  const today = todayISO();
  const existingCheckin = db.checkins.find(
    (c) => c.employeeId === input.employeeId && c.date === today && c.status === "checked-in"
  );
  if (existingCheckin) {
    return { success: false, error: "You are already checked in for today." };
  }

  const now    = new Date().toISOString();
  const id     = newId("c", db.checkins);

  const checkin: CheckIn = {
    id,
    employeeId:   input.employeeId,
    coords: {
      latitude:  input.latitude,
      longitude: input.longitude,
      accuracy:  input.accuracy,
    },
    locationName: input.locationName,
    checkInTime:  now,
    checkOutTime: null,
    status:       "checked-in",
    date:         today,
    withinRadius: true,
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

  return { success: true, checkin };
};

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

export const getPayrollByPeriod = async (
  month: string,
  year: string
): Promise<PayrollRecord[]> => {
  await delay();
  return db.payroll.filter(
    (p) => p.period.month === month && p.period.year === year
  );
};

export const getPayrollByEmployee = async (
  employeeId: string
): Promise<PayrollRecord[]> => {
  await delay();
  return db.payroll
    .filter((p) => p.employeeId === employeeId)
    .sort((a, b) =>
      `${b.period.year}-${b.period.month}`.localeCompare(
        `${a.period.year}-${a.period.month}`
      )
    );
};

export const calcGross = (p: PayrollRecord): number =>
  p.baseSalary +
  p.bonuses.salesBonus +
  p.bonuses.performanceBonus +
  p.allowances.reduce((s, a) => s + a.amount, 0);

export const calcTotalDeductions = (p: PayrollRecord): number =>
  p.deductions.reduce((s, d) => s + d.amount, 0);

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

export const updatePayrollRecord = async (
  id: string,
  updates: PayrollUpdateInput
): Promise<PayrollRecord | null> => {
  await delay(200);
  const idx = db.payroll.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  const record = { ...db.payroll[idx] };
  if (updates.salesBonus       !== undefined) record.bonuses.salesBonus      = updates.salesBonus;
  if (updates.performanceBonus !== undefined) record.bonuses.performanceBonus = updates.performanceBonus;
  if (updates.allowances)  record.allowances = updates.allowances;
  if (updates.deductions)  record.deductions  = updates.deductions;
  if (updates.daysWorked   !== undefined) record.attendance.daysWorked = updates.daysWorked;
  if (updates.notes        !== undefined) record.notes = updates.notes;

  db.payroll[idx] = record;
  return record;
};

export const markPayrollPaid = async (id: string): Promise<PayrollRecord | null> => {
  await delay(200);
  const idx = db.payroll.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  db.payroll[idx].status = "paid";
  db.payroll[idx].paidAt = new Date().toISOString();
  return db.payroll[idx];
};

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

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION G: EMPLOYEE TODAY SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

export interface EmployeeTodaySummary {
  todayReport: Report | null;
  todayCheckin: CheckIn | null;
  weekSales: number;
  weekSalesKES: number;
  weekCustomers: number;
  weekSamplers: number;
  monthSales: number;
  monthSalesKES: number;
  monthTarget: number;
}

export const getEmployeeTodaySummary = async (
  employeeId: string
): Promise<EmployeeTodaySummary> => {
  await delay();
  const iso     = todayISO();
  const weekAgo = new Date(iso);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekAgoISO    = weekAgo.toISOString().split("T")[0];
  const monthPrefix   = iso.slice(0, 7) + "-";

  const todayReport  = db.reports.find((r) => r.employeeId === employeeId && r.dateISO === iso) ?? null;
  const todayCheckin = db.checkins.find((c) => c.employeeId === employeeId && c.date === iso) ?? null;

  const weekReports  = db.reports.filter(
    (r) => r.employeeId === employeeId && r.dateISO >= weekAgoISO && r.dateISO <= iso
  );
  const monthReports = db.reports.filter(
    (r) => r.employeeId === employeeId && r.dateISO.startsWith(monthPrefix)
  );

  const emp = db.employees.find((e) => e.id === employeeId);

  return {
    todayReport,
    todayCheckin,
    weekSales:     weekReports.reduce((s, r) => s + r.sales, 0),
    weekSalesKES:  weekReports.reduce((s, r) => s + r.totalSalesKES, 0),
    weekCustomers: weekReports.reduce((s, r) => s + r.customersReached, 0),
    weekSamplers:  weekReports.reduce((s, r) => s + r.samplersGiven, 0),
    monthSales:    monthReports.reduce((s, r) => s + r.sales, 0),
    monthSalesKES: monthReports.reduce((s, r) => s + r.totalSalesKES, 0),
    monthTarget:   emp?.targets.monthly ?? 0,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION H: HYDRATED REPORTS
// ─────────────────────────────────────────────────────────────────────────────

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