/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  NYAMASI FEMS — MOCK DATABASE  (mockDB.ts)
 *
 *  Products: Hibiscus Powder, Hibiscus Flower, Hibiscus Tea Bag, Hibiscus Tea Cut
 *  Employees: 2 field sales reps + 1 admin
 *  Location: Zucchini GreenGrocers – Langata Link, Nairobi
 *  Data: Feb 2026, Mar 2026, Apr 2026 (up to date)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ─── PRODUCT TYPES ────────────────────────────────────────────────────────────

export type ProductSKU =
  | "hibiscus-powder"
  | "hibiscus-flower"
  | "hibiscus-teabag"
  | "hibiscus-teacut";

export interface Product {
  sku: ProductSKU;
  name: string;
  unitPrice: number; // KES
}

export const PRODUCTS: Product[] = [
  { sku: "hibiscus-powder",  name: "Hibiscus Powder",    unitPrice: 1000 },
  { sku: "hibiscus-flower",  name: "Hibiscus Flower",    unitPrice: 650 },
  { sku: "hibiscus-teabag",  name: "Hibiscus Tea Bag",   unitPrice: 650 },
  { sku: "hibiscus-teacut",  name: "Hibiscus Tea Cut",   unitPrice: 850 },
];

// ─── SALES BREAKDOWN (per report) ────────────────────────────────────────────

export interface ProductLineItem {
  sku: ProductSKU;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface SalesBreakdown {
  items: ProductLineItem[];       // one per product sold
  totalItems: number;             // sum of qty across all products
  totalAmount: number;            // KES — auto-calculated
  cash: number;                   // KES received in cash
  mpesa: number;                  // KES received via M-Pesa
  debt: number;                   // KES outstanding / credit
  // Invariant: cash + mpesa + debt === totalAmount
}

// ─── ASSIGNED LOCATION ────────────────────────────────────────────────────────

export interface AssignedLocation {
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number; // check-in must be within this radius
}

// ─── CORE ENTITY TYPES ────────────────────────────────────────────────────────

export type UserRole   = "admin" | "employee";
export type EmpRole    = "sales_rep" | "supervisor" | "manager";
export type EmpStatus  = "active" | "inactive" | "suspended";
export type PayStatus  = "draft" | "pending" | "paid";

export interface User {
  id: string;
  phone: string;
  password: string;
  role: UserRole;
  employeeId?: string;   // linked employee (undefined for admin-only users)
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
  online: boolean;
  assignedArea: string;
  assignedLocation: AssignedLocation;   // geo-fenced work location
  lastKnownLocation: {
    latitude: number;
    longitude: number;
    name: string;
    timestamp: string;
  };
  salary: { base: number; currency: "KES" };
  targets: { daily: number; monthly: number };
  rating: number;
  joinDate: string;
  joinDateISO: string;
  createdAt: string;
  createdBy: string;
  lastPasswordUpdate?: string;
}

export interface Report {
  id: string;
  employeeId: string;
  date: string;           // "Apr 6, 2026"
  dateISO: string;        // "2026-04-06"
  dayName: string;        // "Monday"
  shortDate: string;      // "Apr 6"

  // Sales detail
  salesBreakdown: SalesBreakdown;
  sales: number;          // alias → salesBreakdown.totalItems  (kept for backward-compat)
  totalSalesKES: number;  // alias → salesBreakdown.totalAmount

  customersReached: number;
  samplersGiven: number;
  notes: string;
  location: string;
  coords: { latitude: number; longitude: number } | null;

  // Photo proof
  photoUri: string | null;  // local or remote URI of sales photo

  // Submission metadata
  submitted: boolean;
  submittedAt: string | null;   // ISO timestamp of submission
  lateFlag: boolean;            // true if submitted after 19:00 EAT
  approved: boolean;
  flagged: boolean;             // low-sales flag

