/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  NYAMASI FEMS — CENTRAL MOCK DATABASE (mockDB.ts)
 *  Single Source of Truth — mimics Firestore document collections.
 *  DATA RANGE: December 1, 2025 — April 3, 2026 ONLY
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

export interface User {
  id: string;
  phone: string;
  password: string;
  role: UserRole;
  employeeId: string | null;
  active: boolean;
  createdAt: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
  role: EmpRole;
  department: string;
  phone: string;
  email: string;
  status: EmpStatus;
  online: OnlineStatus;
  assignedArea: string;
  lastKnownLocation: {
    latitude: number;
    longitude: number;
    name: string;
    timestamp: string;
  };
  salary: {
    base: number;
    currency: "KES";
  };
  targets: {
    daily: number;
    monthly: number;
  };
  rating: number;
  joinDate: string;
  joinDateISO: string;
  createdAt: string;
  createdBy: string;
}

export interface Report {
  id: string;
  employeeId: string;
  date: string;
  dateISO: string;
  dayName: string;
  shortDate: string;
  sales: number;
  customersReached: number;
  samplersGiven: number;
  notes: string;
  location: string;
  coords: {
    latitude: number;
    longitude: number;
  } | null;
  submitted: boolean;
  approved: boolean;
  flagged: boolean;
  createdAt: string;
}

export interface CheckIn {
  id: string;
  employeeId: string;
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  locationName: string;
  checkInTime: string;
  checkOutTime: string | null;
  status: CheckInStatus;
  date: string;
}

export interface PayLineItem {
  label: string;
  amount: number;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  period: {
    month: string;
    year: string;
    label: string;
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
    totalDays: number;
  };
  status: PayStatus;
  generatedAt: string;
  paidAt: string | null;
  notes: string;
}

export interface MockDatabase {
  users: User[];
  employees: Employee[];
  reports: Report[];
  checkins: CheckIn[];
  payroll: PayrollRecord[];
}

// ─── 3. USERS (unchanged) ─────────────────────────────────────────────────────

const users: User[] = [
  { id: "u001", phone: "1", password: "1", role: "admin", employeeId: null, active: true, createdAt: "2023-01-01T08:00:00.000Z" },
  { id: "u002", phone: "0793874880", password: "bonga2025", role: "employee", employeeId: "e001", active: true, createdAt: "2025-01-10T08:00:00.000Z" },
  { id: "u003", phone: "0712345678", password: "jane2025", role: "employee", employeeId: "e002", active: true, createdAt: "2025-01-15T08:00:00.000Z" },
  { id: "u004", phone: "0723456789", password: "brian2025", role: "employee", employeeId: "e003", active: true, createdAt: "2025-03-05T08:00:00.000Z" },
  { id: "u005", phone: "0734567890", password: "amina2024", role: "employee", employeeId: "e004", active: true, createdAt: "2024-06-01T08:00:00.000Z" },
  { id: "u006", phone: "0745678901", password: "peter2025", role: "employee", employeeId: "e005", active: true, createdAt: "2025-02-10T08:00:00.000Z" },
  { id: "u007", phone: "0756789012", password: "lydia2023", role: "employee", employeeId: "e006", active: true, createdAt: "2023-09-01T08:00:00.000Z" },
  { id: "u008", phone: "0767890123", password: "david2025", role: "employee", employeeId: "e007", active: false, createdAt: "2025-04-01T08:00:00.000Z" },
  { id: "u009", phone: "0778901234", password: "grace2024", role: "employee", employeeId: "e008", active: true, createdAt: "2024-11-01T08:00:00.000Z" },
  { id: "u010", phone: "0789012345", password: "samuel2024", role: "employee", employeeId: "e009", active: true, createdAt: "2024-07-10T08:00:00.000Z" },
  { id: "u011", phone: "0790123456", password: "faith2023", role: "employee", employeeId: "e010", active: true, createdAt: "2023-03-01T08:00:00.000Z" },
  { id: "u012", phone: "3", password: "3", role: "rider", employeeId: null, active: true, createdAt: "2025-06-01T08:00:00.000Z" },
];

// ─── 4. EMPLOYEES (unchanged) ─────────────────────────────────────────────────

