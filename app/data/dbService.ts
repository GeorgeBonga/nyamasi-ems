/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  NYAMASI FEMS — SUPABASE SERVICE LAYER  (supabaseService.ts)
 *
 *  Drop-in replacement for dbService.ts.
 *  Every function signature is identical — your screens need zero changes.
 *
 *  Setup:
 *    1. npm install @supabase/supabase-js
 *    2. Copy your project URL + anon key from Supabase → Settings → API
 *    3. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

// ─── Client init ─────────────────────────────────────────────────────────────

const SUPABASE_URL = "https://zagvjjxmwgldkepisoga.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphZ3Zqanhtd2dsZGtlcGlzb2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NzI5MDIsImV4cCI6MjA5MjI0ODkwMn0.x_RvgV52Hh2cziaC81BGCa3zALbhZRnoZFfmgARiGRU";

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage: ExpoSecureStoreAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Types (identical to mockDB types) ────────────────────────────────────────

export type UserRole = "admin" | "employee";
export type EmpRole = "sales_rep" | "supervisor" | "manager";
export type EmpStatus = "active" | "inactive" | "suspended";
export type PayStatus = "draft" | "pending" | "paid";
export type ProductSKU =
  | "hibiscus-powder"
  | "hibiscus-flower"
  | "hibiscus-teabag"
  | "hibiscus-teacut";

export interface Product {
  sku: ProductSKU;
  name: string;
  unitPrice: number;
}

export interface ProductLineItem {
  sku: ProductSKU;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface SalesBreakdown {
  items: ProductLineItem[];
  totalItems: number;
  totalAmount: number;
  cash: number;
  mpesa: number;
  debt: number;
}

export interface AssignedLocation {
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface User {
  id: string;
  phone: string;
  password: string;
  role: UserRole;
  employeeId?: string;
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
  assignedLocation: AssignedLocation;
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
  date: string;
  dateISO: string;
  dayName: string;
  shortDate: string;
  salesBreakdown: SalesBreakdown;
  sales: number;
  totalSalesKES: number;
  customersReached: number;
  samplersGiven: number;
  notes: string;
  location: string;
  coords: { latitude: number; longitude: number } | null;
  photoUri: string | null;
  submitted: boolean;
  submittedAt: string | null;
  lateFlag: boolean;
  approved: boolean;
  flagged: boolean;
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
  withinRadius: boolean;
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

// ─── Products constant ────────────────────────────────────────────────────────

export const PRODUCTS: Product[] = [
  { sku: "hibiscus-powder", name: "Hibiscus Powder", unitPrice: 1000 },
  { sku: "hibiscus-flower", name: "Hibiscus Flower", unitPrice: 650 },
  { sku: "hibiscus-teabag", name: "Hibiscus Tea Bag", unitPrice: 650 },
  { sku: "hibiscus-teacut", name: "Hibiscus Tea Cut", unitPrice: 850 },
];

// ─── Utility helpers ──────────────────────────────────────────────────────────

const todayISO = (): string => new Date().toISOString().split("T")[0];

const delay = (ms = 0) => new Promise<void>((r) => setTimeout(r, ms));

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

export const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const isLateSubmission = (): boolean => {
  const nowUTC = new Date();
  const eatHour = (nowUTC.getUTCHours() + 3) % 24;
  return eatHour >= 19;
};

// Helper to get last day of month
const getLastDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

// ─── Row mappers (DB snake_case → app camelCase) ──────────────────────────────

function mapEmployee(row: any): Employee {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: row.full_name,
    initials: row.initials,
    role: row.role,
    department: row.department,
    phone: row.phone,
    email: row.email,
    status: row.status,
    online: row.online,
    assignedArea: row.assigned_area,
    assignedLocation: {
      name: row.assigned_location_name,
      latitude: parseFloat(row.assigned_location_lat),
      longitude: parseFloat(row.assigned_location_lng),
      radiusMeters: row.assigned_location_radius_m,
    },
    lastKnownLocation: {
      latitude: parseFloat(row.last_known_lat ?? row.assigned_location_lat),
      longitude: parseFloat(row.last_known_lng ?? row.assigned_location_lng),
      name: row.last_known_name ?? row.assigned_location_name,
      timestamp: row.last_known_at ?? row.created_at,
    },
    salary: { base: row.base_salary, currency: "KES" },
    targets: { daily: row.daily_target, monthly: row.monthly_target },
    rating: parseFloat(row.rating),
    joinDate: new Date(row.join_date_iso).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    joinDateISO: row.join_date_iso,
    createdAt: row.created_at,
    createdBy: row.created_by ?? "",
    lastPasswordUpdate: row.last_password_update,
  };
}

function mapReport(row: any, lineItems: any[] = []): Report {
  const items: ProductLineItem[] = lineItems.map((li) => ({
    sku: li.sku,
    qty: li.qty,
    unitPrice: li.unit_price,
    subtotal: li.subtotal,
  }));

  const breakdown: SalesBreakdown = {
    items,
    totalItems: row.total_items,
    totalAmount: row.total_amount_kes,
    cash: row.cash,
    mpesa: row.mpesa,
    debt: row.debt,
  };

  return {
    id: row.id,
    employeeId: row.employee_id,
    date: isoToDisplay(row.date_iso),
    dateISO: row.date_iso,
    dayName: isoToDayName(row.date_iso),
    shortDate: isoToShort(row.date_iso),
    salesBreakdown: breakdown,
    sales: row.total_items,
    totalSalesKES: row.total_amount_kes,
    customersReached: row.customers_reached,
    samplersGiven: row.samplers_given,
    notes: row.notes,
    location: row.location,
    coords: row.coords_lat
      ? { latitude: parseFloat(row.coords_lat), longitude: parseFloat(row.coords_lng) }
      : null,
    photoUri: row.photo_uri,
    submitted: row.submitted,
    submittedAt: row.submitted_at,
    lateFlag: row.late_flag,
    approved: row.approved,
    flagged: row.flagged,
    createdAt: row.created_at,
  };
}

function mapCheckin(row: any): CheckIn {
  return {
    id: row.id,
    employeeId: row.employee_id,
    coords: {
      latitude: parseFloat(row.coords_lat),
      longitude: parseFloat(row.coords_lng),
      accuracy: parseFloat(row.coords_accuracy ?? 0),
    },
    locationName: row.location_name,
    checkInTime: row.check_in_time,
    checkOutTime: row.check_out_time,
    status: row.status,
    date: row.date,
    withinRadius: row.within_radius,
  };
}

async function hydratePayroll(row: any): Promise<PayrollRecord> {
  const [{ data: allowances }, { data: deductions }] = await Promise.all([
    supabase.from("payroll_allowances").select("*").eq("payroll_id", row.id),
    supabase.from("payroll_deductions").select("*").eq("payroll_id", row.id),
  ]);
  return {
    id: row.id,
    employeeId: row.employee_id,
    period: { month: row.period_month, year: row.period_year, label: row.period_label },
    baseSalary: row.base_salary,
    bonuses: { salesBonus: row.sales_bonus, performanceBonus: row.perf_bonus },
    allowances: (allowances ?? []).map((a: any) => ({ label: a.label, amount: a.amount })),
    deductions: (deductions ?? []).map((d: any) => ({ label: d.label, amount: d.amount })),
    attendance: { daysWorked: row.days_worked, totalDays: row.total_days },
    status: row.status,
    generatedAt: row.generated_at,
    paidAt: row.paid_at,
    notes: row.notes,
  };
}

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

