/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  NYAMASI FEMS — CENTRAL MOCK DATABASE  (mockDB.ts)
 *  Single Source of Truth — mimics Firestore document collections.
 *  Replace this file wholesale with a real Firebase / REST client later.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ─── 1. PRIMITIVE TYPES ───────────────────────────────────────────────────────

export type UserRole      = "admin" | "employee" | "rider";
export type EmpRole       = "Field Rep" | "Senior Rep" | "Team Lead" | "Supervisor";
export type EmpStatus     = "active" | "inactive";
export type OnlineStatus  = boolean;
export type PayStatus     = "paid" | "pending" | "draft";
export type CheckInStatus = "checked-in" | "checked-out" | "pending";
export type TrendDir      = "up" | "down" | "flat";

// ─── 2. COLLECTION INTERFACES ─────────────────────────────────────────────────

/** /users — authentication + role mapping */
export interface User {
  id: string;                  // same as Firestore document id
  phone: string;               // login credential
  password: string;            // plain text for mock; hash in production
  role: UserRole;
  employeeId: string | null;   // null for admin-only accounts
  active: boolean;
  createdAt: string;           // ISO 8601
}

/** /employees — master profile */
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;            // computed once on creation, stored for display
  initials: string;            // e.g. "JM"
  role: EmpRole;
  department: string;          // e.g. "Field Sales"
  phone: string;
  email: string;
  status: EmpStatus;
  online: OnlineStatus;
  assignedArea: string;        // primary territory name
  lastKnownLocation: {
    latitude: number;
    longitude: number;
    name: string;
    timestamp: string;         // ISO 8601
  };
  salary: {
    base: number;
    currency: "KES";
  };
  targets: {
    daily: number;             // daily sales units target
    monthly: number;           // monthly sales units target
  };
  rating: number;              // 1–5 float
  joinDate: string;            // "Jan 2025" display format
  joinDateISO: string;         // ISO for sorting
  createdAt: string;
  createdBy: string;           // userId of admin who created
}

/** /reports — one document per employee per day */
export interface Report {
  id: string;
  employeeId: string;
  date: string;                // display: "Apr 12, 2026"
  dateISO: string;             // "2026-04-12" — use for filtering/sorting
  dayName: string;             // "Sunday"
  shortDate: string;           // "Apr 12"
  sales: number;
  customersReached: number;
  samplersGiven: number;
  notes: string;
  location: string;            // area name at time of report
  coords: {
    latitude: number;
    longitude: number;
  } | null;
  submitted: boolean;
  approved: boolean;
  flagged: boolean;            // auto-flagged if sales < threshold
  createdAt: string;          // ISO 8601
}

/** /checkins — one per check-in event */
export interface CheckIn {
  id: string;
  employeeId: string;
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  locationName: string;
  checkInTime: string;         // ISO 8601
  checkOutTime: string | null; // null until employee checks out
  status: CheckInStatus;
  date: string;                // "2026-04-12" — for daily grouping
}

/** Allowance / Deduction line item */
export interface PayLineItem {
  label: string;
  amount: number;
}

/** /payroll — one per employee per pay period */
export interface PayrollRecord {
  id: string;
  employeeId: string;
  period: {
    month: string;             // "Apr"
    year: string;              // "2026"
    label: string;             // "Apr 2026"
  };
  baseSalary: number;
  bonuses: {
    salesBonus: number;
    performanceBonus: number;
  };
  allowances: PayLineItem[];
  deductions: PayLineItem[];
  attendance: {
    daysWorked: number;
    totalDays: number;         // working days in the period
  };
  status: PayStatus;
  generatedAt: string;        // ISO 8601
  paidAt: string | null;      // ISO 8601 or null
  notes: string;
}

// ─── 3. DATABASE SHAPE ────────────────────────────────────────────────────────

export interface MockDatabase {
  users: User[];
  employees: Employee[];
  reports: Report[];
  checkins: CheckIn[];
  payroll: PayrollRecord[];
}

// ─── 4. SEED DATA ─────────────────────────────────────────────────────────────
//  Employee IDs: e001–e009
//  User IDs:     u001–u010  (u001 = admin)
//  All cross-references use these IDs consistently.

const users: User[] = [
  // ── Admin account ──────────────────────────────────────────────────────────
  {
    id: "u001",
    phone: "1",           // kept simple for demo login
    password: "1",
    role: "admin",
    employeeId: null,
    active: true,
    createdAt: "2023-01-01T08:00:00.000Z",
  },

  // ── Employee accounts ──────────────────────────────────────────────────────
  {
    id: "u002",
    phone: "2",
    password: "2",
    role: "employee",
    employeeId: "e001",
    active: true,
    createdAt: "2025-01-10T08:00:00.000Z",
  },
  {
    id: "u003",
    phone: "0712345678",
    password: "jane2025",
    role: "employee",
    employeeId: "e002",
    active: true,
    createdAt: "2025-01-15T08:00:00.000Z",
  },
  {
    id: "u004",
    phone: "0723456789",
    password: "brian2025",
    role: "employee",
    employeeId: "e003",
    active: true,
    createdAt: "2025-03-05T08:00:00.000Z",
  },
  {
    id: "u005",
    phone: "0734567890",
    password: "amina2024",
    role: "employee",
    employeeId: "e004",
    active: true,
    createdAt: "2024-06-01T08:00:00.000Z",
  },
  {
    id: "u006",
    phone: "0745678901",
    password: "peter2025",
    role: "employee",
    employeeId: "e005",
    active: true,
    createdAt: "2025-02-10T08:00:00.000Z",
  },
  {
    id: "u007",
    phone: "0756789012",
    password: "lydia2023",
    role: "employee",
    employeeId: "e006",
    active: true,
    createdAt: "2023-09-01T08:00:00.000Z",
  },
  {
    id: "u008",
    phone: "0767890123",
    password: "david2025",
    role: "employee",
    employeeId: "e007",
    active: false,            // inactive user → inactive employee
    createdAt: "2025-04-01T08:00:00.000Z",
  },
  {
    id: "u009",
    phone: "0778901234",
    password: "grace2024",
    role: "employee",
    employeeId: "e008",
    active: true,
    createdAt: "2024-11-01T08:00:00.000Z",
  },
  {
    id: "u010",
    phone: "0789012345",
    password: "samuel2024",
    role: "employee",
    employeeId: "e009",
    active: true,
    createdAt: "2024-07-10T08:00:00.000Z",
  },
  {
    id: "u011",
    phone: "0790123456",
    password: "faith2023",
    role: "employee",
    employeeId: "e010",
    active: true,
    createdAt: "2023-03-01T08:00:00.000Z",
  },

  // ── Rider accounts (placeholder — extend when Rider module is built) ────────
  {
    id: "u012",
    phone: "3",
    password: "3",
    role: "rider",
    employeeId: null,
    active: true,
    createdAt: "2025-06-01T08:00:00.000Z",
  },
];