const employees: Employee[] = [
  { id: "e001", firstName: "George", lastName: "Bonga", fullName: "George Bonga", initials: "GB", role: "Field Rep", department: "Field Sales", phone: "2", email: "bonga.employee@nyamasi.co.ke", status: "active", online: true, assignedArea: "Nairobi Central", lastKnownLocation: { latitude: -1.2921, longitude: 36.8219, name: "Nairobi CBD", timestamp: "2026-04-03T09:00:00.000Z" }, salary: { base: 28000, currency: "KES" }, targets: { daily: 20, monthly: 150 }, rating: 4.2, joinDate: "Jan 2025", joinDateISO: "2025-01-10", createdAt: "2025-01-10T08:00:00.000Z", createdBy: "u001" },
  { id: "e002", firstName: "Jane", lastName: "Mwangi", fullName: "Jane Mwangi", initials: "JM", role: "Field Rep", department: "Field Sales", phone: "0712345678", email: "jane.mwangi@nyamasi.co.ke", status: "active", online: true, assignedArea: "Westlands", lastKnownLocation: { latitude: -1.2670, longitude: 36.8031, name: "Westlands", timestamp: "2026-04-03T09:30:00.000Z" }, salary: { base: 28000, currency: "KES" }, targets: { daily: 22, monthly: 150 }, rating: 4.8, joinDate: "Jan 2025", joinDateISO: "2025-01-15", createdAt: "2025-01-15T08:00:00.000Z", createdBy: "u001" },
  { id: "e003", firstName: "Brian", lastName: "Ochieng", fullName: "Brian Ochieng", initials: "BO", role: "Field Rep", department: "Field Sales", phone: "0723456789", email: "brian.ochieng@nyamasi.co.ke", status: "active", online: true, assignedArea: "CBD", lastKnownLocation: { latitude: -1.2864, longitude: 36.8172, name: "Nairobi CBD", timestamp: "2026-04-03T09:15:00.000Z" }, salary: { base: 26000, currency: "KES" }, targets: { daily: 18, monthly: 120 }, rating: 4.2, joinDate: "Mar 2025", joinDateISO: "2025-03-05", createdAt: "2025-03-05T08:00:00.000Z", createdBy: "u001" },
  { id: "e004", firstName: "Amina", lastName: "Hassan", fullName: "Amina Hassan", initials: "AH", role: "Senior Rep", department: "Field Sales", phone: "0734567890", email: "amina.hassan@nyamasi.co.ke", status: "active", online: true, assignedArea: "Kilimani", lastKnownLocation: { latitude: -1.2866, longitude: 36.7876, name: "Kilimani", timestamp: "2026-04-03T10:00:00.000Z" }, salary: { base: 38000, currency: "KES" }, targets: { daily: 28, monthly: 200 }, rating: 4.9, joinDate: "Jun 2024", joinDateISO: "2024-06-01", createdAt: "2024-06-01T08:00:00.000Z", createdBy: "u001" },
  { id: "e005", firstName: "Peter", lastName: "Karanja", fullName: "Peter Karanja", initials: "PK", role: "Field Rep", department: "Field Sales", phone: "0745678901", email: "peter.karanja@nyamasi.co.ke", status: "active", online: false, assignedArea: "Kasarani", lastKnownLocation: { latitude: -1.2172, longitude: 36.8896, name: "Kasarani", timestamp: "2026-04-02T17:00:00.000Z" }, salary: { base: 24000, currency: "KES" }, targets: { daily: 15, monthly: 100 }, rating: 3.9, joinDate: "Feb 2025", joinDateISO: "2025-02-10", createdAt: "2025-02-10T08:00:00.000Z", createdBy: "u001" },
  { id: "e006", firstName: "Lydia", lastName: "Wanjiku", fullName: "Lydia Wanjiku", initials: "LW", role: "Team Lead", department: "Field Sales", phone: "0756789012", email: "lydia.wanjiku@nyamasi.co.ke", status: "active", online: true, assignedArea: "Upperhill", lastKnownLocation: { latitude: -1.2955, longitude: 36.8130, name: "Upperhill", timestamp: "2026-04-03T10:30:00.000Z" }, salary: { base: 52000, currency: "KES" }, targets: { daily: 40, monthly: 280 }, rating: 5.0, joinDate: "Sep 2023", joinDateISO: "2023-09-01", createdAt: "2023-09-01T08:00:00.000Z", createdBy: "u001" },
  { id: "e007", firstName: "David", lastName: "Mutua", fullName: "David Mutua", initials: "DM", role: "Field Rep", department: "Field Sales", phone: "0767890123", email: "david.mutua@nyamasi.co.ke", status: "inactive", online: false, assignedArea: "Embakasi", lastKnownLocation: { latitude: -1.3197, longitude: 36.8860, name: "Embakasi", timestamp: "2026-04-01T16:00:00.000Z" }, salary: { base: 22000, currency: "KES" }, targets: { daily: 12, monthly: 80 }, rating: 3.4, joinDate: "Apr 2025", joinDateISO: "2025-04-01", createdAt: "2025-04-01T08:00:00.000Z", createdBy: "u001" },
  { id: "e008", firstName: "Grace", lastName: "Akinyi", fullName: "Grace Akinyi", initials: "GA", role: "Field Rep", department: "Field Sales", phone: "0778901234", email: "grace.akinyi@nyamasi.co.ke", status: "active", online: true, assignedArea: "Ngong Road", lastKnownLocation: { latitude: -1.3012, longitude: 36.7834, name: "Ngong Rd", timestamp: "2026-04-03T09:45:00.000Z" }, salary: { base: 29000, currency: "KES" }, targets: { daily: 23, monthly: 160 }, rating: 4.5, joinDate: "Nov 2024", joinDateISO: "2024-11-01", createdAt: "2024-11-01T08:00:00.000Z", createdBy: "u001" },
  { id: "e009", firstName: "Samuel", lastName: "Ndungu", fullName: "Samuel Ndung'u", initials: "SN", role: "Senior Rep", department: "Field Sales", phone: "0789012345", email: "samuel.ndungu@nyamasi.co.ke", status: "active", online: false, assignedArea: "Ruiru", lastKnownLocation: { latitude: -1.1465, longitude: 36.9618, name: "Ruiru", timestamp: "2026-04-03T08:00:00.000Z" }, salary: { base: 36000, currency: "KES" }, targets: { daily: 26, monthly: 180 }, rating: 4.3, joinDate: "Jul 2024", joinDateISO: "2024-07-10", createdAt: "2024-07-10T08:00:00.000Z", createdBy: "u001" },
  { id: "e010", firstName: "Faith", lastName: "Adhiambo", fullName: "Faith Adhiambo", initials: "FA", role: "Supervisor", department: "Field Sales", phone: "0790123456", email: "faith.adhiambo@nyamasi.co.ke", status: "active", online: true, assignedArea: "Gigiri", lastKnownLocation: { latitude: -1.2275, longitude: 36.7987, name: "Gigiri", timestamp: "2026-04-03T11:00:00.000Z" }, salary: { base: 58000, currency: "KES" }, targets: { daily: 37, monthly: 260 }, rating: 4.7, joinDate: "Mar 2023", joinDateISO: "2023-03-01", createdAt: "2023-03-01T08:00:00.000Z", createdBy: "u001" },
];

// ─── 5. REPORTS — December 2025 to April 3, 2026 ONLY ─────────────────────────