  const { data, error } = await supabase.rpc("login_with_phone", {
    p_phone: phone,
    p_password: password,
  });

  if (error || !data?.success) {
    return {
      success: false,
      user: null,
      employee: null,
      error: data?.error ?? "Invalid credentials",
    };
  }

  const u = data.user;
  const e = data.employee;

  const user: User = {
    id: u.id,
    phone: u.phone,
    password: "",
    role: u.role,
    employeeId: u.employee_id ?? undefined,
    active: u.active,
    createdAt: u.created_at,
  };

  const employee = e ? mapEmployee(e) : null;

  return { success: true, user, employee };
};

export const logout = async (): Promise<void> => {
  await supabase.auth.signOut();
};

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION B: EMPLOYEES
// ─────────────────────────────────────────────────────────────────────────────

export const getEmployees = async (statusFilter?: EmpStatus): Promise<Employee[]> => {
  await delay();
  let q = supabase.from("employees").select("*").order("full_name");
  if (statusFilter) q = q.eq("status", statusFilter);
  const { data, error } = await q;
  if (error) throw error;
  const list = (data ?? []).map(mapEmployee);
  return list.sort((a, b) => a.fullName.localeCompare(b.fullName));
};

export const getEmployeeById = async (id: string): Promise<Employee | null> => {
  await delay();
  const { data } = await supabase.from("employees").select("*").eq("id", id).single();
  return data ? mapEmployee(data) : null;
};

export const getOnlineEmployees = async (): Promise<Employee[]> => {
  await delay();
  const { data } = await supabase
    .from("employees")
    .select("*")
    .eq("online", true)
    .eq("status", "active");
  return (data ?? []).map(mapEmployee);
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

// export const createEmployee = async (
//   input: CreateEmployeeInput
// ): Promise<{ employee: Employee; user: User }> => {
//   await delay(300);

//   const fullName = `${input.firstName} ${input.lastName}`;
//   const now = new Date().toISOString();

//   const { count } = await supabase.from("employees").select("*", { count: "exact", head: true });
//   const empId = `e${String((count ?? 0) + 1).padStart(3, "0")}`;
//   const initials = toInitials(fullName);

//   const empRow = {
//     id: empId,
//     first_name: input.firstName,
//     last_name: input.lastName,
//     full_name: fullName,
//     initials,
//     role: input.role,
//     department: input.department ?? "Field Sales",
//     phone: input.phone,
//     email: input.email,
//     status: "active" as EmpStatus,
//     online: false,
//     assigned_area: input.assignedArea,
//     assigned_location_name: input.assignedLocationName,
//     assigned_location_lat: input.assignedLocationLat,
//     assigned_location_lng: input.assignedLocationLng,
//     assigned_location_radius_m: input.assignedLocationRadius ?? 500,
//     last_known_lat: input.assignedLocationLat,
//     last_known_lng: input.assignedLocationLng,
//     last_known_name: input.assignedLocationName,
//     last_known_at: now,
//     base_salary: input.baseSalary,
//     daily_target: input.dailyTarget,
//     monthly_target: input.monthlyTarget,
//     rating: 0,
//     join_date_iso: now.split("T")[0],
//     created_at: now,
//     created_by: input.createdBy,
//   };

//   const { data: empData, error: empErr } = await supabase
//     .from("employees")
//     .insert(empRow)
//     .select()
//     .single();
//   if (empErr) throw empErr;

//   const { data: userData, error: userErr } = await supabase
//     .from("app_users")
//     .insert({
//       phone: input.phone,
//       password_hash: input.password,
//       role: "employee",
//       employee_id: empId,
//       active: true,
//       created_at: now,
//     })
//     .select()
//     .single();
//   if (userErr) throw userErr;

//   const employee = mapEmployee(empData);
//   const user: User = {
//     id: userData.id,
//     phone: userData.phone,
//     password: input.password,
//     role: userData.role,
//     employeeId: empId,
//     active: userData.active,
//     createdAt: userData.created_at,
//   };

//   return { employee, user };
// };
export const createEmployee = async (
  input: CreateEmployeeInput
): Promise<{ employee: Employee; user: User }> => {
  await delay(300);

  const fullName = `${input.firstName} ${input.lastName}`;
  const now = new Date().toISOString();

  console.log('🔵 Creating employee:', { name: fullName, phone: input.phone });

  // Generate ID
  const { count, error: countError } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true });
    
  if (countError) {
    console.error('❌ Count error:', countError);
    throw new Error(`Count failed: ${countError.message}`);
  }
  
  const empId = `e${String((count ?? 0) + 1).padStart(3, "0")}`;
  const initials = toInitials(fullName);

  console.log('🟢 Generated ID:', empId);