// ── e001: the "demo employee" linked to phone "2" ─────────────────────────────
const employees: Employee[] = [
  {
    id: "e001",
    firstName: "Demo",
    lastName: "Employee",
    fullName: "Demo Employee",
    initials: "DE",
    role: "Field Rep",
    department: "Field Sales",
    phone: "2",
    email: "demo.employee@nyamasi.co.ke",
    status: "active",
    online: true,
    assignedArea: "Nairobi Central",
    lastKnownLocation: {
      latitude: -1.2921,
      longitude: 36.8219,
      name: "Nairobi CBD",
      timestamp: "2026-04-12T09:00:00.000Z",
    },
    salary: { base: 28000, currency: "KES" },
    targets: { daily: 20, monthly: 150 },
    rating: 4.2,
    joinDate: "Jan 2025",
    joinDateISO: "2025-01-10",
    createdAt: "2025-01-10T08:00:00.000Z",
    createdBy: "u001",
  },
  {
    id: "e002",
    firstName: "Jane",
    lastName: "Mwangi",
    fullName: "Jane Mwangi",
    initials: "JM",
    role: "Field Rep",
    department: "Field Sales",
    phone: "0712345678",
    email: "jane.mwangi@nyamasi.co.ke",
    status: "active",
    online: true,
    assignedArea: "Westlands",
    lastKnownLocation: {
      latitude: -1.2670,
      longitude: 36.8031,
      name: "Westlands",
      timestamp: "2026-04-12T09:30:00.000Z",
    },
    salary: { base: 28000, currency: "KES" },
    targets: { daily: 22, monthly: 150 },
    rating: 4.8,
    joinDate: "Jan 2025",
    joinDateISO: "2025-01-15",
    createdAt: "2025-01-15T08:00:00.000Z",
    createdBy: "u001",
  },
  {
    id: "e003",
    firstName: "Brian",
    lastName: "Ochieng",
    fullName: "Brian Ochieng",
    initials: "BO",
    role: "Field Rep",
    department: "Field Sales",
    phone: "0723456789",
    email: "brian.ochieng@nyamasi.co.ke",
    status: "active",
    online: true,
    assignedArea: "CBD",
    lastKnownLocation: {
      latitude: -1.2864,
      longitude: 36.8172,
      name: "Nairobi CBD",
      timestamp: "2026-04-12T09:15:00.000Z",
    },
    salary: { base: 26000, currency: "KES" },
    targets: { daily: 18, monthly: 120 },
    rating: 4.2,
    joinDate: "Mar 2025",
    joinDateISO: "2025-03-05",
    createdAt: "2025-03-05T08:00:00.000Z",
    createdBy: "u001",
  },
  {
    id: "e004",
    firstName: "Amina",
    lastName: "Hassan",
    fullName: "Amina Hassan",
    initials: "AH",
    role: "Senior Rep",
    department: "Field Sales",
    phone: "0734567890",
    email: "amina.hassan@nyamasi.co.ke",
    status: "active",
    online: true,
    assignedArea: "Kilimani",
    lastKnownLocation: {
      latitude: -1.2866,
      longitude: 36.7876,
      name: "Kilimani",
      timestamp: "2026-04-12T10:00:00.000Z",
    },
    salary: { base: 38000, currency: "KES" },
    targets: { daily: 28, monthly: 200 },
    rating: 4.9,
    joinDate: "Jun 2024",
    joinDateISO: "2024-06-01",
    createdAt: "2024-06-01T08:00:00.000Z",
    createdBy: "u001",
  },
  {
    id: "e005",
    firstName: "Peter",
    lastName: "Karanja",
    fullName: "Peter Karanja",
    initials: "PK",
    role: "Field Rep",
    department: "Field Sales",
    phone: "0745678901",
    email: "peter.karanja@nyamasi.co.ke",
    status: "active",
    online: false,
    assignedArea: "Kasarani",
    lastKnownLocation: {
      latitude: -1.2172,
      longitude: 36.8896,
      name: "Kasarani",
      timestamp: "2026-04-11T17:00:00.000Z",
    },
    salary: { base: 24000, currency: "KES" },
    targets: { daily: 15, monthly: 100 },
    rating: 3.9,
    joinDate: "Feb 2025",
    joinDateISO: "2025-02-10",
    createdAt: "2025-02-10T08:00:00.000Z",
    createdBy: "u001",
  },
  {
    id: "e006",
    firstName: "Lydia",
    lastName: "Wanjiku",
    fullName: "Lydia Wanjiku",
    initials: "LW",
    role: "Team Lead",
    department: "Field Sales",
    phone: "0756789012",
    email: "lydia.wanjiku@nyamasi.co.ke",
    status: "active",
    online: true,
    assignedArea: "Upperhill",
    lastKnownLocation: {
      latitude: -1.2955,
      longitude: 36.8130,
      name: "Upperhill",
      timestamp: "2026-04-12T10:30:00.000Z",
    },
    salary: { base: 52000, currency: "KES" },
    targets: { daily: 40, monthly: 280 },
    rating: 5.0,
    joinDate: "Sep 2023",
    joinDateISO: "2023-09-01",
    createdAt: "2023-09-01T08:00:00.000Z",
    createdBy: "u001",
  },
  {
    id: "e007",
    firstName: "David",
    lastName: "Mutua",
    fullName: "David Mutua",
    initials: "DM",
    role: "Field Rep",
    department: "Field Sales",
    phone: "0767890123",
    email: "david.mutua@nyamasi.co.ke",
    status: "inactive",
    online: false,
    assignedArea: "Embakasi",
    lastKnownLocation: {
      latitude: -1.3197,
      longitude: 36.8860,
      name: "Embakasi",
      timestamp: "2026-04-10T16:00:00.000Z",
    },
    salary: { base: 22000, currency: "KES" },
    targets: { daily: 12, monthly: 80 },
    rating: 3.4,
    joinDate: "Apr 2025",
    joinDateISO: "2025-04-01",
    createdAt: "2025-04-01T08:00:00.000Z",
    createdBy: "u001",
  },
  {
    id: "e008",
    firstName: "Grace",
    lastName: "Akinyi",
    fullName: "Grace Akinyi",
    initials: "GA",
    role: "Field Rep",
    department: "Field Sales",
    phone: "0778901234",
    email: "grace.akinyi@nyamasi.co.ke",
    status: "active",
    online: true,
    assignedArea: "Ngong Road",
    lastKnownLocation: {
      latitude: -1.3012,
      longitude: 36.7834,
      name: "Ngong Rd",
      timestamp: "2026-04-12T09:45:00.000Z",
    },
    salary: { base: 29000, currency: "KES" },
    targets: { daily: 23, monthly: 160 },
    rating: 4.5,
    joinDate: "Nov 2024",
    joinDateISO: "2024-11-01",
    createdAt: "2024-11-01T08:00:00.000Z",
    createdBy: "u001",
  },
  {
    id: "e009",
    firstName: "Samuel",
    lastName: "Ndungu",
    fullName: "Samuel Ndung'u",
    initials: "SN",
    role: "Senior Rep",
    department: "Field Sales",
    phone: "0789012345",
    email: "samuel.ndungu@nyamasi.co.ke",
    status: "active",
    online: false,
    assignedArea: "Ruiru",
    lastKnownLocation: {
      latitude: -1.1465,
      longitude: 36.9618,
      name: "Ruiru",
      timestamp: "2026-04-12T08:00:00.000Z",
    },
    salary: { base: 36000, currency: "KES" },
    targets: { daily: 26, monthly: 180 },
    rating: 4.3,
    joinDate: "Jul 2024",
    joinDateISO: "2024-07-10",
    createdAt: "2024-07-10T08:00:00.000Z",
    createdBy: "u001",
  },
  {
    id: "e010",
    firstName: "Faith",
    lastName: "Adhiambo",
    fullName: "Faith Adhiambo",
    initials: "FA",
    role: "Supervisor",
    department: "Field Sales",
    phone: "0790123456",
    email: "faith.adhiambo@nyamasi.co.ke",
    status: "active",
    online: true,
    assignedArea: "Gigiri",
    lastKnownLocation: {
      latitude: -1.2275,
      longitude: 36.7987,
      name: "Gigiri",
      timestamp: "2026-04-12T11:00:00.000Z",
    },
    salary: { base: 58000, currency: "KES" },
    targets: { daily: 37, monthly: 260 },
    rating: 4.7,
    joinDate: "Mar 2023",
    joinDateISO: "2023-03-01",
    createdAt: "2023-03-01T08:00:00.000Z",
    createdBy: "u001",
  },
];