const reports: Report[] = [
  // December 2025
  { id: "r001", employeeId: "e006", date: "Dec 1, 2025", dateISO: "2025-12-01", dayName: "Monday", shortDate: "Dec 1", sales: 34, customersReached: 204, samplersGiven: 102, notes: "Strong start to December.", location: "Upperhill", coords: { latitude: -1.2955, longitude: 36.8130 }, submitted: true, approved: true, flagged: false, createdAt: "2025-12-01T17:30:00.000Z" },
  { id: "r002", employeeId: "e004", date: "Dec 1, 2025", dateISO: "2025-12-01", dayName: "Monday", shortDate: "Dec 1", sales: 24, customersReached: 144, samplersGiven: 72, notes: "", location: "Kilimani", coords: { latitude: -1.2866, longitude: 36.7876 }, submitted: true, approved: true, flagged: false, createdAt: "2025-12-01T17:45:00.000Z" },
  { id: "r003", employeeId: "e010", date: "Dec 2, 2025", dateISO: "2025-12-02", dayName: "Tuesday", shortDate: "Dec 2", sales: 31, customersReached: 186, samplersGiven: 93, notes: "Year-end planning session.", location: "Gigiri", coords: { latitude: -1.2275, longitude: 36.7987 }, submitted: true, approved: true, flagged: false, createdAt: "2025-12-02T18:00:00.000Z" },
  { id: "r004", employeeId: "e001", date: "Dec 3, 2025", dateISO: "2025-12-03", dayName: "Wednesday", shortDate: "Dec 3", sales: 16, customersReached: 96, samplersGiven: 48, notes: "", location: "Nairobi Central", coords: { latitude: -1.2921, longitude: 36.8219 }, submitted: true, approved: true, flagged: false, createdAt: "2025-12-03T17:15:00.000Z" },
  { id: "r005", employeeId: "e002", date: "Dec 4, 2025", dateISO: "2025-12-04", dayName: "Thursday", shortDate: "Dec 4", sales: 19, customersReached: 114, samplersGiven: 57, notes: "Holiday shopping boost.", location: "Westlands", coords: { latitude: -1.2670, longitude: 36.8031 }, submitted: true, approved: true, flagged: false, createdAt: "2025-12-04T17:30:00.000Z" },
  { id: "r006", employeeId: "e003", date: "Dec 5, 2025", dateISO: "2025-12-05", dayName: "Friday", shortDate: "Dec 5", sales: 21, customersReached: 126, samplersGiven: 63, notes: "", location: "CBD", coords: { latitude: -1.2864, longitude: 36.8172 }, submitted: true, approved: true, flagged: false, createdAt: "2025-12-05T17:45:00.000Z" },
  { id: "r007", employeeId: "e008", date: "Dec 6, 2025", dateISO: "2025-12-06", dayName: "Saturday", shortDate: "Dec 6", sales: 15, customersReached: 90, samplersGiven: 45, notes: "Weekend market activity.", location: "Ngong Road", coords: { latitude: -1.3012, longitude: 36.7834 }, submitted: true, approved: false, flagged: false, createdAt: "2025-12-06T18:00:00.000Z" },
  { id: "r008", employeeId: "e009", date: "Dec 8, 2025", dateISO: "2025-12-08", dayName: "Monday", shortDate: "Dec 8", sales: 22, customersReached: 132, samplersGiven: 66, notes: "", location: "Ruiru", coords: { latitude: -1.1465, longitude: 36.9618 }, submitted: true, approved: true, flagged: false, createdAt: "2025-12-08T17:30:00.000Z" },
  { id: "r009", employeeId: "e006", date: "Dec 10, 2025", dateISO: "2025-12-10", dayName: "Wednesday", shortDate: "Dec 10", sales: 38, customersReached: 228, samplersGiven: 114, notes: "Excellent pre-holiday performance.", location: "Upperhill", coords: { latitude: -1.2955, longitude: 36.8130 }, submitted: true, approved: true, flagged: false, createdAt: "2025-12-10T18:15:00.000Z" },
  { id: "r010", employeeId: "e004", date: "Dec 12, 2025", dateISO: "2025-12-12", dayName: "Friday", shortDate: "Dec 12", sales: 27, customersReached: 162, samplersGiven: 81, notes: "Year-end promotions successful.", location: "Kilimani", coords: { latitude: -1.2866, longitude: 36.7876 }, submitted: true, approved: true, flagged: false, createdAt: "2025-12-12T17:30:00.000Z" },
  { id: "r011", employeeId: "e001", date: "Dec 15, 2025", dateISO: "2025-12-15", dayName: "Monday", shortDate: "Dec 15", sales: 18, customersReached: 108, samplersGiven: 54, notes: "", location: "Nairobi Central", coords: { latitude: -1.2921, longitude: 36.8219 }, submitted: true, approved: true, flagged: false, createdAt: "2025-12-15T17:00:00.000Z" },
  { id: "r012", employeeId: "e010", date: "Dec 18, 2025", dateISO: "2025-12-18", dayName: "Thursday", shortDate: "Dec 18", sales: 33, customersReached: 198, samplersGiven: 99, notes: "Team review completed.", location: "Gigiri", coords: { latitude: -1.2275, longitude: 36.7987 }, submitted: true, approved: true, flagged: false, createdAt: "2025-12-18T18:00:00.000Z" },
  { id: "r013", employeeId: "e002", date: "Dec 20, 2025", dateISO: "2025-12-20", dayName: "Saturday", shortDate: "Dec 20", sales: 20, customersReached: 120, samplersGiven: 60, notes: "", location: "Westlands", coords: { latitude: -1.2670, longitude: 36.8031 }, submitted: true, approved: true, flagged: false, createdAt: "2025-12-20T17:45:00.000Z" },
  { id: "r014", employeeId: "e006", date: "Dec 22, 2025", dateISO: "2025-12-22", dayName: "Monday", shortDate: "Dec 22", sales: 41, customersReached: 246, samplersGiven: 123, notes: "Record day before Christmas!", location: "Upperhill", coords: { latitude: -1.2955, longitude: 36.8130 }, submitted: true, approved: true, flagged: false, createdAt: "2025-12-22T18:30:00.000Z" },
  { id: "r015", employeeId: "e003", date: "Dec 23, 2025", dateISO: "2025-12-23", dayName: "Tuesday", shortDate: "Dec 23", sales: 24, customersReached: 144, samplersGiven: 72, notes: "", location: "CBD", coords: { latitude: -1.2864, longitude: 36.8172 }, submitted: true, approved: true, flagged: false, createdAt: "2025-12-23T17:15:00.000Z" },
  { id: "r016", employeeId: "e008", date: "Dec 27, 2025", dateISO: "2025-12-27", dayName: "Saturday", shortDate: "Dec 27", sales: 13, customersReached: 78, samplersGiven: 39, notes: "Post-holiday slowdown.", location: "Ngong Road", coords: { latitude: -1.3012, longitude: 36.7834 }, submitted: true, approved: false, flagged: true, createdAt: "2025-12-27T17:30:00.000Z" },
  { id: "r017", employeeId: "e009", date: "Dec 29, 2025", dateISO: "2025-12-29", dayName: "Monday", shortDate: "Dec 29", sales: 19, customersReached: 114, samplersGiven: 57, notes: "Year-end wrap up.", location: "Ruiru", coords: { latitude: -1.1465, longitude: 36.9618 }, submitted: true, approved: true, flagged: false, createdAt: "2025-12-29T18:00:00.000Z" },
  { id: "r018", employeeId: "e004", date: "Dec 30, 2025", dateISO: "2025-12-30", dayName: "Tuesday", shortDate: "Dec 30", sales: 25, customersReached: 150, samplersGiven: 75, notes: "", location: "Kilimani", coords: { latitude: -1.2866, longitude: 36.7876 }, submitted: true, approved: true, flagged: false, createdAt: "2025-12-30T17:45:00.000Z" },
  { id: "r019", employeeId: "e001", date: "Dec 31, 2025", dateISO: "2025-12-31", dayName: "Wednesday", shortDate: "Dec 31", sales: 14, customersReached: 84, samplersGiven: 42, notes: "New Year's Eve - short day.", location: "Nairobi Central", coords: { latitude: -1.2921, longitude: 36.8219 }, submitted: true, approved: false, flagged: false, createdAt: "2025-12-31T16:00:00.000Z" },

  // January 2026
  { id: "r020", employeeId: "e006", date: "Jan 2, 2026", dateISO: "2026-01-02", dayName: "Friday", shortDate: "Jan 2", sales: 29, customersReached: 174, samplersGiven: 87, notes: "New year, new targets!", location: "Upperhill", coords: { latitude: -1.2955, longitude: 36.8130 }, submitted: true, approved: true, flagged: false, createdAt: "2026-01-02T17:30:00.000Z" },
  { id: "r021", employeeId: "e004", date: "Jan 5, 2026", dateISO: "2026-01-05", dayName: "Monday", shortDate: "Jan 5", sales: 22, customersReached: 132, samplersGiven: 66, notes: "", location: "Kilimani", coords: { latitude: -1.2866, longitude: 36.7876 }, submitted: true, approved: true, flagged: false, createdAt: "2026-01-05T17:45:00.000Z" },
  { id: "r022", employeeId: "e010", date: "Jan 7, 2026", dateISO: "2026-01-07", dayName: "Wednesday", shortDate: "Jan 7", sales: 35, customersReached: 210, samplersGiven: 105, notes: "Q1 strategy meeting.", location: "Gigiri", coords: { latitude: -1.2275, longitude: 36.7987 }, submitted: true, approved: true, flagged: false, createdAt: "2026-01-07T18:00:00.000Z" },
  { id: "r023", employeeId: "e002", date: "Jan 9, 2026", dateISO: "2026-01-09", dayName: "Friday", shortDate: "Jan 9", sales: 18, customersReached: 108, samplersGiven: 54, notes: "", location: "Westlands", coords: { latitude: -1.2670, longitude: 36.8031 }, submitted: true, approved: true, flagged: false, createdAt: "2026-01-09T17:30:00.000Z" },
  { id: "r024", employeeId: "e003", date: "Jan 12, 2026", dateISO: "2026-01-12", dayName: "Monday", shortDate: "Jan 12", sales: 20, customersReached: 120, samplersGiven: 60, notes: "", location: "CBD", coords: { latitude: -1.2864, longitude: 36.8172 }, submitted: true, approved: true, flagged: false, createdAt: "2026-01-12T17:00:00.000Z" },
  { id: "r025", employeeId: "e008", date: "Jan 14, 2026", dateISO: "2026-01-14", dayName: "Wednesday", shortDate: "Jan 14", sales: 16, customersReached: 96, samplersGiven: 48, notes: "", location: "Ngong Road", coords: { latitude: -1.3012, longitude: 36.7834 }, submitted: true, approved: true, flagged: false, createdAt: "2026-01-14T17:45:00.000Z" },
  { id: "r026", employeeId: "e001", date: "Jan 16, 2026", dateISO: "2026-01-16", dayName: "Friday", shortDate: "Jan 16", sales: 17, customersReached: 102, samplersGiven: 51, notes: "", location: "Nairobi Central", coords: { latitude: -1.2921, longitude: 36.8219 }, submitted: true, approved: true, flagged: false, createdAt: "2026-01-16T17:30:00.000Z" },
  { id: "r027", employeeId: "e006", date: "Jan 19, 2026", dateISO: "2026-01-19", dayName: "Monday", shortDate: "Jan 19", sales: 36, customersReached: 216, samplersGiven: 108, notes: "Strong mid-month performance.", location: "Upperhill", coords: { latitude: -1.2955, longitude: 36.8130 }, submitted: true, approved: true, flagged: false, createdAt: "2026-01-19T18:15:00.000Z" },
  { id: "r028", employeeId: "e009", date: "Jan 21, 2026", dateISO: "2026-01-21", dayName: "Wednesday", shortDate: "Jan 21", sales: 21, customersReached: 126, samplersGiven: 63, notes: "", location: "Ruiru", coords: { latitude: -1.1465, longitude: 36.9618 }, submitted: true, approved: true, flagged: false, createdAt: "2026-01-21T17:30:00.000Z" },
  { id: "r029", employeeId: "e004", date: "Jan 23, 2026", dateISO: "2026-01-23", dayName: "Friday", shortDate: "Jan 23", sales: 26, customersReached: 156, samplersGiven: 78, notes: "", location: "Kilimani", coords: { latitude: -1.2866, longitude: 36.7876 }, submitted: true, approved: true, flagged: false, createdAt: "2026-01-23T18:00:00.000Z" },
  { id: "r030", employeeId: "e002", date: "Jan 26, 2026", dateISO: "2026-01-26", dayName: "Monday", shortDate: "Jan 26", sales: 20, customersReached: 120, samplersGiven: 60, notes: "Republic Day - half day.", location: "Westlands", coords: { latitude: -1.2670, longitude: 36.8031 }, submitted: true, approved: false, flagged: false, createdAt: "2026-01-26T14:30:00.000Z" },
  { id: "r031", employeeId: "e010", date: "Jan 28, 2026", dateISO: "2026-01-28", dayName: "Wednesday", shortDate: "Jan 28", sales: 32, customersReached: 192, samplersGiven: 96, notes: "Monthly targets on track.", location: "Gigiri", coords: { latitude: -1.2275, longitude: 36.7987 }, submitted: true, approved: true, flagged: false, createdAt: "2026-01-28T17:45:00.000Z" },
  { id: "r032", employeeId: "e003", date: "Jan 30, 2026", dateISO: "2026-01-30", dayName: "Friday", shortDate: "Jan 30", sales: 22, customersReached: 132, samplersGiven: 66, notes: "End of month push.", location: "CBD", coords: { latitude: -1.2864, longitude: 36.8172 }, submitted: true, approved: true, flagged: false, createdAt: "2026-01-30T18:00:00.000Z" },

  // February 2026
  { id: "r033", employeeId: "e006", date: "Feb 2, 2026", dateISO: "2026-02-02", dayName: "Monday", shortDate: "Feb 2", sales: 33, customersReached: 198, samplersGiven: 99, notes: "February kickoff strong.", location: "Upperhill", coords: { latitude: -1.2955, longitude: 36.8130 }, submitted: true, approved: true, flagged: false, createdAt: "2026-02-02T17:30:00.000Z" },
  { id: "r034", employeeId: "e004", date: "Feb 4, 2026", dateISO: "2026-02-04", dayName: "Wednesday", shortDate: "Feb 4", sales: 24, customersReached: 144, samplersGiven: 72, notes: "", location: "Kilimani", coords: { latitude: -1.2866, longitude: 36.7876 }, submitted: true, approved: true, flagged: false, createdAt: "2026-02-04T17:45:00.000Z" },
  { id: "r035", employeeId: "e001", date: "Feb 6, 2026", dateISO: "2026-02-06", dayName: "Friday", shortDate: "Feb 6", sales: 16, customersReached: 96, samplersGiven: 48, notes: "", location: "Nairobi Central", coords: { latitude: -1.2921, longitude: 36.8219 }, submitted: true, approved: true, flagged: false, createdAt: "2026-02-06T17:15:00.000Z" },
  { id: "r036", employeeId: "e010", date: "Feb 9, 2026", dateISO: "2026-02-09", dayName: "Monday", shortDate: "Feb 9", sales: 34, customersReached: 204, samplersGiven: 102, notes: "Team briefing completed.", location: "Gigiri", coords: { latitude: -1.2275, longitude: 36.7987 }, submitted: true, approved: true, flagged: false, createdAt: "2026-02-09T18:00:00.000Z" },
  { id: "r037", employeeId: "e002", date: "Feb 11, 2026", dateISO: "2026-02-11", dayName: "Wednesday", shortDate: "Feb 11", sales: 19, customersReached: 114, samplersGiven: 57, notes: "", location: "Westlands", coords: { latitude: -1.2670, longitude: 36.8031 }, submitted: true, approved: true, flagged: false, createdAt: "2026-02-11T17:30:00.000Z" },
  { id: "r038", employeeId: "e008", date: "Feb 13, 2026", dateISO: "2026-02-13", dayName: "Friday", shortDate: "Feb 13", sales: 17, customersReached: 102, samplersGiven: 51, notes: "", location: "Ngong Road", coords: { latitude: -1.3012, longitude: 36.7834 }, submitted: true, approved: true, flagged: false, createdAt: "2026-02-13T17:45:00.000Z" },
  { id: "r039", employeeId: "e003", date: "Feb 16, 2026", dateISO: "2026-02-16", dayName: "Monday", shortDate: "Feb 16", sales: 21, customersReached: 126, samplersGiven: 63, notes: "", location: "CBD", coords: { latitude: -1.2864, longitude: 36.8172 }, submitted: true, approved: true, flagged: false, createdAt: "2026-02-16T17:00:00.000Z" },
  { id: "r040", employeeId: "e006", date: "Feb 18, 2026", dateISO: "2026-02-18", dayName: "Wednesday", shortDate: "Feb 18", sales: 37, customersReached: 222, samplersGiven: 111, notes: "Valentine's week boost.", location: "Upperhill", coords: { latitude: -1.2955, longitude: 36.8130 }, submitted: true, approved: true, flagged: false, createdAt: "2026-02-18T18:15:00.000Z" },
  { id: "r041", employeeId: "e009", date: "Feb 20, 2026", dateISO: "2026-02-20", dayName: "Friday", shortDate: "Feb 20", sales: 23, customersReached: 138, samplersGiven: 69, notes: "", location: "Ruiru", coords: { latitude: -1.1465, longitude: 36.9618 }, submitted: true, approved: true, flagged: false, createdAt: "2026-02-20T17:30:00.000Z" },
  { id: "r042", employeeId: "e004", date: "Feb 23, 2026", dateISO: "2026-02-23", dayName: "Monday", shortDate: "Feb 23", sales: 25, customersReached: 150, samplersGiven: 75, notes: "", location: "Kilimani", coords: { latitude: -1.2866, longitude: 36.7876 }, submitted: true, approved: true, flagged: false, createdAt: "2026-02-23T17:45:00.000Z" },
  { id: "r043", employeeId: "e010", date: "Feb 25, 2026", dateISO: "2026-02-25", dayName: "Wednesday", shortDate: "Feb 25", sales: 31, customersReached: 186, samplersGiven: 93, notes: "End of month strategy.", location: "Gigiri", coords: { latitude: -1.2275, longitude: 36.7987 }, submitted: true, approved: true, flagged: false, createdAt: "2026-02-25T18:00:00.000Z" },
  { id: "r044", employeeId: "e001", date: "Feb 27, 2026", dateISO: "2026-02-27", dayName: "Friday", shortDate: "Feb 27", sales: 15, customersReached: 90, samplersGiven: 45, notes: "", location: "Nairobi Central", coords: { latitude: -1.2921, longitude: 36.8219 }, submitted: true, approved: false, flagged: false, createdAt: "2026-02-27T17:15:00.000Z" },

  // March 2026
  { id: "r045", employeeId: "e006", date: "Mar 2, 2026", dateISO: "2026-03-02", dayName: "Monday", shortDate: "Mar 2", sales: 35, customersReached: 210, samplersGiven: 105, notes: "Q1 final month begins!", location: "Upperhill", coords: { latitude: -1.2955, longitude: 36.8130 }, submitted: true, approved: true, flagged: false, createdAt: "2026-03-02T17:30:00.000Z" },
  { id: "r046", employeeId: "e004", date: "Mar 4, 2026", dateISO: "2026-03-04", dayName: "Wednesday", shortDate: "Mar 4", sales: 26, customersReached: 156, samplersGiven: 78, notes: "", location: "Kilimani", coords: { latitude: -1.2866, longitude: 36.7876 }, submitted: true, approved: true, flagged: false, createdAt: "2026-03-04T17:45:00.000Z" },
  { id: "r047", employeeId: "e010", date: "Mar 6, 2026", dateISO: "2026-03-06", dayName: "Friday", shortDate: "Mar 6", sales: 32, customersReached: 192, samplersGiven: 96, notes: "Supervisor review.", location: "Gigiri", coords: { latitude: -1.2275, longitude: 36.7987 }, submitted: true, approved: true, flagged: false, createdAt: "2026-03-06T18:00:00.000Z" },
  { id: "r048", employeeId: "e002", date: "Mar 9, 2026", dateISO: "2026-03-09", dayName: "Monday", shortDate: "Mar 9", sales: 20, customersReached: 120, samplersGiven: 60, notes: "", location: "Westlands", coords: { latitude: -1.2670, longitude: 36.8031 }, submitted: true, approved: true, flagged: false, createdAt: "2026-03-09T17:30:00.000Z" },
  { id: "r049", employeeId: "e003", date: "Mar 11, 2026", dateISO: "2026-03-11", dayName: "Wednesday", shortDate: "Mar 11", sales: 22, customersReached: 132, samplersGiven: 66, notes: "", location: "CBD", coords: { latitude: -1.2864, longitude: 36.8172 }, submitted: true, approved: true, flagged: false, createdAt: "2026-03-11T17:00:00.000Z" },
  { id: "r050", employeeId: "e008", date: "Mar 13, 2026", dateISO: "2026-03-13", dayName: "Friday", shortDate: "Mar 13", sales: 18, customersReached: 108, samplersGiven: 54, notes: "", location: "Ngong Road", coords: { latitude: -1.3012, longitude: 36.7834 }, submitted: true, approved: true, flagged: false, createdAt: "2026-03-13T17:45:00.000Z" },
  { id: "r051", employeeId: "e006", date: "Mar 16, 2026", dateISO: "2026-03-16", dayName: "Monday", shortDate: "Mar 16", sales: 39, customersReached: 234, samplersGiven: 117, notes: "Mid-March surge!", location: "Upperhill", coords: { latitude: -1.2955, longitude: 36.8130 }, submitted: true, approved: true, flagged: false, createdAt: "2026-03-16T18:15:00.000Z" },
  { id: "r052", employeeId: "e001", date: "Mar 18, 2026", dateISO: "2026-03-18", dayName: "Wednesday", shortDate: "Mar 18", sales: 17, customersReached: 102, samplersGiven: 51, notes: "", location: "Nairobi Central", coords: { latitude: -1.2921, longitude: 36.8219 }, submitted: true, approved: true, flagged: false, createdAt: "2026-03-18T17:15:00.000Z" },
  { id: "r053", employeeId: "e009", date: "Mar 20, 2026", dateISO: "2026-03-20", dayName: "Friday", shortDate: "Mar 20", sales: 24, customersReached: 144, samplersGiven: 72, notes: "", location: "Ruiru", coords: { latitude: -1.1465, longitude: 36.9618 }, submitted: true, approved: true, flagged: false, createdAt: "2026-03-20T17:30:00.000Z" },
  { id: "r054", employeeId: "e004", date: "Mar 23, 2026", dateISO: "2026-03-23", dayName: "Monday", shortDate: "Mar 23", sales: 27, customersReached: 162, samplersGiven: 81, notes: "End of Q1 push.", location: "Kilimani", coords: { latitude: -1.2866, longitude: 36.7876 }, submitted: true, approved: true, flagged: false, createdAt: "2026-03-23T17:45:00.000Z" },
  { id: "r055", employeeId: "e010", date: "Mar 25, 2026", dateISO: "2026-03-25", dayName: "Wednesday", shortDate: "Mar 25", sales: 34, customersReached: 204, samplersGiven: 102, notes: "Quarter-end review.", location: "Gigiri", coords: { latitude: -1.2275, longitude: 36.7987 }, submitted: true, approved: true, flagged: false, createdAt: "2026-03-25T18:00:00.000Z" },
  { id: "r056", employeeId: "e002", date: "Mar 27, 2026", dateISO: "2026-03-27", dayName: "Friday", shortDate: "Mar 27", sales: 21, customersReached: 126, samplersGiven: 63, notes: "", location: "Westlands", coords: { latitude: -1.2670, longitude: 36.8031 }, submitted: true, approved: true, flagged: false, createdAt: "2026-03-27T17:30:00.000Z" },
  { id: "r057", employeeId: "e003", date: "Mar 30, 2026", dateISO: "2026-03-30", dayName: "Monday", shortDate: "Mar 30", sales: 23, customersReached: 138, samplersGiven: 69, notes: "Final push for Q1.", location: "CBD", coords: { latitude: -1.2864, longitude: 36.8172 }, submitted: true, approved: true, flagged: false, createdAt: "2026-03-30T18:00:00.000Z" },
  { id: "r058", employeeId: "e006", date: "Mar 31, 2026", dateISO: "2026-03-31", dayName: "Tuesday", shortDate: "Mar 31", sales: 42, customersReached: 252, samplersGiven: 126, notes: "Q1 ends with a BANG! 🎉", location: "Upperhill", coords: { latitude: -1.2955, longitude: 36.8130 }, submitted: true, approved: true, flagged: false, createdAt: "2026-03-31T18:30:00.000Z" },

  // April 2026 (up to April 3)
  { id: "r059", employeeId: "e006", date: "Apr 1, 2026", dateISO: "2026-04-01", dayName: "Wednesday", shortDate: "Apr 1", sales: 28, customersReached: 168, samplersGiven: 84, notes: "New quarter, fresh targets!", location: "Upperhill", coords: { latitude: -1.2955, longitude: 36.8130 }, submitted: true, approved: true, flagged: false, createdAt: "2026-04-01T17:30:00.000Z" },
  { id: "r060", employeeId: "e004", date: "Apr 1, 2026", dateISO: "2026-04-01", dayName: "Wednesday", shortDate: "Apr 1", sales: 20, customersReached: 120, samplersGiven: 60, notes: "", location: "Kilimani", coords: { latitude: -1.2866, longitude: 36.7876 }, submitted: true, approved: true, flagged: false, createdAt: "2026-04-01T17:45:00.000Z" },
  { id: "r061", employeeId: "e010", date: "Apr 1, 2026", dateISO: "2026-04-01", dayName: "Wednesday", shortDate: "Apr 1", sales: 25, customersReached: 150, samplersGiven: 75, notes: "Q2 kickoff meeting.", location: "Gigiri", coords: { latitude: -1.2275, longitude: 36.7987 }, submitted: true, approved: true, flagged: false, createdAt: "2026-04-01T18:00:00.000Z" },
  { id: "r062", employeeId: "e001", date: "Apr 2, 2026", dateISO: "2026-04-02", dayName: "Thursday", shortDate: "Apr 2", sales: 14, customersReached: 84, samplersGiven: 42, notes: "", location: "Nairobi Central", coords: { latitude: -1.2921, longitude: 36.8219 }, submitted: true, approved: false, flagged: false, createdAt: "2026-04-02T17:15:00.000Z" },
  { id: "r063", employeeId: "e002", date: "Apr 2, 2026", dateISO: "2026-04-02", dayName: "Thursday", shortDate: "Apr 2", sales: 16, customersReached: 96, samplersGiven: 48, notes: "", location: "Westlands", coords: { latitude: -1.2670, longitude: 36.8031 }, submitted: true, approved: true, flagged: false, createdAt: "2026-04-02T17:30:00.000Z" },
  { id: "r064", employeeId: "e003", date: "Apr 2, 2026", dateISO: "2026-04-02", dayName: "Thursday", shortDate: "Apr 2", sales: 18, customersReached: 108, samplersGiven: 54, notes: "", location: "CBD", coords: { latitude: -1.2864, longitude: 36.8172 }, submitted: true, approved: true, flagged: false, createdAt: "2026-04-02T17:00:00.000Z" },
  { id: "r065", employeeId: "e008", date: "Apr 3, 2026", dateISO: "2026-04-03", dayName: "Friday", shortDate: "Apr 3", sales: 15, customersReached: 90, samplersGiven: 45, notes: "End of week report.", location: "Ngong Road", coords: { latitude: -1.3012, longitude: 36.7834 }, submitted: true, approved: false, flagged: false, createdAt: "2026-04-03T17:45:00.000Z" },
  { id: "r066", employeeId: "e006", date: "Apr 3, 2026", dateISO: "2026-04-03", dayName: "Friday", shortDate: "Apr 3", sales: 30, customersReached: 180, samplersGiven: 90, notes: "Strong first week of April!", location: "Upperhill", coords: { latitude: -1.2955, longitude: 36.8130 }, submitted: true, approved: true, flagged: false, createdAt: "2026-04-03T18:15:00.000Z" },
  { id: "r067", employeeId: "e009", date: "Apr 3, 2026", dateISO: "2026-04-03", dayName: "Friday", shortDate: "Apr 3", sales: 19, customersReached: 114, samplersGiven: 57, notes: "", location: "Ruiru", coords: { latitude: -1.1465, longitude: 36.9618 }, submitted: true, approved: true, flagged: false, createdAt: "2026-04-03T17:30:00.000Z" },
];