  const empRow = {
    id: empId,
    first_name: input.firstName,
    last_name: input.lastName,
    // full_name: fullName,
    initials,
    role: input.role,
    department: input.department ?? "Field Sales",
    phone: input.phone,
    email: input.email,
    status: "active" as EmpStatus,
    online: false,
    assigned_area: input.assignedArea,
    assigned_location_name: input.assignedLocationName,
    assigned_location_lat: input.assignedLocationLat,
    assigned_location_lng: input.assignedLocationLng,
    assigned_location_radius_m: input.assignedLocationRadius ?? 500,
    last_known_lat: input.assignedLocationLat,
    last_known_lng: input.assignedLocationLng,
    last_known_name: input.assignedLocationName,
    last_known_at: now,
    base_salary: input.baseSalary,
    daily_target: input.dailyTarget,
    monthly_target: input.monthlyTarget,
    rating: 0,
    join_date_iso: now.split("T")[0],
    created_at: now,
    created_by: input.createdBy,
  };

  console.log('📝 Inserting employee row...');

  const { data: empData, error: empErr } = await supabase
    .from("employees")
    .insert(empRow)
    .select()
    .single();
    
  if (empErr) {
    console.error('❌ Employee insert error:', {
      code: empErr.code,
      message: empErr.message,
      details: empErr.details,
      hint: empErr.hint
    });
    throw new Error(`Employee insert failed: ${empErr.message}`);
  }

  console.log('✅ Employee inserted:', empData.id);

  // Create app_user row
  console.log('📝 Inserting app_user row...');
  
  const { data: userData, error: userErr } = await supabase
    .from("app_users")
    .insert({
      phone: input.phone,
      password_hash: input.password,
      role: "employee",
      employee_id: empId,
      active: true,
      created_at: now,
    })
    .select()
    .single();
    
  if (userErr) {
    console.error('❌ App user insert error:', {
      code: userErr.code,
      message: userErr.message,
      details: userErr.details,
      hint: userErr.hint
    });
    
    // Try to rollback employee insert
    await supabase.from("employees").delete().eq("id", empId);
    throw new Error(`User insert failed: ${userErr.message}`);
  }

  console.log('✅ App user inserted:', userData.id);

  const employee = mapEmployee(empData);
  const user: User = {
    id: userData.id,
    phone: userData.phone,
    password: input.password,
    role: userData.role,
    employeeId: empId,
    active: userData.active,
    createdAt: userData.created_at,
  };

  console.log('🎉 Employee created successfully!');
  return { employee, user };
};
export const updateEmployee = async (
  id: string,
  updates: Partial<{
    firstName: string;
    lastName: string;
    role: EmpRole;
    phone: string;
    email: string;
    assignedArea: string;
    status: EmpStatus;
    rating: number;
    online: boolean;
    baseSalary: number;
    dailyTarget: number;
    monthlyTarget: number;
    password: string;
  }>
): Promise<Employee | null> => {
  await delay(200);

  const patch: Record<string, any> = {};
  if (updates.firstName !== undefined) patch.first_name = updates.firstName;
  if (updates.lastName !== undefined) patch.last_name = updates.lastName;
  if (updates.role !== undefined) patch.role = updates.role;
  if (updates.phone !== undefined) patch.phone = updates.phone;
  if (updates.email !== undefined) patch.email = updates.email;
  if (updates.assignedArea !== undefined) patch.assigned_area = updates.assignedArea;
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.rating !== undefined) patch.rating = updates.rating;
  if (updates.online !== undefined) patch.online = updates.online;
  if (updates.baseSalary !== undefined) patch.base_salary = updates.baseSalary;
  if (updates.dailyTarget !== undefined) patch.daily_target = updates.dailyTarget;
  if (updates.monthlyTarget !== undefined) patch.monthly_target = updates.monthlyTarget;

  if (updates.firstName !== undefined || updates.lastName !== undefined) {
    const cur = await getEmployeeById(id);
    const fn = updates.firstName ?? cur?.firstName ?? "";
    const ln = updates.lastName ?? cur?.lastName ?? "";
    // patch.full_name = `${fn} ${ln}`;
    patch.initials = toInitials(patch.full_name);
  }

  if (updates.password !== undefined && updates.password.length >= 6) {
    patch.last_password_update = new Date().toISOString();
    await supabase.rpc("update_employee_password", {
      p_employee_id: id,
      p_new_password: updates.password,
    });
  }

  const { data, error } = await supabase
    .from("employees")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data ? mapEmployee(data) : null;
};

export const updateEmployeeWithPassword = updateEmployee;

export const deactivateEmployee = async (id: string): Promise<boolean> => {
  await delay(200);
  const { error } = await supabase
    .from("employees")
    .update({ status: "inactive", online: false })
    .eq("id", id);
  if (!error) {
    await supabase.from("app_users").update({ active: false }).eq("employee_id", id);
  }
  return !error;
};

export const activateEmployee = async (id: string): Promise<boolean> => {
  await delay(200);
  const { error } = await supabase
    .from("employees")
    .update({ status: "active" })
    .eq("id", id);
  if (!error) {
    await supabase.from("app_users").update({ active: true }).eq("employee_id", id);
  }
  return !error;
};

export const canUpdatePassword = async (
  employeeId: string
): Promise<{ canUpdate: boolean; daysRemaining: number; lastUpdate: string | null }> => {
  await delay();
  const { data } = await supabase
    .from("employees")
    .select("last_password_update")
    .eq("id", employeeId)
    .single();

  if (!data?.last_password_update) {
    return { canUpdate: true, daysRemaining: 0, lastUpdate: null };
  }

  const lastUpdate = new Date(data.last_password_update);
  const now = new Date();
  const daysSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
  const canUpdate = daysSinceUpdate >= 30;
  const daysRemaining = canUpdate ? 0 : 30 - daysSinceUpdate;

  return { canUpdate, daysRemaining, lastUpdate: data.last_password_update };
};

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION C: REPORTS
// ─────────────────────────────────────────────────────────────────────────────