  createdAt: string;
}

export interface CheckIn {
  id: string;
  employeeId: string;
  coords: { latitude: number; longitude: number; accuracy: number };
  locationName: string;
  checkInTime: string;
  checkOutTime: string | null;
  status: "checked-in" | "checked-out";
  date: string;
  withinRadius: boolean;  // was check-in within assigned geo-fence?
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  period: { month: string; year: string; label: string };
  baseSalary: number;
  bonuses: { salesBonus: number; performanceBonus: number };
  allowances: { label: string; amount: number }[];
  deductions: { label: string; amount: number }[];
  attendance: { daysWorked: number; totalDays: number };
  status: PayStatus;
  generatedAt: string;
  paidAt: string | null;
  notes: string;
}

// ─── DB SHAPE ─────────────────────────────────────────────────────────────────

interface MockDB {
  users: User[];
  employees: Employee[];
  reports: Report[];
  checkins: CheckIn[];
  payroll: PayrollRecord[];
}

// ─── ASSIGNED LOCATION CONSTANT ───────────────────────────────────────────────

/** Zucchini GreenGrocers – Langata Link, The Hub Karen */
const ZUCCHINI_LANGATA: AssignedLocation = {
  name: "Zucchini GreenGrocers – Langata Link",
  latitude:  -1.3205,
  longitude: 36.7678,
  radiusMeters: 500,
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Build a SalesBreakdown from raw line items + payment split. */
function mkBreakdown(
  items: { sku: ProductSKU; qty: number }[],
  cash: number,
  mpesa: number,
  debt: number
): SalesBreakdown {
  const lines: ProductLineItem[] = items.map(({ sku, qty }) => {
    const product = PRODUCTS.find((p) => p.sku === sku)!;
    return { sku, qty, unitPrice: product.unitPrice, subtotal: product.unitPrice * qty };
  });
  const totalItems  = lines.reduce((s, l) => s + l.qty, 0);
  const totalAmount = lines.reduce((s, l) => s + l.subtotal, 0);
  return { items: lines, totalItems, totalAmount, cash, mpesa, debt };
}

/** Make a Report record with all derived fields. */
function mkReport(
  id: string,
  employeeId: string,
  dateISO: string,
  breakdown: SalesBreakdown,
  customersReached: number,
  samplersGiven: number,
  notes: string,
  photoUri: string | null,
  submittedAt: string,   // ISO — used to determine lateFlag
): Report {
  const d       = new Date(dateISO + "T00:00:00");
  const date    = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
  const shortDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  // EAT = UTC+3 → 19:00 EAT = 16:00 UTC
  const subDate   = new Date(submittedAt);
  const eatHour   = (subDate.getUTCHours() + 3) % 24;
  const lateFlag  = eatHour >= 19;
  const flagged   = breakdown.totalItems < 5;

  return {
    id,
    employeeId,
    date,
    dateISO,
    dayName,
    shortDate,
    salesBreakdown: breakdown,
    sales:        breakdown.totalItems,
    totalSalesKES: breakdown.totalAmount,
    customersReached,
    samplersGiven,
    notes,
    location: ZUCCHINI_LANGATA.name,
    coords: { latitude: ZUCCHINI_LANGATA.latitude, longitude: ZUCCHINI_LANGATA.longitude },
    photoUri,
    submitted: true,
    submittedAt,
    lateFlag,
    approved: false,
    flagged,
    createdAt: submittedAt,
  };
}

// ─── SEED DATA ────────────────────────────────────────────────────────────────

export const db: MockDB = {
  // ── USERS ─────────────────────────────────────────────────────────────────
  users: [
    {
      id: "u001",
      phone: "0700000001",
      password: "admin123",
      role: "admin",
      active: true,
      createdAt: "2026-01-01T08:00:00.000Z",
    },
    {
      id: "u002",
      phone: "0711111111",
      password: "grace123",
      role: "employee",
      employeeId: "e001",
      active: true,
      createdAt: "2026-01-15T08:00:00.000Z",
    },
    {
      id: "u003",
      phone: "0722222222",
      password: "test123",
      role: "employee",
      employeeId: "e002",
      active: true,
      createdAt: "2026-01-15T08:00:00.000Z",
    },
  ],

  // ── EMPLOYEES ─────────────────────────────────────────────────────────────
  employees: [
    {
      id: "e001",
      firstName: "Grace",
      lastName: "Wanjiku",
      fullName: "Grace Wanjiku",
      initials: "GW",
      role: "sales_rep",
      department: "Field Sales",
      phone: "0711111111",
      email: "grace.wanjiku@nyamasi.co.ke",
      status: "active",
      online: false,
      assignedArea: "Zucchini GreenGrocers – Langata Link",
      assignedLocation: ZUCCHINI_LANGATA,
      lastKnownLocation: {
        latitude:  ZUCCHINI_LANGATA.latitude,
        longitude: ZUCCHINI_LANGATA.longitude,
        name:      ZUCCHINI_LANGATA.name,
        timestamp: "2026-04-06T07:30:00.000Z",
      },
      salary:  { base: 25000, currency: "KES" },
      targets: { daily: 15, monthly: 300 },
      rating: 4.3,
      joinDate:    "Jan 2026",
      joinDateISO: "2026-01-15",
      createdAt:   "2026-01-15T08:00:00.000Z",
      createdBy:   "u001",
       lastPasswordUpdate: "2024-03-01T10:00:00.000Z", 
    },
    {
  id: "e002",
  firstName: "George",
  lastName: "Bonga",
  fullName: "George Bonga",
  initials: "GB",
  role: "sales_rep",
  department: "Field Sales",
  phone: "0722222222",
  email: "george.bonga@nyamasi.co.ke",
  status: "active",
  online: false,

  assignedArea: "T-Mall Langata",

  assignedLocation: {
    name: "T-Mall Langata",
    latitude: -1.310428,
    longitude: 36.81774,
    radiusMeters: 150, // 🔥 geofence
  },

  lastKnownLocation: {
    latitude: -1.310428,
    longitude: 36.817794,
    name: "T-Mall Langata",
    timestamp: "2026-04-06T07:30:00.000Z",
  },

  salary:  { base: 22000, currency: "KES" },
  targets: { daily: 12, monthly: 250 },
  rating: 3.8,

  joinDate:    "Jan 2026",
  joinDateISO: "2026-01-15",
  createdAt:   "2026-01-15T08:00:00.000Z",
  createdBy:   "u001",
   lastPasswordUpdate: "2024-03-01T10:00:00.000Z", // Example date
}
  ],

  // ── REPORTS ───────────────────────────────────────────────────────────────
  // Feb 2026 — Grace (e001) — 8 days of data
  // Mar 2026 — Grace (e001) — 10 days, Test User (e002) — 8 days
  // Apr 2026 — Grace (e001) — up to Apr 5, Test User (e002) — up to Apr 4
  reports: [
    // ── FEBRUARY 2026 – Grace ──────────────────────────────────────────────
    mkReport("r001", "e001", "2026-02-03",
      mkBreakdown(
        [{ sku: "hibiscus-powder", qty: 6 }, { sku: "hibiscus-teabag", qty: 5 }],
        3050, 1950, 0
      ), 28, 10, "Good morning traffic at Zucchini. Many customers tried samples.", null,
      "2026-02-03T14:30:00.000Z"
    ),
    mkReport("r002", "e001", "2026-02-05",
      mkBreakdown(
        [{ sku: "hibiscus-flower", qty: 4 }, { sku: "hibiscus-teacut", qty: 6 }],
        2120, 1400, 0
      ), 22, 8, "Busy Wednesday. Tea cut moving well.", null,
      "2026-02-05T15:10:00.000Z"
    ),
    mkReport("r003", "e001", "2026-02-10",
      mkBreakdown(
        [{ sku: "hibiscus-powder", qty: 8 }, { sku: "hibiscus-flower", qty: 3 }, { sku: "hibiscus-teabag", qty: 4 }],
        4040, 2000, 0
      ), 35, 14, "Great Monday. Restocked powder display, huge uptick in sales.", null,
      "2026-02-10T13:55:00.000Z"
    ),
    mkReport("r004", "e001", "2026-02-13",
      mkBreakdown(
        [{ sku: "hibiscus-teabag", qty: 7 }, { sku: "hibiscus-teacut", qty: 5 }],
        1900, 2000, 0
      ), 20, 9, "Valentines shoppers. Tea bags popular as gifts.", null,
      "2026-02-13T14:00:00.000Z"
    ),
    mkReport("r005", "e001", "2026-02-18",
      mkBreakdown(
        [{ sku: "hibiscus-powder", qty: 5 }, { sku: "hibiscus-teacut", qty: 7 }],
        2050, 1700, 0
      ), 26, 11, "Steady midweek. Powder running low, need restock.", null,
      "2026-02-18T16:20:00.000Z"
    ),
    mkReport("r006", "e001", "2026-02-20",
      mkBreakdown(
        [{ sku: "hibiscus-flower", qty: 6 }, { sku: "hibiscus-teabag", qty: 6 }],
        2880, 0, 0
      ), 30, 13, "Friday rush. Flower product getting good interest.", null,
      "2026-02-20T15:45:00.000Z"
    ),
    mkReport("r007", "e001", "2026-02-24",
      mkBreakdown(
        [{ sku: "hibiscus-powder", qty: 9 }, { sku: "hibiscus-teabag", qty: 3 }],
        2550, 2100, 0
      ), 32, 12, "Good week start. Manager visited and gave positive feedback.", null,
      "2026-02-24T14:10:00.000Z"
    ),
    mkReport("r008", "e001", "2026-02-27",
      mkBreakdown(
        [{ sku: "hibiscus-powder", qty: 7 }, { sku: "hibiscus-flower", qty: 4 }, { sku: "hibiscus-teacut", qty: 4 }],
        3370, 1430, 0
      ), 29, 10, "End of Feb. Good close to the month.", null,
      "2026-02-27T15:30:00.000Z"
    ),

    // ── MARCH 2026 – Grace ─────────────────────────────────────────────────
    mkReport("r009", "e001", "2026-03-02",
      mkBreakdown(
        [{ sku: "hibiscus-powder", qty: 10 }, { sku: "hibiscus-teabag", qty: 6 }],
        4700, 1500, 0
      ), 38, 15, "Strong March start. New signage on display.", null,
      "2026-03-02T14:00:00.000Z"
    ),
    mkReport("r010", "e001", "2026-03-05",
      mkBreakdown(
        [{ sku: "hibiscus-flower", qty: 5 }, { sku: "hibiscus-teacut", qty: 8 }],
        3400, 600, 0
      ), 27, 11, "Consistent midweek numbers. Tea cut popular.", null,
      "2026-03-05T15:00:00.000Z"
    ),
    mkReport("r011", "e001", "2026-03-09",
      mkBreakdown(
        [{ sku: "hibiscus-powder", qty: 8 }, { sku: "hibiscus-flower", qty: 5 }, { sku: "hibiscus-teabag", qty: 5 }],
        5050, 950, 0
      ), 40, 16, "Best day in March so far. Powder + flower combo pack idea raised.", null,
      "2026-03-09T13:30:00.000Z"
    ),
    mkReport("r012", "e001", "2026-03-11",
      mkBreakdown(
        [{ sku: "hibiscus-teabag", qty: 9 }, { sku: "hibiscus-teacut", qty: 6 }],
        2400, 1500, 0
      ), 33, 14, "Tea category dominated today. Customers asking for variety packs.", null,
      "2026-03-11T14:40:00.000Z"
    ),
    mkReport("r013", "e001", "2026-03-14",
      mkBreakdown(
        [{ sku: "hibiscus-powder", qty: 6 }, { sku: "hibiscus-teacut", qty: 7 }],
        3850, 0, 0
      ), 24, 9, "Saturday — shorter shift but good conversion rate.", null,
      "2026-03-14T12:00:00.000Z"
    ),
    mkReport("r014", "e001", "2026-03-17",
      mkBreakdown(
        [{ sku: "hibiscus-powder", qty: 11 }, { sku: "hibiscus-flower", qty: 4 }],
        4970, 0, 0
      ), 36, 13, "Best powder day. Customer re-order from last week.", null,
      "2026-03-17T14:50:00.000Z"
    ),
    mkReport("r015", "e001", "2026-03-20",
      mkBreakdown(
        [{ sku: "hibiscus-teabag", qty: 8 }, { sku: "hibiscus-flower", qty: 6 }, { sku: "hibiscus-teacut", qty: 4 }],
        3880, 880, 0
      ), 31, 12, "Good Thursday. Multi-product day.", null,
      "2026-03-20T15:20:00.000Z"
    ),
    mkReport("r016", "e001", "2026-03-24",
      mkBreakdown(
        [{ sku: "hibiscus-powder", qty: 9 }, { sku: "hibiscus-teabag", qty: 5 }],
        4150, 1000, 0
      ), 34, 13, "Consistent. Powder remains top seller.", null,
      "2026-03-24T14:00:00.000Z"
    ),
    mkReport("r017", "e001", "2026-03-27",
      mkBreakdown(
        [{ sku: "hibiscus-flower", qty: 7 }, { sku: "hibiscus-teacut", qty: 8 }],
        3960, 0, 0
      ), 29, 11, "Flower gaining traction this week.", null,
      "2026-03-27T15:00:00.000Z"
    ),
    mkReport("r018", "e001", "2026-03-31",
      mkBreakdown(
        [{ sku: "hibiscus-powder", qty: 10 }, { sku: "hibiscus-teabag", qty: 7 }, { sku: "hibiscus-teacut", qty: 5 }],
        5350, 1150, 0
      ), 41, 17, "Month-end strong close. Exceeded March target!", null,
      "2026-03-31T14:30:00.000Z"
    ),

    // ── MARCH 2026 – Test User (e002) ──────────────────────────────────────
    mkReport("r019", "e002", "2026-03-03",
      mkBreakdown(
        [{ sku: "hibiscus-teabag", qty: 5 }, { sku: "hibiscus-powder", qty: 4 }],
        2250, 1000, 0
      ), 20, 8, "First full week. Learning product pitches.", null,
      "2026-03-03T15:00:00.000Z"
    ),
    mkReport("r020", "e002", "2026-03-06",
      mkBreakdown(
        [{ sku: "hibiscus-flower", qty: 3 }, { sku: "hibiscus-teacut", qty: 5 }],
        2090, 0, 0
      ), 18, 7, "Steady Friday. Customers curious about Hibiscus Flower.", null,
      "2026-03-06T15:30:00.000Z"
    ),
    mkReport("r021", "e002", "2026-03-10",
      mkBreakdown(
        [{ sku: "hibiscus-powder", qty: 6 }, { sku: "hibiscus-teabag", qty: 5 }],
        3100, 1000, 0
      ), 24, 10, "Improving weekly totals.", null,
      "2026-03-10T14:45:00.000Z"
    ),
    mkReport("r022", "e002", "2026-03-13",
      mkBreakdown(
        [{ sku: "hibiscus-teabag", qty: 7 }, { sku: "hibiscus-teacut", qty: 4 }],
        2400, 600, 0
      ), 22, 9, "Tea bags moving quickly on Fridays.", null,
      "2026-03-13T15:10:00.000Z"
    ),
    mkReport("r023", "e002", "2026-03-17",
      mkBreakdown(
        [{ sku: "hibiscus-powder", qty: 5 }, { sku: "hibiscus-flower", qty: 4 }],
        2870, 0, 0
      ), 19, 8, "Good Monday. Customers returning.", null,
      "2026-03-17T14:00:00.000Z"
    ),
    mkReport("r024", "e002", "2026-03-20",
      mkBreakdown(
        [{ sku: "hibiscus-teacut", qty: 6 }, { sku: "hibiscus-teabag", qty: 6 }],
        2700, 900, 0
      ), 25, 10, "Equal split between tea products today.", null,
      "2026-03-20T15:40:00.000Z"
    ),
    mkReport("r025", "e002", "2026-03-25",
      mkBreakdown(
        [{ sku: "hibiscus-powder", qty: 7 }, { sku: "hibiscus-teabag", qty: 5 }],
        3450, 0, 0
      ), 27, 11, "Strong end to March. Getting comfortable with pitches.", null,
      "2026-03-25T14:30:00.000Z"
    ),
    mkReport("r026", "e002", "2026-03-28",
      mkBreakdown(
        [{ sku: "hibiscus-flower", qty: 5 }, { sku: "hibiscus-teacut", qty: 7 }],
        3150, 250, 0
      ), 23, 9, "Good close to March. Flower picked up.", null,
      "2026-03-28T15:00:00.000Z"
    ),

    // ── APRIL 2026 – Grace (up to Apr 5) ───────────────────────────────────
    mkReport("r027", "e001", "2026-04-01",
      mkBreakdown(
        [{ sku: "hibiscus-powder", qty: 9 }, { sku: "hibiscus-teabag", qty: 7 }],
        4550, 1050, 0
      ), 37, 14, "Strong April start! Customers welcomed the new month deals.", null,
      "2026-04-01T14:30:00.000Z"
    ),
    mkReport("r028", "e001", "2026-04-02",
      mkBreakdown(
        [{ sku: "hibiscus-flower", qty: 6 }, { sku: "hibiscus-teacut", qty: 7 }],
        3430, 1320, 0
      ), 31, 12, "Wednesday momentum.", null,
      "2026-04-02T15:00:00.000Z"
    ),
    mkReport("r029", "e001", "2026-04-03",
      mkBreakdown(
        [{ sku: "hibiscus-powder", qty: 10 }, { sku: "hibiscus-teabag", qty: 6 }, { sku: "hibiscus-flower", qty: 3 }],
        5384, 1416, 0
      ), 39, 16, "Best Thursday so far. Powder flying off shelf.", null,
      "2026-04-03T14:15:00.000Z"
    ),
    mkReport("r030", "e001", "2026-04-04",
      mkBreakdown(
        [{ sku: "hibiscus-teacut", qty: 8 }, { sku: "hibiscus-teabag", qty: 7 }],
        3600, 1400, 0
      ), 33, 13, "Friday steady. Weekend stock-up buyers active.", null,
      "2026-04-04T15:30:00.000Z"
    ),
    mkReport("r031", "e001", "2026-04-05",
      mkBreakdown(
        [{ sku: "hibiscus-powder", qty: 8 }, { sku: "hibiscus-flower", qty: 5 }],
        4200, 2600, 0  // includes some Mpesa
      ), 28, 10, "Saturday morning rush. Good sampler conversion.", null,
      "2026-04-05T12:45:00.000Z"
    ),

    // ── APRIL 2026 – Test User (up to Apr 4) ───────────────────────────────
    mkReport("r032", "e002", "2026-04-01",
      mkBreakdown(
        [{ sku: "hibiscus-teabag", qty: 6 }, { sku: "hibiscus-powder", qty: 5 }],
        2950, 800, 0
      ), 22, 9, "Solid April start.", null,
      "2026-04-01T15:00:00.000Z"
    ),
    mkReport("r033", "e002", "2026-04-02",
      mkBreakdown(
        [{ sku: "hibiscus-teacut", qty: 5 }, { sku: "hibiscus-flower", qty: 4 }],
        2370, 750, 0
      ), 19, 8, "Good mix of products today.", null,
      "2026-04-02T14:50:00.000Z"
    ),
    mkReport("r034", "e002", "2026-04-03",
      mkBreakdown(
        [{ sku: "hibiscus-powder", qty: 7 }, { sku: "hibiscus-teabag", qty: 6 }],
        3650, 0, 0
      ), 26, 11, "Good Thursday numbers for the team.", null,
      "2026-04-03T15:20:00.000Z"
    ),
    mkReport("r035", "e002", "2026-04-04",
      mkBreakdown(
        [{ sku: "hibiscus-teacut", qty: 6 }, { sku: "hibiscus-flower", qty: 5 }],
        2900, 600, 0
      ), 21, 8, "Friday wrap-up. Decent conversion rate.", null,
      "2026-04-04T15:45:00.000Z"
    ),
  ],

  // ── CHECK-INS ─────────────────────────────────────────────────────────────
  checkins: [
    {
      id: "c001",
      employeeId: "e001",
      coords: { latitude: -1.3205, longitude: 36.7678, accuracy: 10 },
      locationName: ZUCCHINI_LANGATA.name,
      checkInTime: "2026-04-05T05:00:00.000Z",   // 08:00 EAT
      checkOutTime: "2026-04-05T14:00:00.000Z",   // 17:00 EAT
      status: "checked-out",
      date: "2026-04-05",
      withinRadius: true,
    },
    {
      id: "c002",
      employeeId: "e002",
      coords: { latitude: -1.310428, longitude: 36.81778, accuracy: 15 },
      locationName: "T-Mall Langata",
      checkInTime: "2026-04-04T05:15:00.000Z",
      checkOutTime: "2026-04-04T14:05:00.000Z",
      status: "checked-out",
      date: "2026-04-04",
      withinRadius: true,
    },
  ],

  // ── PAYROLL ───────────────────────────────────────────────────────────────
  payroll: [
    {
      id: "p001",
      employeeId: "e001",
      period: { month: "Feb", year: "2026", label: "Feb 2026" },
      baseSalary: 25000,
      bonuses: { salesBonus: 4800, performanceBonus: 1000 },
      allowances: [
        { label: "Transport", amount: 1500 },
        { label: "Airtime",   amount: 600  },
      ],
      deductions: [
        { label: "NHIF", amount: 1700 },
        { label: "NSSF", amount: 1080 },
        { label: "PAYE", amount: 2500 },
      ],
      attendance: { daysWorked: 8, totalDays: 20 },
      status: "paid",
      generatedAt: "2026-03-01T08:00:00.000Z",
      paidAt:      "2026-03-05T09:00:00.000Z",
      notes: "Feb 2026 — 8 days worked.",
    },
    {
      id: "p002",
      employeeId: "e001",
      period: { month: "Mar", year: "2026", label: "Mar 2026" },
      baseSalary: 25000,
      bonuses: { salesBonus: 6200, performanceBonus: 1500 },
      allowances: [
        { label: "Transport", amount: 1500 },
        { label: "Airtime",   amount: 600  },
      ],
      deductions: [
        { label: "NHIF", amount: 1700 },
        { label: "NSSF", amount: 1080 },
        { label: "PAYE", amount: 2500 },
      ],
      attendance: { daysWorked: 10, totalDays: 22 },
      status: "paid",
      generatedAt: "2026-04-01T08:00:00.000Z",
      paidAt:      "2026-04-03T09:00:00.000Z",
      notes: "Mar 2026 — 10 days worked. Exceeded target.",
    },
    {
      id: "p003",
      employeeId: "e002",
      period: { month: "Mar", year: "2026", label: "Mar 2026" },
      baseSalary: 22000,
      bonuses: { salesBonus: 3500, performanceBonus: 500 },
      allowances: [
        { label: "Transport", amount: 1500 },
        { label: "Airtime",   amount: 600  },
      ],
      deductions: [
        { label: "NHIF", amount: 1700 },
        { label: "NSSF", amount: 1080 },
        { label: "PAYE", amount: 2200 },
      ],
      attendance: { daysWorked: 8, totalDays: 22 },
      status: "paid",
      generatedAt: "2026-04-01T08:00:00.000Z",
      paidAt:      "2026-04-03T09:00:00.000Z",
      notes: "Mar 2026 — 8 days worked. First full month.",
    },
    {
      id: "p004",
      employeeId: "e001",
      period: { month: "Apr", year: "2026", label: "Apr 2026" },
      baseSalary: 25000,
      bonuses: { salesBonus: 0, performanceBonus: 0 },
      allowances: [
        { label: "Transport", amount: 1500 },
        { label: "Airtime",   amount: 600  },
      ],
      deductions: [
        { label: "NHIF", amount: 1700 },
        { label: "NSSF", amount: 1080 },
        { label: "PAYE", amount: 2500 },
      ],
      attendance: { daysWorked: 5, totalDays: 22 },
      status: "draft",
      generatedAt: "2026-04-06T08:00:00.000Z",
      paidAt:      null,
      notes: "Apr 2026 — in progress.",
    },
    {
      id: "p005",
      employeeId: "e002",
      period: { month: "Apr", year: "2026", label: "Apr 2026" },
      baseSalary: 22000,
      bonuses: { salesBonus: 0, performanceBonus: 0 },
      allowances: [
        { label: "Transport", amount: 1500 },
        { label: "Airtime",   amount: 600  },
      ],
      deductions: [
        { label: "NHIF", amount: 1700 },
        { label: "NSSF", amount: 1080 },
        { label: "PAYE", amount: 2200 },
      ],
      attendance: { daysWorked: 4, totalDays: 22 },
      status: "draft",
      generatedAt: "2026-04-06T08:00:00.000Z",
      paidAt:      null,
      notes: "Apr 2026 — in progress.",
    },
  ],
};