// ─── 6. CHECK-INS — December 2025 to April 3, 2026 ONLY ──────────────────────

const checkins: CheckIn[] = [
  // December 2025
  { id: "c001", employeeId: "e001", coords: { latitude: -1.2921, longitude: 36.8219, accuracy: 12 }, locationName: "Nairobi CBD", checkInTime: "2025-12-01T07:55:00.000Z", checkOutTime: "2025-12-01T17:10:00.000Z", status: "checked-out", date: "2025-12-01" },
  { id: "c002", employeeId: "e006", coords: { latitude: -1.2955, longitude: 36.8130, accuracy: 8 }, locationName: "Upperhill", checkInTime: "2025-12-02T07:30:00.000Z", checkOutTime: "2025-12-02T17:30:00.000Z", status: "checked-out", date: "2025-12-02" },
  { id: "c003", employeeId: "e004", coords: { latitude: -1.2866, longitude: 36.7876, accuracy: 16 }, locationName: "Kilimani", checkInTime: "2025-12-03T08:10:00.000Z", checkOutTime: "2025-12-03T17:00:00.000Z", status: "checked-out", date: "2025-12-03" },
  { id: "c004", employeeId: "e002", coords: { latitude: -1.2670, longitude: 36.8031, accuracy: 15 }, locationName: "Westlands", checkInTime: "2025-12-04T08:02:00.000Z", checkOutTime: "2025-12-04T17:15:00.000Z", status: "checked-out", date: "2025-12-04" },
  { id: "c005", employeeId: "e010", coords: { latitude: -1.2275, longitude: 36.7987, accuracy: 11 }, locationName: "Gigiri", checkInTime: "2025-12-05T07:45:00.000Z", checkOutTime: "2025-12-05T18:00:00.000Z", status: "checked-out", date: "2025-12-05" },
  { id: "c006", employeeId: "e003", coords: { latitude: -1.2864, longitude: 36.8172, accuracy: 10 }, locationName: "Nairobi CBD", checkInTime: "2025-12-08T07:48:00.000Z", checkOutTime: "2025-12-08T17:20:00.000Z", status: "checked-out", date: "2025-12-08" },
  { id: "c007", employeeId: "e008", coords: { latitude: -1.3012, longitude: 36.7834, accuracy: 14 }, locationName: "Ngong Rd", checkInTime: "2025-12-10T08:05:00.000Z", checkOutTime: "2025-12-10T17:30:00.000Z", status: "checked-out", date: "2025-12-10" },
  { id: "c008", employeeId: "e009", coords: { latitude: -1.1465, longitude: 36.9618, accuracy: 18 }, locationName: "Ruiru", checkInTime: "2025-12-12T07:55:00.000Z", checkOutTime: "2025-12-12T17:00:00.000Z", status: "checked-out", date: "2025-12-12" },

  // January 2026
  { id: "c009", employeeId: "e006", coords: { latitude: -1.2955, longitude: 36.8130, accuracy: 8 }, locationName: "Upperhill", checkInTime: "2026-01-02T07:30:00.000Z", checkOutTime: "2026-01-02T17:30:00.000Z", status: "checked-out", date: "2026-01-02" },
  { id: "c010", employeeId: "e004", coords: { latitude: -1.2866, longitude: 36.7876, accuracy: 16 }, locationName: "Kilimani", checkInTime: "2026-01-05T08:10:00.000Z", checkOutTime: "2026-01-05T17:00:00.000Z", status: "checked-out", date: "2026-01-05" },
  { id: "c011", employeeId: "e010", coords: { latitude: -1.2275, longitude: 36.7987, accuracy: 11 }, locationName: "Gigiri", checkInTime: "2026-01-07T07:45:00.000Z", checkOutTime: "2026-01-07T18:00:00.000Z", status: "checked-out", date: "2026-01-07" },
  { id: "c012", employeeId: "e001", coords: { latitude: -1.2921, longitude: 36.8219, accuracy: 12 }, locationName: "Nairobi CBD", checkInTime: "2026-01-09T07:55:00.000Z", checkOutTime: "2026-01-09T17:10:00.000Z", status: "checked-out", date: "2026-01-09" },
  { id: "c013", employeeId: "e002", coords: { latitude: -1.2670, longitude: 36.8031, accuracy: 15 }, locationName: "Westlands", checkInTime: "2026-01-12T08:02:00.000Z", checkOutTime: "2026-01-12T17:15:00.000Z", status: "checked-out", date: "2026-01-12" },
  { id: "c014", employeeId: "e003", coords: { latitude: -1.2864, longitude: 36.8172, accuracy: 10 }, locationName: "Nairobi CBD", checkInTime: "2026-01-14T07:48:00.000Z", checkOutTime: "2026-01-14T17:20:00.000Z", status: "checked-out", date: "2026-01-14" },

  // February 2026
  { id: "c015", employeeId: "e006", coords: { latitude: -1.2955, longitude: 36.8130, accuracy: 8 }, locationName: "Upperhill", checkInTime: "2026-02-02T07:30:00.000Z", checkOutTime: "2026-02-02T17:30:00.000Z", status: "checked-out", date: "2026-02-02" },
  { id: "c016", employeeId: "e004", coords: { latitude: -1.2866, longitude: 36.7876, accuracy: 16 }, locationName: "Kilimani", checkInTime: "2026-02-04T08:10:00.000Z", checkOutTime: "2026-02-04T17:00:00.000Z", status: "checked-out", date: "2026-02-04" },
  { id: "c017", employeeId: "e010", coords: { latitude: -1.2275, longitude: 36.7987, accuracy: 11 }, locationName: "Gigiri", checkInTime: "2026-02-09T07:45:00.000Z", checkOutTime: "2026-02-09T18:00:00.000Z", status: "checked-out", date: "2026-02-09" },
  { id: "c018", employeeId: "e008", coords: { latitude: -1.3012, longitude: 36.7834, accuracy: 14 }, locationName: "Ngong Rd", checkInTime: "2026-02-13T08:05:00.000Z", checkOutTime: "2026-02-13T17:30:00.000Z", status: "checked-out", date: "2026-02-13" },
  { id: "c019", employeeId: "e009", coords: { latitude: -1.1465, longitude: 36.9618, accuracy: 18 }, locationName: "Ruiru", checkInTime: "2026-02-20T07:55:00.000Z", checkOutTime: "2026-02-20T17:00:00.000Z", status: "checked-out", date: "2026-02-20" },

  // March 2026
  { id: "c020", employeeId: "e006", coords: { latitude: -1.2955, longitude: 36.8130, accuracy: 8 }, locationName: "Upperhill", checkInTime: "2026-03-02T07:30:00.000Z", checkOutTime: "2026-03-02T17:30:00.000Z", status: "checked-out", date: "2026-03-02" },
  { id: "c021", employeeId: "e004", coords: { latitude: -1.2866, longitude: 36.7876, accuracy: 16 }, locationName: "Kilimani", checkInTime: "2026-03-04T08:10:00.000Z", checkOutTime: "2026-03-04T17:00:00.000Z", status: "checked-out", date: "2026-03-04" },
  { id: "c022", employeeId: "e010", coords: { latitude: -1.2275, longitude: 36.7987, accuracy: 11 }, locationName: "Gigiri", checkInTime: "2026-03-06T07:45:00.000Z", checkOutTime: "2026-03-06T18:00:00.000Z", status: "checked-out", date: "2026-03-06" },
  { id: "c023", employeeId: "e002", coords: { latitude: -1.2670, longitude: 36.8031, accuracy: 15 }, locationName: "Westlands", checkInTime: "2026-03-09T08:02:00.000Z", checkOutTime: "2026-03-09T17:15:00.000Z", status: "checked-out", date: "2026-03-09" },
  { id: "c024", employeeId: "e001", coords: { latitude: -1.2921, longitude: 36.8219, accuracy: 12 }, locationName: "Nairobi CBD", checkInTime: "2026-03-18T07:55:00.000Z", checkOutTime: "2026-03-18T17:10:00.000Z", status: "checked-out", date: "2026-03-18" },
  { id: "c025", employeeId: "e003", coords: { latitude: -1.2864, longitude: 36.8172, accuracy: 10 }, locationName: "Nairobi CBD", checkInTime: "2026-03-30T07:48:00.000Z", checkOutTime: "2026-03-30T17:20:00.000Z", status: "checked-out", date: "2026-03-30" },

  // April 2026
  { id: "c026", employeeId: "e006", coords: { latitude: -1.2955, longitude: 36.8130, accuracy: 8 }, locationName: "Upperhill", checkInTime: "2026-04-01T07:30:00.000Z", checkOutTime: "2026-04-01T17:30:00.000Z", status: "checked-out", date: "2026-04-01" },
  { id: "c027", employeeId: "e004", coords: { latitude: -1.2866, longitude: 36.7876, accuracy: 16 }, locationName: "Kilimani", checkInTime: "2026-04-01T08:10:00.000Z", checkOutTime: "2026-04-01T17:00:00.000Z", status: "checked-out", date: "2026-04-01" },
  { id: "c028", employeeId: "e010", coords: { latitude: -1.2275, longitude: 36.7987, accuracy: 11 }, locationName: "Gigiri", checkInTime: "2026-04-01T07:45:00.000Z", checkOutTime: "2026-04-01T18:00:00.000Z", status: "checked-out", date: "2026-04-01" },
  { id: "c029", employeeId: "e001", coords: { latitude: -1.2921, longitude: 36.8219, accuracy: 12 }, locationName: "Nairobi CBD", checkInTime: "2026-04-02T07:55:00.000Z", checkOutTime: "2026-04-02T17:10:00.000Z", status: "checked-out", date: "2026-04-02" },
  { id: "c030", employeeId: "e002", coords: { latitude: -1.2670, longitude: 36.8031, accuracy: 15 }, locationName: "Westlands", checkInTime: "2026-04-02T08:02:00.000Z", checkOutTime: "2026-04-02T17:15:00.000Z", status: "checked-out", date: "2026-04-02" },
  { id: "c031", employeeId: "e003", coords: { latitude: -1.2864, longitude: 36.8172, accuracy: 10 }, locationName: "Nairobi CBD", checkInTime: "2026-04-02T07:48:00.000Z", checkOutTime: "2026-04-02T17:20:00.000Z", status: "checked-out", date: "2026-04-02" },
  { id: "c032", employeeId: "e008", coords: { latitude: -1.3012, longitude: 36.7834, accuracy: 14 }, locationName: "Ngong Rd", checkInTime: "2026-04-03T08:05:00.000Z", checkOutTime: null, status: "checked-in", date: "2026-04-03" },
  { id: "c033", employeeId: "e006", coords: { latitude: -1.2955, longitude: 36.8130, accuracy: 8 }, locationName: "Upperhill", checkInTime: "2026-04-03T07:30:00.000Z", checkOutTime: null, status: "checked-in", date: "2026-04-03" },
  { id: "c034", employeeId: "e009", coords: { latitude: -1.1465, longitude: 36.9618, accuracy: 18 }, locationName: "Ruiru", checkInTime: "2026-04-03T07:55:00.000Z", checkOutTime: null, status: "checked-in", date: "2026-04-03" },
];