async function fetchReportsWithLineItems(query: any): Promise<Report[]> {
  const { data: rows, error } = await query;
  if (error) throw error;
  if (!rows?.length) return [];

  const ids = rows.map((r: any) => r.id);
  const { data: lineItems } = await supabase
    .from("report_line_items")
    .select("*")
    .in("report_id", ids);

  const liMap: Record<string, any[]> = {};
  for (const li of lineItems ?? []) {
    (liMap[li.report_id] ??= []).push(li);
  }

  return rows.map((r: any) => mapReport(r, liMap[r.id] ?? []));
}

export const getAllReports = async (): Promise<Report[]> => {
  await delay();
  const reports = await fetchReportsWithLineItems(
    supabase.from("reports").select("*").order("date_iso", { ascending: false })
  );
  return [...reports].sort((a, b) => b.dateISO.localeCompare(a.dateISO));
};

export const getReportsByEmployee = async (employeeId: string): Promise<Report[]> => {
  await delay();
  const reports = await fetchReportsWithLineItems(
    supabase
      .from("reports")
      .select("*")
      .eq("employee_id", employeeId)
      .order("date_iso", { ascending: false })
  );
  return reports.sort((a, b) => b.dateISO.localeCompare(a.dateISO));
};

export const getReportsByDate = async (dateISO: string): Promise<Report[]> => {
  await delay();
  return fetchReportsWithLineItems(
    supabase.from("reports").select("*").eq("date_iso", dateISO)
  );
};

export const getReportsByDateRange = async (
  fromISO: string,
  toISO: string
): Promise<Report[]> => {
  await delay();
  const reports = await fetchReportsWithLineItems(
    supabase
      .from("reports")
      .select("*")
      .gte("date_iso", fromISO)
      .lte("date_iso", toISO)
      .order("date_iso", { ascending: false })
  );
  return reports.sort((a, b) => b.dateISO.localeCompare(a.dateISO));
};

export interface ProductEntry {
  sku: ProductSKU;
  qty: number;
}

export interface AddReportInput {
  employeeId: string;
  products: ProductEntry[];
  cash: number;
  mpesa: number;
  debt: number;
  customersReached: number;
  samplersGiven: number;
  notes: string;
  location: string;
  coords?: { latitude: number; longitude: number } | null;
  photoUri: string | null;
  dateISO?: string;
}

export interface AddReportResult {
  success: boolean;
  report?: Report;
  error?: string;
}

export const addReport = async (input: AddReportInput): Promise<AddReportResult> => {
  await delay(300);

  // if (!input.photoUri || input.photoUri.trim() === "") {
  //   return { success: false, error: "A sales photo is required before submitting." };
  // }

  const nonZeroProducts = input.products.filter((p) => p.qty > 0);
  if (nonZeroProducts.length === 0) {
    return { success: false, error: "Enter at least one product quantity." };
  }

  const items: ProductLineItem[] = nonZeroProducts.map(({ sku, qty }) => {
    const product = PRODUCTS.find((p) => p.sku === sku)!;
    return { sku, qty, unitPrice: product.unitPrice, subtotal: product.unitPrice * qty };
  });

  const totalItems = items.reduce((s, l) => s + l.qty, 0);
  const totalAmount = items.reduce((s, l) => s + l.subtotal, 0);

  const paymentTotal = input.cash + input.mpesa + input.debt;
  if (paymentTotal !== totalAmount) {
    return {
      success: false,
      error: `Payment mismatch: Cash (${input.cash}) + M-Pesa (${input.mpesa}) + Debt (${input.debt}) = ${paymentTotal} KES but total sales = ${totalAmount} KES.`,
    };
  }

  const lateFlag = isLateSubmission();
  const dateISO = input.dateISO ?? todayISO();
  const now = new Date().toISOString();

  const { data, error } = await supabase.rpc("submit_report", {
    p_employee_id: input.employeeId,
    p_date_iso: dateISO,
    p_products: nonZeroProducts,
    p_cash: input.cash,
    p_mpesa: input.mpesa,
    p_debt: input.debt,
    p_customers: input.customersReached,
    p_samplers: input.samplersGiven,
    p_notes: input.notes,
    p_location: input.location,
    p_coords_lat: input.coords?.latitude ?? null,
    p_coords_lng: input.coords?.longitude ?? null,
    p_photo_uri: input.photoUri,
  });

  if (error) return { success: false, error: error.message };
  if (!data?.success) return { success: false, error: data?.error };

  const report = (await getReportsByEmployee(input.employeeId)).find(
    (r) => r.id === data.reportId
  );

  return { success: true, report };
};

export const approveReport = async (reportId: string): Promise<boolean> => {
  await delay(200);
  const { data } = await supabase.rpc("approve_report", { p_report_id: reportId });
  return !!data;
};