// ─── REPORTS ──────────────────────────────────────────────────────────────────
// 14 days × up to 10 employees = rich dataset for all screens
const reports: Report[] = [
  // ── Apr 12, 2026 (Sun) ────────────────────────────────────────────────────
  {
    id: "r001", employeeId: "e006", date: "Apr 12, 2026", dateISO: "2026-04-12",
    dayName: "Sunday", shortDate: "Apr 12",
    sales: 22, customersReached: 138, samplersGiven: 72,
    notes: "Strong day at Upperhill. Key decision makers met.",
    location: "Upperhill", coords: { latitude: -1.2955, longitude: 36.8130 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-12T18:00:00.000Z",
  },
  {
    id: "r002", employeeId: "e004", date: "Apr 12, 2026", dateISO: "2026-04-12",
    dayName: "Sunday", shortDate: "Apr 12",
    sales: 18, customersReached: 112, samplersGiven: 58,
    notes: "Kilimani area performing well this quarter.",
    location: "Kilimani", coords: { latitude: -1.2866, longitude: 36.7876 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-12T17:45:00.000Z",
  },
  {
    id: "r003", employeeId: "e008", date: "Apr 12, 2026", dateISO: "2026-04-12",
    dayName: "Sunday", shortDate: "Apr 12",
    sales: 14, customersReached: 89, samplersGiven: 45,
    notes: "Slow start but improved in the afternoon.",
    location: "Ngong Road", coords: { latitude: -1.3012, longitude: 36.7834 },
    submitted: true, approved: false, flagged: false,
    createdAt: "2026-04-12T17:30:00.000Z",
  },
  {
    id: "r004", employeeId: "e003", date: "Apr 12, 2026", dateISO: "2026-04-12",
    dayName: "Sunday", shortDate: "Apr 12",
    sales: 20, customersReached: 121, samplersGiven: 63,
    notes: "Good penetration around CBD market.",
    location: "CBD", coords: { latitude: -1.2864, longitude: 36.8172 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-12T17:00:00.000Z",
  },
  {
    id: "r005", employeeId: "e009", date: "Apr 12, 2026", dateISO: "2026-04-12",
    dayName: "Sunday", shortDate: "Apr 12",
    sales: 16, customersReached: 98, samplersGiven: 51,
    notes: "",
    location: "Ruiru", coords: { latitude: -1.1465, longitude: 36.9618 },
    submitted: true, approved: false, flagged: false,
    createdAt: "2026-04-12T18:10:00.000Z",
  },
  {
    id: "r006", employeeId: "e002", date: "Apr 12, 2026", dateISO: "2026-04-12",
    dayName: "Sunday", shortDate: "Apr 12",
    sales: 12, customersReached: 78, samplersGiven: 40,
    notes: "",
    location: "Westlands", coords: { latitude: -1.2670, longitude: 36.8031 },
    submitted: true, approved: false, flagged: false,
    createdAt: "2026-04-12T17:50:00.000Z",
  },
  {
    id: "r007", employeeId: "e005", date: "Apr 12, 2026", dateISO: "2026-04-12",
    dayName: "Sunday", shortDate: "Apr 12",
    sales: 8, customersReached: 51, samplersGiven: 28,
    notes: "Difficult day. Customer resistance high.",
    location: "Kasarani", coords: { latitude: -1.2172, longitude: 36.8896 },
    submitted: true, approved: false, flagged: true,
    createdAt: "2026-04-12T18:20:00.000Z",
  },
  {
    id: "r008", employeeId: "e007", date: "Apr 12, 2026", dateISO: "2026-04-12",
    dayName: "Sunday", shortDate: "Apr 12",
    sales: 5, customersReached: 33, samplersGiven: 18,
    notes: "Late start.",
    location: "Embakasi", coords: { latitude: -1.3197, longitude: 36.8860 },
    submitted: true, approved: false, flagged: true,
    createdAt: "2026-04-12T19:00:00.000Z",
  },
  {
    id: "r009", employeeId: "e001", date: "Apr 12, 2026", dateISO: "2026-04-12",
    dayName: "Sunday", shortDate: "Apr 12",
    sales: 15, customersReached: 92, samplersGiven: 47,
    notes: "Good day overall in Nairobi Central.",
    location: "Nairobi Central", coords: { latitude: -1.2921, longitude: 36.8219 },
    submitted: true, approved: false, flagged: false,
    createdAt: "2026-04-12T18:05:00.000Z",
  },

  // ── Apr 11, 2026 (Sat) ────────────────────────────────────────────────────
  {
    id: "r010", employeeId: "e006", date: "Apr 11, 2026", dateISO: "2026-04-11",
    dayName: "Saturday", shortDate: "Apr 11",
    sales: 28, customersReached: 165, samplersGiven: 88,
    notes: "Excellent performance. Closed major account.",
    location: "Upperhill", coords: { latitude: -1.2955, longitude: 36.8130 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-11T18:00:00.000Z",
  },
  {
    id: "r011", employeeId: "e004", date: "Apr 11, 2026", dateISO: "2026-04-11",
    dayName: "Saturday", shortDate: "Apr 11",
    sales: 21, customersReached: 130, samplersGiven: 67,
    notes: "Good coverage of Kilimani and surroundings.",
    location: "Kilimani", coords: { latitude: -1.2866, longitude: 36.7876 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-11T17:45:00.000Z",
  },
  {
    id: "r012", employeeId: "e010", date: "Apr 11, 2026", dateISO: "2026-04-11",
    dayName: "Saturday", shortDate: "Apr 11",
    sales: 30, customersReached: 180, samplersGiven: 95,
    notes: "Team briefing completed. Targets reviewed.",
    location: "Gigiri", coords: { latitude: -1.2275, longitude: 36.7987 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-11T18:30:00.000Z",
  },
  {
    id: "r013", employeeId: "e008", date: "Apr 11, 2026", dateISO: "2026-04-11",
    dayName: "Saturday", shortDate: "Apr 11",
    sales: 17, customersReached: 105, samplersGiven: 54,
    notes: "",
    location: "Ngong Road", coords: { latitude: -1.3012, longitude: 36.7834 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-11T17:30:00.000Z",
  },
  {
    id: "r014", employeeId: "e002", date: "Apr 11, 2026", dateISO: "2026-04-11",
    dayName: "Saturday", shortDate: "Apr 11",
    sales: 19, customersReached: 118, samplersGiven: 62,
    notes: "Weekend shoppers high in Westlands.",
    location: "Westlands", coords: { latitude: -1.2670, longitude: 36.8031 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-11T17:00:00.000Z",
  },
  {
    id: "r015", employeeId: "e003", date: "Apr 11, 2026", dateISO: "2026-04-11",
    dayName: "Saturday", shortDate: "Apr 11",
    sales: 23, customersReached: 140, samplersGiven: 74,
    notes: "Market day advantage at CBD.",
    location: "CBD", coords: { latitude: -1.2864, longitude: 36.8172 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-11T18:00:00.000Z",
  },
  {
    id: "r016", employeeId: "e001", date: "Apr 11, 2026", dateISO: "2026-04-11",
    dayName: "Saturday", shortDate: "Apr 11",
    sales: 18, customersReached: 109, samplersGiven: 56,
    notes: "Covered eastern sector of the zone.",
    location: "Nairobi Central", coords: { latitude: -1.2921, longitude: 36.8219 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-11T17:55:00.000Z",
  },

  // ── Apr 10, 2026 (Fri) ────────────────────────────────────────────────────
  {
    id: "r017", employeeId: "e009", date: "Apr 10, 2026", dateISO: "2026-04-10",
    dayName: "Friday", shortDate: "Apr 10",
    sales: 19, customersReached: 118, samplersGiven: 61,
    notes: "",
    location: "Ruiru", coords: { latitude: -1.1465, longitude: 36.9618 },
    submitted: false, approved: false, flagged: false,
    createdAt: "2026-04-10T18:00:00.000Z",
  },
  {
    id: "r018", employeeId: "e002", date: "Apr 10, 2026", dateISO: "2026-04-10",
    dayName: "Friday", shortDate: "Apr 10",
    sales: 15, customersReached: 93, samplersGiven: 48,
    notes: "",
    location: "Westlands", coords: { latitude: -1.2670, longitude: 36.8031 },
    submitted: false, approved: false, flagged: false,
    createdAt: "2026-04-10T18:30:00.000Z",
  },
  {
    id: "r019", employeeId: "e006", date: "Apr 10, 2026", dateISO: "2026-04-10",
    dayName: "Friday", shortDate: "Apr 10",
    sales: 32, customersReached: 192, samplersGiven: 100,
    notes: "Record day! Major corporate clients visited.",
    location: "Upperhill", coords: { latitude: -1.2955, longitude: 36.8130 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-10T17:00:00.000Z",
  },
  {
    id: "r020", employeeId: "e004", date: "Apr 10, 2026", dateISO: "2026-04-10",
    dayName: "Friday", shortDate: "Apr 10",
    sales: 25, customersReached: 150, samplersGiven: 78,
    notes: "Quarter-end push showing results.",
    location: "Kilimani", coords: { latitude: -1.2866, longitude: 36.7876 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-10T18:00:00.000Z",
  },
  {
    id: "r021", employeeId: "e010", date: "Apr 10, 2026", dateISO: "2026-04-10",
    dayName: "Friday", shortDate: "Apr 10",
    sales: 27, customersReached: 162, samplersGiven: 85,
    notes: "New partnerships formed at Gigiri hub.",
    location: "Gigiri", coords: { latitude: -1.2275, longitude: 36.7987 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-10T17:30:00.000Z",
  },
  {
    id: "r022", employeeId: "e001", date: "Apr 10, 2026", dateISO: "2026-04-10",
    dayName: "Friday", shortDate: "Apr 10",
    sales: 21, customersReached: 128, samplersGiven: 66,
    notes: "Friday high traffic in the zone.",
    location: "Nairobi Central", coords: { latitude: -1.2921, longitude: 36.8219 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-10T17:45:00.000Z",
  },

  // ── Apr 9, 2026 (Thu) ─────────────────────────────────────────────────────
  {
    id: "r023", employeeId: "e006", date: "Apr 9, 2026", dateISO: "2026-04-09",
    dayName: "Thursday", shortDate: "Apr 9",
    sales: 30, customersReached: 180, samplersGiven: 95,
    notes: "Excellent corporate outreach.",
    location: "Upperhill", coords: { latitude: -1.2955, longitude: 36.8130 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-09T18:00:00.000Z",
  },
  {
    id: "r024", employeeId: "e004", date: "Apr 9, 2026", dateISO: "2026-04-09",
    dayName: "Thursday", shortDate: "Apr 9",
    sales: 20, customersReached: 125, samplersGiven: 64,
    notes: "Mid-week push working well.",
    location: "Kilimani", coords: { latitude: -1.2866, longitude: 36.7876 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-09T17:30:00.000Z",
  },
  {
    id: "r025", employeeId: "e008", date: "Apr 9, 2026", dateISO: "2026-04-09",
    dayName: "Thursday", shortDate: "Apr 9",
    sales: 18, customersReached: 108, samplersGiven: 56,
    notes: "Best day this week for Ngong Road.",
    location: "Ngong Road", coords: { latitude: -1.3012, longitude: 36.7834 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-09T18:10:00.000Z",
  },
  {
    id: "r026", employeeId: "e003", date: "Apr 9, 2026", dateISO: "2026-04-09",
    dayName: "Thursday", shortDate: "Apr 9",
    sales: 22, customersReached: 135, samplersGiven: 70,
    notes: "CBD penetration improving.",
    location: "CBD", coords: { latitude: -1.2864, longitude: 36.8172 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-09T17:00:00.000Z",
  },
  {
    id: "r027", employeeId: "e001", date: "Apr 9, 2026", dateISO: "2026-04-09",
    dayName: "Thursday", shortDate: "Apr 9",
    sales: 17, customersReached: 103, samplersGiven: 54,
    notes: "Routine coverage. All targets on track.",
    location: "Nairobi Central", coords: { latitude: -1.2921, longitude: 36.8219 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-09T18:00:00.000Z",
  },

  // ── Apr 8, 2026 (Wed) ─────────────────────────────────────────────────────
  {
    id: "r028", employeeId: "e006", date: "Apr 8, 2026", dateISO: "2026-04-08",
    dayName: "Wednesday", shortDate: "Apr 8",
    sales: 35, customersReached: 210, samplersGiven: 110,
    notes: "Best Wednesday this month. New market unlocked.",
    location: "Upperhill", coords: { latitude: -1.2955, longitude: 36.8130 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-08T18:00:00.000Z",
  },
  {
    id: "r029", employeeId: "e004", date: "Apr 8, 2026", dateISO: "2026-04-08",
    dayName: "Wednesday", shortDate: "Apr 8",
    sales: 26, customersReached: 158, samplersGiven: 82,
    notes: "Sampler programme resonating well.",
    location: "Kilimani", coords: { latitude: -1.2866, longitude: 36.7876 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-08T17:45:00.000Z",
  },
  {
    id: "r030", employeeId: "e010", date: "Apr 8, 2026", dateISO: "2026-04-08",
    dayName: "Wednesday", shortDate: "Apr 8",
    sales: 33, customersReached: 200, samplersGiven: 105,
    notes: "Supervisory review complete. Team on track.",
    location: "Gigiri", coords: { latitude: -1.2275, longitude: 36.7987 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-08T18:20:00.000Z",
  },
  {
    id: "r031", employeeId: "e001", date: "Apr 8, 2026", dateISO: "2026-04-08",
    dayName: "Wednesday", shortDate: "Apr 8",
    sales: 19, customersReached: 116, samplersGiven: 60,
    notes: "",
    location: "Nairobi Central", coords: { latitude: -1.2921, longitude: 36.8219 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-08T17:50:00.000Z",
  },

  // ── Apr 7, 2026 (Tue) ─────────────────────────────────────────────────────
  {
    id: "r032", employeeId: "e006", date: "Apr 7, 2026", dateISO: "2026-04-07",
    dayName: "Tuesday", shortDate: "Apr 7",
    sales: 24, customersReached: 148, samplersGiven: 77,
    notes: "Consistent performance.",
    location: "Upperhill", coords: { latitude: -1.2955, longitude: 36.8130 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-07T18:00:00.000Z",
  },
  {
    id: "r033", employeeId: "e002", date: "Apr 7, 2026", dateISO: "2026-04-07",
    dayName: "Tuesday", shortDate: "Apr 7",
    sales: 14, customersReached: 86, samplersGiven: 44,
    notes: "",
    location: "Westlands", coords: { latitude: -1.2670, longitude: 36.8031 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-07T18:10:00.000Z",
  },
  {
    id: "r034", employeeId: "e003", date: "Apr 7, 2026", dateISO: "2026-04-07",
    dayName: "Tuesday", shortDate: "Apr 7",
    sales: 20, customersReached: 124, samplersGiven: 65,
    notes: "Good traction with retail outlets.",
    location: "CBD", coords: { latitude: -1.2864, longitude: 36.8172 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-07T17:00:00.000Z",
  },
  {
    id: "r035", employeeId: "e001", date: "Apr 7, 2026", dateISO: "2026-04-07",
    dayName: "Tuesday", shortDate: "Apr 7",
    sales: 16, customersReached: 98, samplersGiven: 51,
    notes: "Steady week so far.",
    location: "Nairobi Central", coords: { latitude: -1.2921, longitude: 36.8219 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-07T18:00:00.000Z",
  },

  // ── Apr 6, 2026 (Mon) ─────────────────────────────────────────────────────
  {
    id: "r036", employeeId: "e006", date: "Apr 6, 2026", dateISO: "2026-04-06",
    dayName: "Monday", shortDate: "Apr 6",
    sales: 38, customersReached: 228, samplersGiven: 120,
    notes: "Week kick-off. Team motivated and on target.",
    location: "Upperhill", coords: { latitude: -1.2955, longitude: 36.8130 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-06T18:00:00.000Z",
  },
  {
    id: "r037", employeeId: "e004", date: "Apr 6, 2026", dateISO: "2026-04-06",
    dayName: "Monday", shortDate: "Apr 6",
    sales: 28, customersReached: 170, samplersGiven: 88,
    notes: "New product launch reception positive.",
    location: "Kilimani", coords: { latitude: -1.2866, longitude: 36.7876 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-06T17:30:00.000Z",
  },
  {
    id: "r038", employeeId: "e010", date: "Apr 6, 2026", dateISO: "2026-04-06",
    dayName: "Monday", shortDate: "Apr 6",
    sales: 36, customersReached: 218, samplersGiven: 115,
    notes: "Supervisory round completed. Strong start to week.",
    location: "Gigiri", coords: { latitude: -1.2275, longitude: 36.7987 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-06T18:10:00.000Z",
  },
  {
    id: "r039", employeeId: "e001", date: "Apr 6, 2026", dateISO: "2026-04-06",
    dayName: "Monday", shortDate: "Apr 6",
    sales: 14, customersReached: 85, samplersGiven: 44,
    notes: "Started week strong.",
    location: "Nairobi Central", coords: { latitude: -1.2921, longitude: 36.8219 },
    submitted: true, approved: true, flagged: false,
    createdAt: "2026-04-06T18:00:00.000Z",
  },
];

// ─── CHECK-INS ────────────────────────────────────────────────────────────────
const checkins: CheckIn[] = [
  {
    id: "c001", employeeId: "e001",
    coords: { latitude: -1.2921, longitude: 36.8219, accuracy: 12 },
    locationName: "Nairobi CBD", checkInTime: "2026-04-12T07:55:00.000Z",
    checkOutTime: "2026-04-12T17:10:00.000Z", status: "checked-out", date: "2026-04-12",
  },
  {
    id: "c002", employeeId: "e002",
    coords: { latitude: -1.2670, longitude: 36.8031, accuracy: 15 },
    locationName: "Westlands", checkInTime: "2026-04-12T08:02:00.000Z",
    checkOutTime: null, status: "checked-in", date: "2026-04-12",
  },
  {
    id: "c003", employeeId: "e003",
    coords: { latitude: -1.2864, longitude: 36.8172, accuracy: 10 },
    locationName: "Nairobi CBD", checkInTime: "2026-04-12T07:48:00.000Z",
    checkOutTime: null, status: "checked-in", date: "2026-04-12",
  },
  {
    id: "c004", employeeId: "e004",
    coords: { latitude: -1.2866, longitude: 36.7876, accuracy: 18 },
    locationName: "Kilimani", checkInTime: "2026-04-12T08:15:00.000Z",
    checkOutTime: null, status: "checked-in", date: "2026-04-12",
  },
  {
    id: "c005", employeeId: "e006",
    coords: { latitude: -1.2955, longitude: 36.8130, accuracy: 8 },
    locationName: "Upperhill", checkInTime: "2026-04-12T07:30:00.000Z",
    checkOutTime: null, status: "checked-in", date: "2026-04-12",
  },
  {
    id: "c006", employeeId: "e008",
    coords: { latitude: -1.3012, longitude: 36.7834, accuracy: 14 },
    locationName: "Ngong Rd", checkInTime: "2026-04-12T08:05:00.000Z",
    checkOutTime: null, status: "checked-in", date: "2026-04-12",
  },
  {
    id: "c007", employeeId: "e010",
    coords: { latitude: -1.2275, longitude: 36.7987, accuracy: 11 },
    locationName: "Gigiri", checkInTime: "2026-04-12T07:45:00.000Z",
    checkOutTime: null, status: "checked-in", date: "2026-04-12",
  },
  // Yesterday
  {
    id: "c008", employeeId: "e001",
    coords: { latitude: -1.2921, longitude: 36.8219, accuracy: 12 },
    locationName: "Nairobi CBD", checkInTime: "2026-04-11T07:58:00.000Z",
    checkOutTime: "2026-04-11T17:05:00.000Z", status: "checked-out", date: "2026-04-11",
  },
  {
    id: "c009", employeeId: "e006",
    coords: { latitude: -1.2955, longitude: 36.8130, accuracy: 8 },
    locationName: "Upperhill", checkInTime: "2026-04-11T07:30:00.000Z",
    checkOutTime: "2026-04-11T17:30:00.000Z", status: "checked-out", date: "2026-04-11",
  },
  {
    id: "c010", employeeId: "e004",
    coords: { latitude: -1.2866, longitude: 36.7876, accuracy: 16 },
    locationName: "Kilimani", checkInTime: "2026-04-11T08:10:00.000Z",
    checkOutTime: "2026-04-11T17:00:00.000Z", status: "checked-out", date: "2026-04-11",
  },
];

// ─── PAYROLL ──────────────────────────────────────────────────────────────────
// April 2026 payroll — all employees
const payroll: PayrollRecord[] = [
  // ── e006 Lydia Wanjiku — Team Lead ─────────────────────────────────────────
  {
    id: "p001", employeeId: "e006",
    period: { month: "Apr", year: "2026", label: "Apr 2026" },
    baseSalary: 52000,
    bonuses: { salesBonus: 6200, performanceBonus: 2000 },
    allowances: [
      { label: "Transport", amount: 3000 },
      { label: "Airtime",   amount: 1000 },
    ],
    deductions: [
      { label: "NHIF", amount: 1700 },
      { label: "NSSF", amount: 1080 },
      { label: "PAYE", amount: 8200 },
    ],
    attendance: { daysWorked: 22, totalDays: 24 },
    status: "paid",
    generatedAt: "2026-04-30T08:00:00.000Z",
    paidAt: "2026-04-30T10:00:00.000Z",
    notes: "Top performer bonus applied.",
  },
  // ── e010 Faith Adhiambo — Supervisor ───────────────────────────────────────
  {
    id: "p002", employeeId: "e010",
    period: { month: "Apr", year: "2026", label: "Apr 2026" },
    baseSalary: 58000,
    bonuses: { salesBonus: 5800, performanceBonus: 3000 },
    allowances: [
      { label: "Transport",    amount: 4000 },
      { label: "Airtime",      amount: 1500 },
      { label: "Team Allowance", amount: 2000 },
    ],
    deductions: [
      { label: "NHIF", amount: 1700 },
      { label: "NSSF", amount: 1080 },
      { label: "PAYE", amount: 11500 },
    ],
    attendance: { daysWorked: 23, totalDays: 24 },
    status: "paid",
    generatedAt: "2026-04-30T08:00:00.000Z",
    paidAt: "2026-04-30T10:00:00.000Z",
    notes: "",
  },
  // ── e004 Amina Hassan — Senior Rep ─────────────────────────────────────────
  {
    id: "p003", employeeId: "e004",
    period: { month: "Apr", year: "2026", label: "Apr 2026" },
    baseSalary: 38000,
    bonuses: { salesBonus: 4600, performanceBonus: 1500 },
    allowances: [
      { label: "Transport", amount: 2500 },
      { label: "Airtime",   amount: 1000 },
    ],
    deductions: [
      { label: "NHIF", amount: 1700 },
      { label: "NSSF", amount: 1080 },
      { label: "PAYE", amount: 6200 },
    ],
    attendance: { daysWorked: 20, totalDays: 24 },
    status: "paid",
    generatedAt: "2026-04-30T08:00:00.000Z",
    paidAt: "2026-04-30T10:00:00.000Z",
    notes: "",
  },
  // ── e009 Samuel Ndung'u — Senior Rep ───────────────────────────────────────
  {
    id: "p004", employeeId: "e009",
    period: { month: "Apr", year: "2026", label: "Apr 2026" },
    baseSalary: 36000,
    bonuses: { salesBonus: 3760, performanceBonus: 0 },
    allowances: [
      { label: "Transport", amount: 2000 },
      { label: "Airtime",   amount: 800  },
    ],
    deductions: [
      { label: "NHIF",    amount: 1700 },
      { label: "NSSF",    amount: 1080 },
      { label: "PAYE",    amount: 5400 },
      { label: "Advance", amount: 5000 },
    ],
    attendance: { daysWorked: 19, totalDays: 24 },
    status: "pending",
    generatedAt: "2026-04-30T08:00:00.000Z",
    paidAt: null,
    notes: "Advance deducted this cycle.",
  },
  // ── e008 Grace Akinyi — Field Rep ──────────────────────────────────────────
  {
    id: "p005", employeeId: "e008",
    period: { month: "Apr", year: "2026", label: "Apr 2026" },
    baseSalary: 29000,
    bonuses: { salesBonus: 3280, performanceBonus: 500 },
    allowances: [
      { label: "Transport", amount: 1500 },
      { label: "Airtime",   amount: 600  },
    ],
    deductions: [
      { label: "NHIF", amount: 1700 },
      { label: "NSSF", amount: 1080 },
      { label: "PAYE", amount: 3600 },
    ],
    attendance: { daysWorked: 21, totalDays: 24 },
    status: "pending",
    generatedAt: "2026-04-30T08:00:00.000Z",
    paidAt: null,
    notes: "",
  },
  // ── e003 Brian Ochieng — Field Rep ─────────────────────────────────────────
  {
    id: "p006", employeeId: "e003",
    period: { month: "Apr", year: "2026", label: "Apr 2026" },
    baseSalary: 26000,
    bonuses: { salesBonus: 2360, performanceBonus: 0 },
    allowances: [
      { label: "Transport", amount: 1500 },
      { label: "Airtime",   amount: 600  },
    ],
    deductions: [
      { label: "NHIF", amount: 1700 },
      { label: "NSSF", amount: 1080 },
      { label: "PAYE", amount: 2900 },
    ],
    attendance: { daysWorked: 18, totalDays: 24 },
    status: "pending",
    generatedAt: "2026-04-30T08:00:00.000Z",
    paidAt: null,
    notes: "",
  },
  // ── e002 Jane Mwangi — Field Rep ───────────────────────────────────────────
  {
    id: "p007", employeeId: "e002",
    period: { month: "Apr", year: "2026", label: "Apr 2026" },
    baseSalary: 28000,
    bonuses: { salesBonus: 2840, performanceBonus: 0 },
    allowances: [
      { label: "Transport", amount: 1500 },
      { label: "Airtime",   amount: 600  },
    ],
    deductions: [
      { label: "NHIF", amount: 1700 },
      { label: "NSSF", amount: 1080 },
      { label: "PAYE", amount: 3300 },
    ],
    attendance: { daysWorked: 22, totalDays: 24 },
    status: "pending",
    generatedAt: "2026-04-30T08:00:00.000Z",
    paidAt: null,
    notes: "",
  },
  // ── e005 Peter Karanja — Field Rep ─────────────────────────────────────────
  {
    id: "p008", employeeId: "e005",
    period: { month: "Apr", year: "2026", label: "Apr 2026" },
    baseSalary: 24000,
    bonuses: { salesBonus: 1920, performanceBonus: 0 },
    allowances: [
      { label: "Transport", amount: 1500 },
      { label: "Airtime",   amount: 600  },
    ],
    deductions: [
      { label: "NHIF", amount: 1700 },
      { label: "NSSF", amount: 1080 },
      { label: "PAYE", amount: 2200 },
    ],
    attendance: { daysWorked: 20, totalDays: 24 },
    status: "draft",
    generatedAt: "2026-04-30T08:00:00.000Z",
    paidAt: null,
    notes: "Low performance. Under review.",
  },
  // ── e007 David Mutua — Field Rep (inactive) ────────────────────────────────
  {
    id: "p009", employeeId: "e007",
    period: { month: "Apr", year: "2026", label: "Apr 2026" },
    baseSalary: 22000,
    bonuses: { salesBonus: 1240, performanceBonus: 0 },
    allowances: [
      { label: "Transport", amount: 1000 },
      { label: "Airtime",   amount: 500  },
    ],
    deductions: [
      { label: "NHIF",      amount: 1700 },
      { label: "NSSF",      amount: 1080 },
      { label: "PAYE",      amount: 1800 },
      { label: "Absence",   amount: 2750 }, // 5 days unpaid
    ],
    attendance: { daysWorked: 14, totalDays: 24 },
    status: "draft",
    generatedAt: "2026-04-30T08:00:00.000Z",
    paidAt: null,
    notes: "Inactive employee — payroll on hold.",
  },
  // ── e001 Demo Employee ─────────────────────────────────────────────────────
  {
    id: "p010", employeeId: "e001",
    period: { month: "Apr", year: "2026", label: "Apr 2026" },
    baseSalary: 28000,
    bonuses: { salesBonus: 3000, performanceBonus: 500 },
    allowances: [
      { label: "Transport", amount: 1500 },
      { label: "Airtime",   amount: 600  },
    ],
    deductions: [
      { label: "NHIF", amount: 1700 },
      { label: "NSSF", amount: 1080 },
      { label: "PAYE", amount: 3300 },
    ],
    attendance: { daysWorked: 22, totalDays: 24 },
    status: "pending",
    generatedAt: "2026-04-30T08:00:00.000Z",
    paidAt: null,
    notes: "",
  },

  // ── March 2026 — historical records ────────────────────────────────────────
  {
    id: "p011", employeeId: "e006",
    period: { month: "Mar", year: "2026", label: "Mar 2026" },
    baseSalary: 52000,
    bonuses: { salesBonus: 5800, performanceBonus: 2000 },
    allowances: [
      { label: "Transport", amount: 3000 },
      { label: "Airtime",   amount: 1000 },
    ],
    deductions: [
      { label: "NHIF", amount: 1700 },
      { label: "NSSF", amount: 1080 },
      { label: "PAYE", amount: 8200 },
    ],
    attendance: { daysWorked: 21, totalDays: 23 },
    status: "paid",
    generatedAt: "2026-03-31T08:00:00.000Z",
    paidAt: "2026-03-31T10:00:00.000Z",
    notes: "",
  },
  {
    id: "p012", employeeId: "e004",
    period: { month: "Mar", year: "2026", label: "Mar 2026" },
    baseSalary: 38000,
    bonuses: { salesBonus: 4200, performanceBonus: 1000 },
    allowances: [
      { label: "Transport", amount: 2500 },
      { label: "Airtime",   amount: 1000 },
    ],
    deductions: [
      { label: "NHIF", amount: 1700 },
      { label: "NSSF", amount: 1080 },
      { label: "PAYE", amount: 6000 },
    ],
    attendance: { daysWorked: 22, totalDays: 23 },
    status: "paid",
    generatedAt: "2026-03-31T08:00:00.000Z",
    paidAt: "2026-03-31T10:00:00.000Z",
    notes: "",
  },
];

// ─── 5. THE DATABASE EXPORT ───────────────────────────────────────────────────

/**
 * The in-memory store.
 * dbService.ts imports and mutates this object.
 * Replace with Firebase SDK calls later — the service layer API stays identical.
 */
export const db: MockDatabase = {
  users,
  employees,
  reports,
  checkins,
  payroll,
};

export default db;