// ─── 7. PAYROLL — December 2025 to March 2026 (April payroll generation pending) ──

const payroll: PayrollRecord[] = [
  // December 2025
  { id: "p001", employeeId: "e006", period: { month: "Dec", year: "2025", label: "Dec 2025" }, baseSalary: 49400, bonuses: { salesBonus: 7410, performanceBonus: 2000 }, allowances: [{ label: "Transport", amount: 3000 }, { label: "Airtime", amount: 1000 }], deductions: [{ label: "NHIF", amount: 1700 }, { label: "NSSF", amount: 1080 }, { label: "PAYE", amount: 7800 }], attendance: { daysWorked: 18, totalDays: 23 }, status: "paid", generatedAt: "2025-12-31T08:00:00.000Z", paidAt: "2025-12-31T10:00:00.000Z", notes: "Holiday bonus included." },
  { id: "p002", employeeId: "e004", period: { month: "Dec", year: "2025", label: "Dec 2025" }, baseSalary: 36100, bonuses: { salesBonus: 5415, performanceBonus: 1000 }, allowances: [{ label: "Transport", amount: 2500 }, { label: "Airtime", amount: 1000 }], deductions: [{ label: "NHIF", amount: 1700 }, { label: "NSSF", amount: 1080 }, { label: "PAYE", amount: 5700 }], attendance: { daysWorked: 20, totalDays: 23 }, status: "paid", generatedAt: "2025-12-31T08:00:00.000Z", paidAt: "2025-12-31T10:00:00.000Z", notes: "" },
  { id: "p003", employeeId: "e010", period: { month: "Dec", year: "2025", label: "Dec 2025" }, baseSalary: 55100, bonuses: { salesBonus: 8265, performanceBonus: 2500 }, allowances: [{ label: "Transport", amount: 4000 }, { label: "Airtime", amount: 1500 }, { label: "Team Allowance", amount: 2000 }], deductions: [{ label: "NHIF", amount: 1700 }, { label: "NSSF", amount: 1080 }, { label: "PAYE", amount: 11000 }], attendance: { daysWorked: 19, totalDays: 23 }, status: "paid", generatedAt: "2025-12-31T08:00:00.000Z", paidAt: "2025-12-31T10:00:00.000Z", notes: "" },

  // January 2026
  { id: "p004", employeeId: "e006", period: { month: "Jan", year: "2026", label: "Jan 2026" }, baseSalary: 52000, bonuses: { salesBonus: 6240, performanceBonus: 2000 }, allowances: [{ label: "Transport", amount: 3000 }, { label: "Airtime", amount: 1000 }], deductions: [{ label: "NHIF", amount: 1700 }, { label: "NSSF", amount: 1080 }, { label: "PAYE", amount: 8200 }], attendance: { daysWorked: 20, totalDays: 22 }, status: "paid", generatedAt: "2026-01-31T08:00:00.000Z", paidAt: "2026-01-31T10:00:00.000Z", notes: "" },
  { id: "p005", employeeId: "e004", period: { month: "Jan", year: "2026", label: "Jan 2026" }, baseSalary: 38000, bonuses: { salesBonus: 4560, performanceBonus: 1500 }, allowances: [{ label: "Transport", amount: 2500 }, { label: "Airtime", amount: 1000 }], deductions: [{ label: "NHIF", amount: 1700 }, { label: "NSSF", amount: 1080 }, { label: "PAYE", amount: 6000 }], attendance: { daysWorked: 19, totalDays: 22 }, status: "paid", generatedAt: "2026-01-31T08:00:00.000Z", paidAt: "2026-01-31T10:00:00.000Z", notes: "" },
  { id: "p006", employeeId: "e010", period: { month: "Jan", year: "2026", label: "Jan 2026" }, baseSalary: 58000, bonuses: { salesBonus: 6960, performanceBonus: 3000 }, allowances: [{ label: "Transport", amount: 4000 }, { label: "Airtime", amount: 1500 }, { label: "Team Allowance", amount: 2000 }], deductions: [{ label: "NHIF", amount: 1700 }, { label: "NSSF", amount: 1080 }, { label: "PAYE", amount: 11500 }], attendance: { daysWorked: 21, totalDays: 22 }, status: "paid", generatedAt: "2026-01-31T08:00:00.000Z", paidAt: "2026-01-31T10:00:00.000Z", notes: "" },

  // February 2026
  { id: "p007", employeeId: "e006", period: { month: "Feb", year: "2026", label: "Feb 2026" }, baseSalary: 52000, bonuses: { salesBonus: 6760, performanceBonus: 2000 }, allowances: [{ label: "Transport", amount: 3000 }, { label: "Airtime", amount: 1000 }], deductions: [{ label: "NHIF", amount: 1700 }, { label: "NSSF", amount: 1080 }, { label: "PAYE", amount: 8200 }], attendance: { daysWorked: 18, totalDays: 20 }, status: "paid", generatedAt: "2026-02-28T08:00:00.000Z", paidAt: "2026-02-28T10:00:00.000Z", notes: "" },
  { id: "p008", employeeId: "e004", period: { month: "Feb", year: "2026", label: "Feb 2026" }, baseSalary: 38000, bonuses: { salesBonus: 4940, performanceBonus: 1500 }, allowances: [{ label: "Transport", amount: 2500 }, { label: "Airtime", amount: 1000 }], deductions: [{ label: "NHIF", amount: 1700 }, { label: "NSSF", amount: 1080 }, { label: "PAYE", amount: 6000 }], attendance: { daysWorked: 17, totalDays: 20 }, status: "paid", generatedAt: "2026-02-28T08:00:00.000Z", paidAt: "2026-02-28T10:00:00.000Z", notes: "" },

  // March 2026
  { id: "p009", employeeId: "e006", period: { month: "Mar", year: "2026", label: "Mar 2026" }, baseSalary: 52000, bonuses: { salesBonus: 8840, performanceBonus: 3000 }, allowances: [{ label: "Transport", amount: 3000 }, { label: "Airtime", amount: 1000 }], deductions: [{ label: "NHIF", amount: 1700 }, { label: "NSSF", amount: 1080 }, { label: "PAYE", amount: 8500 }], attendance: { daysWorked: 21, totalDays: 23 }, status: "paid", generatedAt: "2026-03-31T08:00:00.000Z", paidAt: "2026-03-31T10:00:00.000Z", notes: "Q1 bonus applied!" },
  { id: "p010", employeeId: "e004", period: { month: "Mar", year: "2026", label: "Mar 2026" }, baseSalary: 38000, bonuses: { salesBonus: 5700, performanceBonus: 2000 }, allowances: [{ label: "Transport", amount: 2500 }, { label: "Airtime", amount: 1000 }], deductions: [{ label: "NHIF", amount: 1700 }, { label: "NSSF", amount: 1080 }, { label: "PAYE", amount: 6200 }], attendance: { daysWorked: 22, totalDays: 23 }, status: "paid", generatedAt: "2026-03-31T08:00:00.000Z", paidAt: "2026-03-31T10:00:00.000Z", notes: "" },
  { id: "p011", employeeId: "e010", period: { month: "Mar", year: "2026", label: "Mar 2026" }, baseSalary: 58000, bonuses: { salesBonus: 9860, performanceBonus: 4000 }, allowances: [{ label: "Transport", amount: 4000 }, { label: "Airtime", amount: 1500 }, { label: "Team Allowance", amount: 2000 }], deductions: [{ label: "NHIF", amount: 1700 }, { label: "NSSF", amount: 1080 }, { label: "PAYE", amount: 11800 }], attendance: { daysWorked: 23, totalDays: 23 }, status: "paid", generatedAt: "2026-03-31T08:00:00.000Z", paidAt: "2026-03-31T10:00:00.000Z", notes: "Perfect attendance bonus!" },
  { id: "p012", employeeId: "e001", period: { month: "Mar", year: "2026", label: "Mar 2026" }, baseSalary: 28000, bonuses: { salesBonus: 3640, performanceBonus: 0 }, allowances: [{ label: "Transport", amount: 1500 }, { label: "Airtime", amount: 600 }], deductions: [{ label: "NHIF", amount: 1700 }, { label: "NSSF", amount: 1080 }, { label: "PAYE", amount: 3300 }], attendance: { daysWorked: 19, totalDays: 23 }, status: "pending", generatedAt: "2026-03-31T08:00:00.000Z", paidAt: null, notes: "" },
];

// ─── 8. THE DATABASE EXPORT ───────────────────────────────────────────────────

export const db: MockDatabase = {
  users,
  employees,
  reports,
  checkins,
  payroll,
};

export default db;