export const flagReport = async (reportId: string, flagged: boolean): Promise<boolean> => {
  await delay(100);
  const { data } = await supabase.rpc("flag_report", {
    p_report_id: reportId,
    p_flagged: flagged,
  });
  return !!data;
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
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ].indexOf(month);
  if (monthIndex === -1) return [];

  const monthNum = String(monthIndex + 1).padStart(2, "0");
  const monthStart = `${year}-${monthNum}-01`;
  const lastDay = getLastDayOfMonth(parseInt(year), monthIndex + 1);
  const monthEnd = `${year}-${monthNum}-${String(lastDay).padStart(2, "0")}`;

  const { data: periodReports } = await supabase
    .from("reports")
    .select("*")
    .gte("date_iso", monthStart)
    .lte("date_iso", monthEnd);

  if (!periodReports?.length) return [];

  const reportIds = periodReports.map((r) => r.id);
  const { data: lineItems } = await supabase
    .from("report_line_items")
    .select("*")
    .in("report_id", reportIds);

  const liMap: Record<string, any[]> = {};
  for (const li of lineItems ?? []) {
    (liMap[li.report_id] ??= []).push(li);
  }

  const employees = await getEmployees();
  const empMap = Object.fromEntries(employees.map((e) => [e.id, e]));

  const results: EmployeeMonthlyAggregate[] = [];

  for (const emp of employees.filter((e) => e.status === "active")) {
    const empReports = periodReports.filter((r) => r.employee_id === emp.id);
    if (!empReports.length) continue;

    let totalSales = 0;
    let totalSalesKES = 0;
    let totalCash = 0;
    let totalMpesa = 0;
    let totalDebt = 0;
    let totalCustomers = 0;
    let totalSamplers = 0;

    for (const r of empReports) {
      const items = liMap[r.id] ?? [];
      const reportSales = items.reduce((s, li) => s + li.qty, 0);
      const reportKES = items.reduce((s, li) => s + li.subtotal, 0);
      totalSales += reportSales;
      totalSalesKES += reportKES;
      totalCash += r.cash ?? 0;
      totalMpesa += r.mpesa ?? 0;
      totalDebt += r.debt ?? 0;
      totalCustomers += r.customers_reached ?? 0;
      totalSamplers += r.samplers_given ?? 0;
    }

    const daysReported = empReports.length;
    const avgSalesPerDay = daysReported
      ? parseFloat((totalSales / daysReported).toFixed(1))
      : 0;
    const target = emp.targets.monthly;
    const achievePct = Math.round((totalSales / target) * 100);

    const best = empReports.reduce((b, r) => {
      const items = liMap[r.id] ?? [];
      const sales = items.reduce((s, li) => s + li.qty, 0);
      const bestSales = liMap[b.id]?.reduce((s, li) => s + li.qty, 0) ?? 0;
      return sales > bestSales ? r : b;
    }, empReports[0]);

    const sorted = [...empReports].sort((a, b) => a.date_iso.localeCompare(b.date_iso));
    const mid = Math.floor(daysReported / 2);
    const firstHalfSales = sorted.slice(0, mid).reduce((s, r) => {
      const items = liMap[r.id] ?? [];
      return s + items.reduce((sum, li) => sum + li.qty, 0);
    }, 0);
    const secondHalfSales = sorted.slice(mid).reduce((s, r) => {
      const items = liMap[r.id] ?? [];
      return s + items.reduce((sum, li) => sum + li.qty, 0);
    }, 0);
    const firstAvg = firstHalfSales / (mid || 1);
    const lastAvg = secondHalfSales / (daysReported - mid || 1);
    const trend: "up" | "down" | "flat" =
      lastAvg > firstAvg * 1.05 ? "up"
      : lastAvg < firstAvg * 0.95 ? "down"
      : "flat";

    results.push({
      employee: emp,
      totalSales,
      totalSalesKES,
      totalCash,
      totalMpesa,
      totalDebt,
      totalCustomers,
      totalSamplers,
      daysReported,
      target,
      achievePct,
      avgSalesPerDay,
      trend,
      bestDayISO: best.date_iso,
      bestDayDisplay: isoToShort(best.date_iso),
    });
  }

  return results.filter(Boolean);
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
    years = [year];
  } else {
    const currentYear = new Date().getFullYear();
    years = Array.from({ length: 5 }, (_, i) => String(currentYear - i));
  }

  const employees = await getEmployees();
  const empMap = Object.fromEntries(employees.map((e) => [e.id, e]));
  const results: EmployeeYearlyAggregate[] = [];

  for (const yr of years) {
    // FIXED: Use date range instead of LIKE
    const { data: yearReports } = await supabase
      .from("reports")
      .select("*")
      .gte("date_iso", `${yr}-01-01`)
      .lte("date_iso", `${yr}-12-31`);

    if (!yearReports?.length) continue;

    const reportIds = yearReports.map((r) => r.id);
    const { data: lineItems } = await supabase
      .from("report_line_items")
      .select("*")
      .in("report_id", reportIds);

    const liMap: Record<string, any[]> = {};
    for (const li of lineItems ?? []) {
      (liMap[li.report_id] ??= []).push(li);
    }

    const empReportsMap: Record<string, any[]> = {};
    for (const r of yearReports) {
      (empReportsMap[r.employee_id] ??= []).push(r);
    }

    for (const [empId, empReports] of Object.entries(empReportsMap)) {
      const emp = empMap[empId];
      if (!emp || emp.status !== "active") continue;

      let totalSales = 0;
      let totalSalesKES = 0;
      let totalCash = 0;
      let totalMpesa = 0;
      let totalDebt = 0;
      let totalCustomers = 0;
      let totalSamplers = 0;

      for (const r of empReports) {
        const items = liMap[r.id] ?? [];
        const reportSales = items.reduce((s, li) => s + li.qty, 0);
        const reportKES = items.reduce((s, li) => s + li.subtotal, 0);
        totalSales += reportSales;
        totalSalesKES += reportKES;
        totalCash += r.cash ?? 0;
        totalMpesa += r.mpesa ?? 0;
        totalDebt += r.debt ?? 0;
        totalCustomers += r.customers_reached ?? 0;
        totalSamplers += r.samplers_given ?? 0;
      }

      const monthsSet = new Set(empReports.map((r) => r.date_iso.slice(0, 7)));
      const monthsReported = monthsSet.size;
      const avgSalesPerMonth = monthsReported
        ? parseFloat((totalSales / monthsReported).toFixed(1))
        : 0;
      const target = emp.targets.monthly * 12;
      const achievePct = target ? Math.round((totalSales / target) * 100) : 0;

      const monthMap: Record<string, number> = {};
      empReports.forEach((r) => {
        const m = r.date_iso.slice(0, 7);
        const items = liMap[r.id] ?? [];
        const sales = items.reduce((s, li) => s + li.qty, 0);
        monthMap[m] = (monthMap[m] || 0) + sales;
      });

      const entries = Object.entries(monthMap);
      const [bestMonth] = entries.length
        ? entries.reduce((best, curr) => (curr[1] > best[1] ? curr : best))
        : ["", 0];
      const bestMonthDisplay = bestMonth
        ? new Date(bestMonth + "-01").toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })
        : "";

      const sorted = [...empReports].sort((a, b) => a.date_iso.localeCompare(b.date_iso));
      const mid = Math.floor(sorted.length / 2);
      const firstHalfSales = sorted.slice(0, mid).reduce((s, r) => {
        const items = liMap[r.id] ?? [];
        return s + items.reduce((sum, li) => sum + li.qty, 0);
      }, 0);
      const secondHalfSales = sorted.slice(mid).reduce((s, r) => {
        const items = liMap[r.id] ?? [];
        return s + items.reduce((sum, li) => sum + li.qty, 0);
      }, 0);
      const firstHalfAvg = firstHalfSales / (mid || 1);
      const secondHalfAvg = secondHalfSales / (sorted.length - mid || 1);
      const trend: "up" | "down" | "flat" =
        secondHalfAvg > firstHalfAvg * 1.05 ? "up"
        : secondHalfAvg < firstHalfAvg * 0.95 ? "down"
        : "flat";

      results.push({
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
      });
    }
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

  const { data: rangeReports } = await supabase
    .from("reports")
    .select("*")
    .gte("date_iso", fromISO)
    .lte("date_iso", toISO)
    .eq("submitted", true);

  if (!rangeReports?.length) {
    const activeEmployees = await getEmployees("active");
    return {
      totalSales: 0,
      totalSalesKES: 0,
      totalCash: 0,
      totalMpesa: 0,
      totalDebt: 0,
      totalCustomers: 0,
      totalSamplers: 0,
      totalEmployees: activeEmployees.length,
      onlineEmployees: activeEmployees.filter((e) => e.online).length,
      topPerformer: null,
      conversionRate: 0,
      avgSalesPerEmployee: 0,
    };
  }

  const reportIds = rangeReports.map((r) => r.id);
  const { data: lineItems } = await supabase
    .from("report_line_items")
    .select("*")
    .in("report_id", reportIds);

  const liMap: Record<string, any[]> = {};
  for (const li of lineItems ?? []) {
    (liMap[li.report_id] ??= []).push(li);
  }

  let totalSales = 0;
  let totalSalesKES = 0;
  let totalCash = 0;
  let totalMpesa = 0;
  let totalDebt = 0;
  let totalCustomers = 0;
  let totalSamplers = 0;

  const byEmployee: Record<string, number> = {};

  for (const r of rangeReports) {
    const items = liMap[r.id] ?? [];
    const sales = items.reduce((s, li) => s + li.qty, 0);
    const kes = items.reduce((s, li) => s + li.subtotal, 0);

    totalSales += sales;
    totalSalesKES += kes;
    totalCash += r.cash ?? 0;
    totalMpesa += r.mpesa ?? 0;
    totalDebt += r.debt ?? 0;
    totalCustomers += r.customers_reached ?? 0;
    totalSamplers += r.samplers_given ?? 0;

    byEmployee[r.employee_id] = (byEmployee[r.employee_id] ?? 0) + sales;
  }

  const topEmpId = Object.entries(byEmployee).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const topPerformer = topEmpId ? await getEmployeeById(topEmpId) : null;

  const activeEmployees = await getEmployees("active");
  const onlineEmployees = activeEmployees.filter((e) => e.online).length;
  const participatingCount = Object.keys(byEmployee).length || 1;

  return {
    totalSales,
    totalSalesKES,
    totalCash,
    totalMpesa,
    totalDebt,
    totalCustomers,
    totalSamplers,
    totalEmployees: activeEmployees.length,
    onlineEmployees,
    topPerformer,
    conversionRate: totalSamplers > 0 ? Math.round((totalSales / totalSamplers) * 100) : 0,
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

  const getAggForDate = async (iso: string) => {
    const { data: reports } = await supabase
      .from("reports")
      .select("id, customers_reached, samplers_given")
      .eq("date_iso", iso)
      .eq("submitted", true);

    if (!reports?.length) return { sales: 0, customers: 0, samplers: 0 };

    const reportIds = reports.map((r) => r.id);
    const { data: lineItems } = await supabase
      .from("report_line_items")
      .select("qty")
      .in("report_id", reportIds);

    const sales = (lineItems ?? []).reduce((s, li) => s + li.qty, 0);
    const customers = reports.reduce((s, r) => s + (r.customers_reached ?? 0), 0);
    const samplers = reports.reduce((s, r) => s + (r.samplers_given ?? 0), 0);

    return { sales, customers, samplers };
  };

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

    const results = await Promise.all(days.map(getAggForDate));

    return {
      labels,
      sales: results.map((r) => r.sales),
      customers: results.map((r) => r.customers),
      samplers: results.map((r) => r.samplers),
    };
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

    const results = await Promise.all(days.map(getAggForDate));

    return {
      labels: dayLabels,
      sales: results.map((r) => r.sales),
      customers: results.map((r) => r.customers),
      samplers: results.map((r) => r.samplers),
    };
  }

  if (mode === "weekly") {
    const weeks: string[][] = Array.from({ length: 4 }, (_, wi) =>
      Array.from({ length: 7 }, (_, di) => {
        const d = new Date(anchor);
        d.setDate(d.getDate() - ((3 - wi) * 7 + (6 - di)));
        return d.toISOString().split("T")[0];
      })
    );

    const labels = weeks.map((_, i) => `Wk ${i + 1}`);

    const weekResults = await Promise.all(
      weeks.map(async (wk) => {
        const dailyResults = await Promise.all(wk.map(getAggForDate));
        return {
          sales: dailyResults.reduce((s, r) => s + r.sales, 0),
          customers: dailyResults.reduce((s, r) => s + r.customers, 0),
          samplers: dailyResults.reduce((s, r) => s + r.samplers, 0),
        };
      })
    );

    return {
      labels,
      sales: weekResults.map((w) => w.sales),
      customers: weekResults.map((w) => w.customers),
      samplers: weekResults.map((w) => w.samplers),
    };
  }

  // FIXED: monthly mode using date ranges instead of LIKE
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(anchor);
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return {
      label: d.toLocaleDateString("en-US", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth() + 1,
    };
  });

  const labels = months.map((m) => m.label);

  const monthResults = await Promise.all(
    months.map(async ({ year, month }) => {
      const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = getLastDayOfMonth(year, month);
      const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      const { data: reports } = await supabase
        .from("reports")
        .select("id, customers_reached, samplers_given")
        .gte("date_iso", monthStart)
        .lte("date_iso", monthEnd)
        .eq("submitted", true);

      if (!reports?.length) return { sales: 0, customers: 0, samplers: 0 };

      const reportIds = reports.map((r) => r.id);
      const { data: lineItems } = await supabase
        .from("report_line_items")
        .select("qty")
        .in("report_id", reportIds);

      return {
        sales: (lineItems ?? []).reduce((s, li) => s + li.qty, 0),
        customers: reports.reduce((s, r) => s + (r.customers_reached ?? 0), 0),
        samplers: reports.reduce((s, r) => s + (r.samplers_given ?? 0), 0),
      };
    })
  );

  return {
    labels,
    sales: monthResults.map((m) => m.sales),
    customers: monthResults.map((m) => m.customers),
    samplers: monthResults.map((m) => m.samplers),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION E: CHECK-INS
// ─────────────────────────────────────────────────────────────────────────────

export const getCheckinsByDate = async (dateISO: string): Promise<CheckIn[]> => {
  await delay();
  const { data } = await supabase
    .from("checkins")
    .select("*")
    .eq("date", dateISO)
    .order("check_in_time", { ascending: false });
  return (data ?? []).map(mapCheckin);
};

export const getCheckinsByEmployee = async (employeeId: string): Promise<CheckIn[]> => {
  await delay();
  const { data } = await supabase
    .from("checkins")
    .select("*")
    .eq("employee_id", employeeId)
    .order("check_in_time", { ascending: false });
  return (data ?? []).map(mapCheckin);
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
  distanceMeters?: number;
  error?: string;
}

// export const recordCheckIn = async (input: CheckInInput): Promise<CheckInResult> => {
//   await delay(300);

//   const emp = await getEmployeeById(input.employeeId);
//   if (!emp) return { success: false, error: "Employee not found." };

//   const dist = haversineDistance(
//     input.latitude,
//     input.longitude,
//     emp.assignedLocation.latitude,
//     emp.assignedLocation.longitude
//   );
//   const withinRadius = dist <= emp.assignedLocation.radiusMeters;
//   if (!withinRadius) {
//     return {
//       success: false,
//       distanceMeters: Math.round(dist),
//       error: `You are ${Math.round(dist)} m away from ${emp.assignedLocation.name}. You must be within ${emp.assignedLocation.radiusMeters} m to check in.`,
//     };
//   }

//   const today = todayISO();
//   const existingCheckin = await getTodayCheckin(input.employeeId);
//   if (existingCheckin) {
//     return { success: false, error: "You are already checked in for today." };
//   }

//   const { data, error } = await supabase.rpc("record_checkin", {
//     p_employee_id: input.employeeId,
//     p_lat: input.latitude,
//     p_lng: input.longitude,
//     p_accuracy: input.accuracy,
//     p_location_name: input.locationName,
//   });

//   if (error) return { success: false, error: error.message };
//   if (!data?.success) {
//     return {
//       success: false,
//       distanceMeters: data?.distanceMeters,
//       error: data?.error,
//     };
//   }

//   const { data: row } = await supabase
//     .from("checkins")
//     .select("*")
//     .eq("id", data.checkinId)
//     .single();

//   return { success: true, checkin: row ? mapCheckin(row) : undefined };
// };
export const recordCheckIn = async (input: CheckInInput): Promise<CheckInResult> => {
  await delay(300);

  const emp = await getEmployeeById(input.employeeId);
  if (!emp) return { success: false, error: "Employee not found." };

  const dist = haversineDistance(
    input.latitude,
    input.longitude,
    emp.assignedLocation.latitude,
    emp.assignedLocation.longitude
  );
  const withinRadius = dist <= emp.assignedLocation.radiusMeters;
  if (!withinRadius) {
    return {
      success: false,
      distanceMeters: Math.round(dist),
      error: `You are ${Math.round(dist)} m away from ${emp.assignedLocation.name}. You must be within ${emp.assignedLocation.radiusMeters} m to check in.`,
    };
  }

  const today = todayISO();
  const existingCheckin = await getTodayCheckin(input.employeeId);
  if (existingCheckin) {
    return { success: false, error: "You are already checked in for today." };
  }

  // ✅ UPDATE EMPLOYEE ONLINE STATUS
  await supabase
    .from("employees")
    .update({ 
      online: true,
      last_known_lat: input.latitude,
      last_known_lng: input.longitude,
      last_known_name: input.locationName,
      last_known_at: new Date().toISOString(),
    })
    .eq("id", input.employeeId);

  const { data, error } = await supabase.rpc("record_checkin", {
    p_employee_id: input.employeeId,
    p_lat: input.latitude,
    p_lng: input.longitude,
    p_accuracy: input.accuracy,
    p_location_name: input.locationName,
  });

  if (error) return { success: false, error: error.message };
  if (!data?.success) {
    return { success: false, distanceMeters: data?.distanceMeters, error: data?.error };
  }

  const { data: row } = await supabase
    .from("checkins")
    .select("*")
    .eq("id", data.checkinId)
    .single();

  return { success: true, checkin: row ? mapCheckin(row) : undefined };
};
export const getTodayCheckin = async (employeeId: string): Promise<CheckIn | null> => {
  const today = todayISO();
  const { data } = await supabase
    .from("checkins")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("date", today)
    .eq("status", "checked-in")
    .single();
  return data ? mapCheckin(data) : null;
};

// export const recordCheckOut = async (checkinId: string): Promise<CheckIn | null> => {
//   await delay(200);
//   const { data } = await supabase.rpc("record_checkout", { p_checkin_id: checkinId });
//   if (!data?.success) return null;
//   const { data: row } = await supabase
//     .from("checkins")
//     .select("*")
//     .eq("id", checkinId)
//     .single();
//   return row ? mapCheckin(row) : null;
// };

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION F: PAYROLL
// ─────────────────────────────────────────────────────────────────────────────
export const recordCheckOut = async (checkinId: string): Promise<CheckIn | null> => {
  await delay(200);


  
  
  // Get the checkin first to know the employee
  const { data: checkin } = await supabase
    .from("checkins")
    .select("employee_id")
    .eq("id", checkinId)
    .single();
  
  // ✅ UPDATE EMPLOYEE ONLINE STATUS TO FALSE
  if (checkin?.employee_id) {
    await supabase
      .from("employees")
      .update({ online: false })
      .eq("id", checkin.employee_id);
  }
  
  const { data } = await supabase.rpc("record_checkout", { p_checkin_id: checkinId });
  if (!data?.success) return null;
  
  const { data: row } = await supabase
    .from("checkins")
    .select("*")
    .eq("id", checkinId)
    .single();
    
  return row ? mapCheckin(row) : null;
};
export const getPayrollByPeriod = async (
  month: string,
  year: string
): Promise<PayrollRecord[]> => {
  await delay();
  const { data } = await supabase
    .from("payroll_records")
    .select("*")
    .eq("period_month", month)
    .eq("period_year", year);
  return Promise.all((data ?? []).map(hydratePayroll));
};

export const getPayrollByEmployee = async (
  employeeId: string
): Promise<PayrollRecord[]> => {
  await delay();
  const { data } = await supabase
    .from("payroll_records")
    .select("*")
    .eq("employee_id", employeeId)
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false });
  return Promise.all((data ?? []).map(hydratePayroll));
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

  const patch: Record<string, any> = {};
  if (updates.salesBonus !== undefined) patch.sales_bonus = updates.salesBonus;
  if (updates.performanceBonus !== undefined) patch.perf_bonus = updates.performanceBonus;
  if (updates.daysWorked !== undefined) patch.days_worked = updates.daysWorked;
  if (updates.notes !== undefined) patch.notes = updates.notes;

  if (Object.keys(patch).length > 0) {
    await supabase.from("payroll_records").update(patch).eq("id", id);
  }

  if (updates.allowances) {
    await supabase.from("payroll_allowances").delete().eq("payroll_id", id);
    await supabase.from("payroll_allowances").insert(
      updates.allowances.map((a) => ({ payroll_id: id, label: a.label, amount: a.amount }))
    );
  }

  if (updates.deductions) {
    await supabase.from("payroll_deductions").delete().eq("payroll_id", id);
    await supabase.from("payroll_deductions").insert(
      updates.deductions.map((d) => ({ payroll_id: id, label: d.label, amount: d.amount }))
    );
  }

  const { data } = await supabase
    .from("payroll_records")
    .select("*")
    .eq("id", id)
    .single();
  return data ? hydratePayroll(data) : null;
};

// Get unread notification count
export const getUnreadNotificationCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("read", false);
    
  if (error) {
    console.error("Error getting notification count:", error);
    return 0;
  }
  return count ?? 0;
};

// Get all notifications
export const getNotifications = async (limit: number = 50): Promise<any[]> => {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
    
  if (error) throw error;
  return data ?? [];
};

// Mark notification as read
export const markNotificationRead = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id);
  return !error;
};

// Mark all notifications as read
export const markAllNotificationsRead = async (): Promise<boolean> => {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("read", false);
  return !error;
};

export const markPayrollPaid = async (id: string): Promise<PayrollRecord | null> => {
  await delay(200);
  const { data } = await supabase.rpc("mark_payroll_paid", { p_payroll_id: id });
  if (!data) return null;
  const { data: row } = await supabase
    .from("payroll_records")
    .select("*")
    .eq("id", id)
    .single();
  return row ? hydratePayroll(row) : null;
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
  const records = await getPayrollByPeriod(month, year);
  return {
    totalGross: records.reduce((s, p) => s + calcGross(p), 0),
    totalNet: records.reduce((s, p) => s + calcNet(p), 0),
    totalDeductions: records.reduce((s, p) => s + calcTotalDeductions(p), 0),
    paidCount: records.filter((p) => p.status === "paid").length,
    pendingCount: records.filter((p) => p.status === "pending").length,
    draftCount: records.filter((p) => p.status === "draft").length,
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

  const iso = todayISO();
  const weekAgo = new Date(iso);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekAgoISO = weekAgo.toISOString().split("T")[0];
  
  // FIXED: Calculate month range properly instead of LIKE
  const [year, month] = iso.split('-');
  const monthStart = `${year}-${month}-01`;
  const lastDay = getLastDayOfMonth(parseInt(year), parseInt(month));
  const monthEnd = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;

  const todayReport = (await getReportsByEmployee(employeeId)).find(
    (r) => r.dateISO === iso
  ) ?? null;

  const todayCheckin = await getTodayCheckin(employeeId);

  const weekReports = await fetchReportsWithLineItems(
    supabase
      .from("reports")
      .select("*")
      .eq("employee_id", employeeId)
      .gte("date_iso", weekAgoISO)
      .lte("date_iso", iso)
  );

  // FIXED: Use date range instead of LIKE
  const monthReports = await fetchReportsWithLineItems(
    supabase
      .from("reports")
      .select("*")
      .eq("employee_id", employeeId)
      .gte("date_iso", monthStart)
      .lte("date_iso", monthEnd)
  );

  const emp = await getEmployeeById(employeeId);

  return {
    todayReport,
    todayCheckin,
    weekSales: weekReports.reduce((s, r) => s + r.sales, 0),
    weekSalesKES: weekReports.reduce((s, r) => s + r.totalSalesKES, 0),
    weekCustomers: weekReports.reduce((s, r) => s + r.customersReached, 0),
    weekSamplers: weekReports.reduce((s, r) => s + r.samplersGiven, 0),
    monthSales: monthReports.reduce((s, r) => s + r.sales, 0),
    monthSalesKES: monthReports.reduce((s, r) => s + r.totalSalesKES, 0),
    monthTarget: emp?.targets.monthly ?? 0,
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
    ? await getReportsByDate(dateISO)
    : await getAllReports();

  const employees = await getEmployees();
  const empMap = Object.fromEntries(employees.map((e) => [e.id, e]));

  return base
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
    .map((r) => ({
      ...r,
      employee: empMap[r.employeeId] ?? null,
    }));
};

// ─────────────────────────────────────────────────────────────────────────────
//  PHOTO UPLOAD
// ─────────────────────────────────────────────────────────────────────────────

export const uploadReportPhoto = async (
  employeeId: string,
  localUri: string
): Promise<string> => {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const ext = localUri.split(".").pop() ?? "jpg";
  const path = `${employeeId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("report-photos")
    .upload(path, blob, { contentType: `image/${ext}`, upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from("report-photos").getPublicUrl(path);
  return data.publicUrl;
};