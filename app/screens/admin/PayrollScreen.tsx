/**
 * PayrollScreen.tsx — WITH PDF EXPORT
 * ─────────────────────────────────────────────────────────────────────────────
 * Changes from refactored version:
 *  • PayslipModal: X close button added top-right
 *  • Individual "Export PDF" generates a real payslip PDF via RNHTMLtoPDF
 *  • Full Payroll PDF generates a multi-employee payroll report via RNHTMLtoPDF
 *  • Both PDFs include company logo (base64 or file URI), professional layout
 *  • No more Alert stubs for PDF actions
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Modal,
  Platform,
  Alert,
  TextInput,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Download, ChevronDown, Check,
  Eye, FileText, CheckCircle,
  Menu, X, Edit2, Printer,
} from "lucide-react-native";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import Logo from "../../../assets/images/icon.png";

import {
  getPayrollByPeriod,
  getPayrollPeriodSummary,
  markPayrollPaid,
  updatePayrollRecord,
  calcGross,
  calcTotalDeductions,
  calcNet,
  getEmployeeById,
  PayrollRecord,
  PayrollPeriodSummary,
  Employee,
  PayStatus,
} from "../../data/dbService";

// ─── Company branding ─────────────────────────────────────────────────────────
const COMPANY_NAME    = "Nyamasi Roselle";
const COMPANY_TAGLINE = "Human Resources & Payroll";
const COMPANY_ADDRESS = "Nairobi, Kenya";
const COMPANY_EMAIL   = "hr@nyamasiroselle.co.ke";
const COMPANY_PHONE   = "+254 700 000 000";

/**
 * Converts the bundled Logo asset to a base64 data-URI at runtime so it can
 * be embedded directly in the PDF HTML (expo-print runs in a headless WebView
 * that cannot resolve Metro asset URIs or require() paths).
 */
async function getLogoBase64(): Promise<string> {
  try {
    const logoUri = Image.resolveAssetSource(Logo).uri;
    // On Android the URI may already be a file:// path; on iOS it is an asset URL.
   const logoBase64 = await FileSystem.readAsStringAsync(logoUri, {
  encoding: 'base64',
});
    return `data:image/jpeg;base64,${logoBase64}`;
  } catch {
    // Transparent 1×1 fallback so PDF still renders if logo can't load
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = {
  primary:         "#8B0111",
  primaryDark:     "#8B0111",
  primaryDeep:     "#6B0009",
  primaryMuted:    "rgba(139,1,17,0.08)",
  primaryLight:    "rgba(139,1,17,0.15)",
  white:           "#FFFFFF",
  background:      "#F0F5FB",
  cardBg:          "#FFFFFF",
  textPrimary:     "#0D2137",
  textSecondary:   "#4A6580",
  textMuted:       "#8FA3B8",
  border:          "#D6E4F0",
  success:         "#00897B",
  successLight:    "#E0F2F1",
  warning:         "#F57C00",
  warningLight:    "#FFF3E0",
  accentBlue:      "#1565C0",
  accentBlueLight: "#E3F0FF",
  danger:          "#C62828",
  dangerLight:     "#FFEBEE",
  overlayBg:       "rgba(13,33,55,0.6)",
  paid:            "#00897B",
  paidBg:          "#E0F2F1",
  pending:         "#F57C00",
  pendingBg:       "#FFF3E0",
  draft:           "#8FA3B8",
  draftBg:         "#F5F5F5",
};

type Month = "Jan"|"Feb"|"Mar"|"Apr"|"May"|"Jun"|"Jul"|"Aug"|"Sep"|"Oct"|"Nov"|"Dec";
const MONTHS: Month[] = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const YEARS = ["2026","2025","2024"];

// ─── Clock shim ───────────────────────────────────────────────────────────────
const Clock: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <View style={{ width:size, height:size, borderRadius:size/2, borderWidth:1.5, borderColor:color, alignItems:"center", justifyContent:"center" }}>
    <View style={{ width:1.5, height:size*0.28, backgroundColor:color, position:"absolute", bottom:"50%", right:"48%" }} />
    <View style={{ width:size*0.28, height:1.5, backgroundColor:color, position:"absolute", left:"50%", top:"50%" }} />
  </View>
);

interface HydratedPayroll extends PayrollRecord {
  employee: Employee | null;
}

const statusColor = (s: PayStatus) =>
  s === "paid" ? COLORS.paid : s === "pending" ? COLORS.pending : COLORS.draft;
const statusBg = (s: PayStatus) =>
  s === "paid" ? COLORS.paidBg : s === "pending" ? COLORS.pendingBg : COLORS.draftBg;
const statusAvatarBg = (s: PayStatus) =>
  s === "paid" ? COLORS.successLight : s === "pending" ? COLORS.warningLight : COLORS.accentBlueLight;

// ─────────────────────────────────────────────────────────────────────────────
// PDF GENERATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Shared CSS injected into every PDF page */
const PDF_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, Arial, Helvetica, sans-serif; background: #fff; color: #0D2137; font-size: 13px; line-height: 1.5; }
  .page { padding: 36px 44px 44px; max-width: 794px; margin: auto; }

  /* ── letterhead ── */
  .letterhead { display: flex; align-items: stretch; margin-bottom: 0; }
  .letterhead-left { display: flex; align-items: center; gap: 16px; flex: 1; }
  .logo { width: 64px; height: 64px; border-radius: 12px; object-fit: cover; border: 2px solid #f0e8e9; }
  .company-block { display: flex; flex-direction: column; justify-content: center; }
  .company-name { font-size: 24px; font-weight: 900; color: #8B0111; letter-spacing: -0.8px; line-height: 1.1; }
  .company-sub  { font-size: 10px; font-weight: 600; color: #4A6580; text-transform: uppercase; letter-spacing: 1.2px; margin-top: 3px; }
  .letterhead-right { text-align: right; font-size: 10px; color: #8FA3B8; line-height: 1.8; display: flex; flex-direction: column; justify-content: center; }
  .letterhead-right strong { color: #4A6580; font-size: 11px; }

  /* ── divider band ── */
  .header-band { height: 4px; background: linear-gradient(to right, #8B0111, #C62828, #F57C00); border-radius: 2px; margin: 14px 0 22px; }

  /* ── doc title block ── */
  .doc-title-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 22px; }
  .doc-title { font-size: 20px; font-weight: 900; color: #0D2137; letter-spacing: -0.5px; }
  .doc-meta  { text-align: right; font-size: 10px; color: #8FA3B8; line-height: 1.8; }
  .doc-meta strong { color: #0D2137; font-size: 11px; }

  /* ── employee hero card ── */
  .emp-hero { display: flex; align-items: center; justify-content: space-between; background: linear-gradient(135deg, #F0F5FB 0%, #E8EFF8 100%); border-radius: 14px; padding: 20px 24px; margin-bottom: 24px; border-left: 4px solid #8B0111; }
  .emp-avatar { width: 52px; height: 52px; border-radius: 26px; background: rgba(139,1,17,0.12); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 900; color: #8B0111; flex-shrink: 0; border: 2px solid rgba(139,1,17,0.2); }
  .emp-info   { flex: 1; margin-left: 16px; }
  .emp-name   { font-size: 17px; font-weight: 800; color: #0D2137; }
  .emp-role   { font-size: 12px; color: #4A6580; margin-top: 2px; font-weight: 500; }
  .emp-meta   { font-size: 10px; color: #8FA3B8; margin-top: 4px; }
  .status-chip { padding: 6px 18px; border-radius: 20px; font-size: 10px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; }
  .status-paid    { background: #E0F2F1; color: #00897B; border: 1px solid #b2dfdb; }
  .status-pending { background: #FFF3E0; color: #F57C00; border: 1px solid #ffe0b2; }
  .status-draft   { background: #F5F5F5; color: #8FA3B8; border: 1px solid #e0e0e0; }

  /* ── two-column layout for payslip ── */
  .two-col { display: flex; gap: 18px; margin-bottom: 18px; }
  .two-col .col { flex: 1; }

  /* ── section headings ── */
  .section-title { font-size: 10px; font-weight: 800; color: #8B0111; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px; padding-bottom: 5px; border-bottom: 1.5px solid rgba(139,1,17,0.15); }

  /* ── table cards ── */
  .card { border: 1px solid #D6E4F0; border-radius: 10px; overflow: hidden; margin-bottom: 16px; }
  .row  { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid #EEF3F9; }
  .row:last-child { border-bottom: none; }
  .row.subtotal { background: #F8FAFC; }
  .row.total    { background: rgba(139,1,17,0.06); border-top: 1.5px solid rgba(139,1,17,0.15); }
  .lbl { font-size: 12px; color: #4A6580; }
  .val { font-size: 12px; font-weight: 700; color: #0D2137; }
  .val.earn    { color: #00897B; }
  .val.ded     { color: #C62828; }
  .val.total   { font-size: 13px; font-weight: 800; color: #0D2137; }
  .val.total-ded { font-size: 13px; font-weight: 800; color: #C62828; }

  /* ── net pay banner ── */
  .net-banner { background: linear-gradient(135deg, #8B0111 0%, #6B0009 100%); border-radius: 14px; padding: 22px 28px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; box-shadow: 0 4px 20px rgba(139,1,17,0.25); }
  .net-label  { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.75); text-transform: uppercase; letter-spacing: 0.5px; }
  .net-amount { font-size: 32px; font-weight: 900; color: #fff; letter-spacing: -1.5px; }
  .net-sub    { font-size: 10px; color: rgba(255,255,255,0.6); margin-top: 3px; }

  /* ── notes box ── */
  .notes-box { background: #FFFBF0; border: 1px solid #FFE082; border-radius: 10px; padding: 12px 16px; font-size: 11px; color: #795548; margin-bottom: 20px; }
  .notes-box strong { display: block; margin-bottom: 4px; color: #5D4037; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }

  /* ── signature block ── */
  .sig-block { display: flex; gap: 40px; margin-top: 32px; margin-bottom: 8px; }
  .sig-col   { flex: 1; }
  .sig-line  { border-top: 1px solid #D6E4F0; padding-top: 8px; font-size: 10px; color: #8FA3B8; }
  .sig-title { font-weight: 700; color: #4A6580; font-size: 10px; }
  .sig-date  { margin-top: 3px; }

  /* ── footer ── */
  .doc-footer { border-top: 1.5px solid #D6E4F0; padding-top: 12px; margin-top: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
  .footer-left  { font-size: 9px; color: #B0BEC5; line-height: 1.6; }
  .footer-right { font-size: 9px; color: #B0BEC5; text-align: right; line-height: 1.6; }
  .footer-badge { display: inline-block; background: rgba(139,1,17,0.08); color: #8B0111; font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 8px; border-radius: 4px; margin-bottom: 4px; }

  /* ── full payroll report ── */
  .report-band { background: linear-gradient(135deg, #8B0111 0%, #6B0009 100%); padding: 28px 32px; border-radius: 14px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
  .report-band-title { font-size: 22px; font-weight: 900; color: #fff; letter-spacing: -0.5px; }
  .report-band-sub   { font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 4px; }
  .summary-grid { display: flex; gap: 10px; margin-bottom: 24px; }
  .sum-box { flex: 1; border: 1px solid #D6E4F0; border-radius: 10px; padding: 14px 12px; background: #F8FAFC; }
  .sum-box.accent { background: rgba(139,1,17,0.05); border-color: rgba(139,1,17,0.2); }
  .sum-box-val { font-size: 18px; font-weight: 900; letter-spacing: -0.5px; }
  .sum-box-lbl { font-size: 9px; color: #8FA3B8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead tr { background: #8B0111; }
  thead th { color: #fff; font-weight: 700; padding: 10px 12px; text-align: left; font-size: 10px; letter-spacing: 0.5px; text-transform: uppercase; }
  tbody tr { border-bottom: 1px solid #EEF3F9; }
  tbody tr:nth-child(even) { background: #F8FAFC; }
  tbody tr:hover { background: #EEF3F9; }
  tbody td { padding: 10px 12px; color: #0D2137; vertical-align: middle; }
  tfoot tr { background: rgba(139,1,17,0.07); border-top: 2px solid #8B0111; }
  tfoot td { padding: 12px; font-weight: 900; color: #0D2137; font-size: 12px; }
  .tag { display: inline-block; padding: 3px 10px; border-radius: 8px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px; }
  .tag-paid    { background: #E0F2F1; color: #00897B; }
  .tag-pending { background: #FFF3E0; color: #F57C00; }
  .tag-draft   { background: #F5F5F5; color: #8FA3B8; }
  .emp-cell { display: flex; flex-direction: column; }
  .emp-cell strong { font-size: 12px; font-weight: 700; color: #0D2137; }
  .emp-cell span   { font-size: 10px; color: #8FA3B8; margin-top: 1px; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .green { color: #00897B; font-weight: 700; }
  .red   { color: #C62828; font-weight: 700; }
  .bold  { font-weight: 800; }
`;

/** Letterhead used in every PDF — logoSrc is a base64 data-URI */
function pdfLetterhead(logoSrc: string, title: string, period: string, refNo: string): string {
  const now = new Date().toLocaleDateString("en-KE", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
  return `
    <div class="letterhead">
      <div class="letterhead-left">
        <img class="logo" src="${logoSrc}" alt="${COMPANY_NAME} logo" />
        <div class="company-block">
          <div class="company-name">${COMPANY_NAME}</div>
          <div class="company-sub">${COMPANY_TAGLINE}</div>
        </div>
      </div>
      <div class="letterhead-right">
        <strong>${COMPANY_ADDRESS}</strong>
        ${COMPANY_EMAIL}<br>${COMPANY_PHONE}
      </div>
    </div>
    <div class="header-band"></div>
    <div class="doc-title-row">
      <div class="doc-title">${title}</div>
      <div class="doc-meta">
        <strong>${period}</strong><br>
        ${refNo}<br>
        ${now}
      </div>
    </div>
  `;
}

function pdfDocFooter(): string {
  const ts = new Date().toLocaleString("en-KE");
  return `
    <div class="doc-footer">
      <div class="footer-left">
        <div class="footer-badge">Confidential</div><br>
        This is a computer-generated document and does not require a physical signature.<br>
        ${COMPANY_NAME} · ${COMPANY_ADDRESS}
      </div>
      <div class="footer-right">
        Generated: ${ts}<br>
        ${COMPANY_EMAIL}<br>
        ${COMPANY_PHONE}
      </div>
    </div>
  `;
}

/** Generate payslip HTML for a single employee — async to load the logo */
async function buildPayslipHTML(record: HydratedPayroll): Promise<string> {
  const gross    = calcGross(record);
  const totalDed = calcTotalDeductions(record);
  const net      = calcNet(record);
  const emp      = record.employee;
  const logoSrc  = await getLogoBase64();
  const refNo    = `REF: ${record.employeeId.slice(-6).toUpperCase()}-${record.period.label.replace(/\s/g, "")}`;
  const statusClass = `status-${record.status}`;

  const allowanceRows = record.allowances.map(a => `
    <div class="row">
      <span class="lbl">${a.label} Allowance</span>
      <span class="val earn">KES ${a.amount.toLocaleString()}</span>
    </div>`).join("");

  const deductionRows = record.deductions.map(d => `
    <div class="row">
      <span class="lbl">${d.label}</span>
      <span class="val ded">− KES ${d.amount.toLocaleString()}</span>
    </div>`).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Payslip — ${emp?.fullName ?? "Employee"} — ${record.period.label}</title>
  <style>${PDF_STYLES}</style>
</head>
<body>
<div class="page">

  ${pdfLetterhead(logoSrc, "Employee Payslip", record.period.label, refNo)}

  <!-- Employee hero card -->
  <div class="emp-hero">
    <div class="emp-avatar">${emp?.initials ?? "??"}</div>
    <div class="emp-info">
      <div class="emp-name">${emp?.fullName ?? "Employee"}</div>
      <div class="emp-role">${emp?.role ?? "—"}</div>
      <div class="emp-meta">
        Pay Period: <strong>${record.period.label}</strong> &nbsp;·&nbsp;
        Days Worked: <strong>${record.attendance.daysWorked} / ${record.attendance.totalDays}</strong> &nbsp;·&nbsp;
        Employee ID: <strong>${record.employeeId.slice(-8).toUpperCase()}</strong>
      </div>
    </div>
    <div class="status-chip ${statusClass}">${record.status}</div>
  </div>

  <!-- Earnings & Deductions side by side -->
  <div class="two-col">
    <div class="col">
      <div class="section-title">Earnings</div>
      <div class="card">
        <div class="row">
          <span class="lbl">Basic Salary</span>
          <span class="val">KES ${record.baseSalary.toLocaleString()}</span>
        </div>
        ${record.bonuses.salesBonus > 0 ? `
        <div class="row">
          <span class="lbl">Sales Bonus</span>
          <span class="val earn">KES ${record.bonuses.salesBonus.toLocaleString()}</span>
        </div>` : ""}
        ${record.bonuses.performanceBonus > 0 ? `
        <div class="row">
          <span class="lbl">Performance Bonus</span>
          <span class="val earn">KES ${record.bonuses.performanceBonus.toLocaleString()}</span>
        </div>` : ""}
        ${allowanceRows}
        <div class="row total">
          <span class="lbl bold">Gross Pay</span>
          <span class="val total">KES ${gross.toLocaleString()}</span>
        </div>
      </div>
    </div>

    <div class="col">
      <div class="section-title">Deductions</div>
      <div class="card">
        ${deductionRows || `<div class="row"><span class="lbl">No deductions</span><span class="val">KES 0</span></div>`}
        <div class="row total">
          <span class="lbl bold">Total Deductions</span>
          <span class="val total-ded">KES ${totalDed.toLocaleString()}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Net pay banner -->
  <div class="net-banner">
    <div>
      <div class="net-label">Net Pay</div>
      <div class="net-sub">${record.period.label} · ${record.attendance.daysWorked} days</div>
    </div>
    <div class="net-amount">KES ${net.toLocaleString()}</div>
  </div>

  ${record.notes ? `
  <div class="notes-box">
    <strong>Notes</strong>
    ${record.notes}
  </div>` : ""}

  <!-- Signature block -->
  <div class="sig-block">
    <div class="sig-col">
      <div class="sig-line">
        <div class="sig-title">Prepared by (HR)</div>
        <div class="sig-date">Date: _______________</div>
      </div>
    </div>
    <div class="sig-col">
      <div class="sig-line">
        <div class="sig-title">Authorised by</div>
        <div class="sig-date">Date: _______________</div>
      </div>
    </div>
    <div class="sig-col">
      <div class="sig-line">
        <div class="sig-title">Received by (Employee)</div>
        <div class="sig-date">Date: _______________</div>
      </div>
    </div>
  </div>

  ${pdfDocFooter()}
</div>
</body>
</html>`;
}

/** Generate full payroll report HTML — async to load the logo */
async function buildFullPayrollHTML(records: HydratedPayroll[], period: string): Promise<string> {
  const logoSrc      = await getLogoBase64();
  const totalGross   = records.reduce((s, r) => s + calcGross(r), 0);
  const totalNet     = records.reduce((s, r) => s + calcNet(r), 0);
  const totalDed     = records.reduce((s, r) => s + calcTotalDeductions(r), 0);
  const paidCount    = records.filter(r => r.status === "paid").length;
  const pendingCount = records.filter(r => r.status === "pending").length;
  const draftCount   = records.filter(r => r.status === "draft").length;
  const refNo        = `REF: PAYROLL-${period.replace(/\s/g, "")}-${Date.now().toString().slice(-6)}`;

  const rows = records.map((r, i) => `
    <tr>
      <td class="text-center" style="color:#8FA3B8;font-size:10px">${i + 1}</td>
      <td>
        <div class="emp-cell">
          <strong>${r.employee?.fullName ?? "—"}</strong>
          <span>${r.employee?.role ?? "—"}</span>
        </div>
      </td>
      <td class="text-center">${r.attendance.daysWorked}/${r.attendance.totalDays}</td>
      <td class="text-right">KES ${r.baseSalary.toLocaleString()}</td>
      <td class="text-right green">KES ${calcGross(r).toLocaleString()}</td>
      <td class="text-right red">KES ${calcTotalDeductions(r).toLocaleString()}</td>
      <td class="text-right bold">KES ${calcNet(r).toLocaleString()}</td>
      <td class="text-center"><span class="tag tag-${r.status}">${r.status}</span></td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Payroll Report — ${period}</title>
  <style>${PDF_STYLES}</style>
</head>
<body>
<div class="page">

  ${pdfLetterhead(logoSrc, "Payroll Report", period, refNo)}

  <!-- Colour summary band -->
  <div class="report-band">
    <div>
      <div class="report-band-title">KES ${totalNet.toLocaleString()}</div>
      <div class="report-band-sub">Total Net Payroll · ${period} · ${records.length} Employees</div>
    </div>
    <img src="${logoSrc}" style="width:48px;height:48px;border-radius:8px;opacity:0.6" />
  </div>

  <!-- Summary boxes -->
  <div class="summary-grid">
    <div class="sum-box accent">
      <div class="sum-box-val" style="color:#8B0111">KES ${totalNet.toLocaleString()}</div>
      <div class="sum-box-lbl">Net Payroll</div>
    </div>
    <div class="sum-box">
      <div class="sum-box-val" style="color:#0D2137">KES ${totalGross.toLocaleString()}</div>
      <div class="sum-box-lbl">Gross Payroll</div>
    </div>
    <div class="sum-box">
      <div class="sum-box-val" style="color:#C62828">KES ${totalDed.toLocaleString()}</div>
      <div class="sum-box-lbl">Total Deductions</div>
    </div>
    <div class="sum-box">
      <div class="sum-box-val" style="color:#00897B">${paidCount}</div>
      <div class="sum-box-lbl">Paid</div>
    </div>
    <div class="sum-box">
      <div class="sum-box-val" style="color:#F57C00">${pendingCount}</div>
      <div class="sum-box-lbl">Pending</div>
    </div>
    <div class="sum-box">
      <div class="sum-box-val" style="color:#8FA3B8">${draftCount}</div>
      <div class="sum-box-lbl">Draft</div>
    </div>
  </div>

  <div class="section-title" style="margin-bottom:12px">Employee Breakdown</div>
  <table>
    <thead>
      <tr>
        <th class="text-center">#</th>
        <th>Employee</th>
        <th class="text-center">Days</th>
        <th class="text-right">Basic (KES)</th>
        <th class="text-right">Gross (KES)</th>
        <th class="text-right">Deductions (KES)</th>
        <th class="text-right">Net Pay (KES)</th>
        <th class="text-center">Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="4">TOTALS — ${records.length} employees</td>
        <td class="text-right green">KES ${totalGross.toLocaleString()}</td>
        <td class="text-right red">KES ${totalDed.toLocaleString()}</td>
        <td class="text-right bold">KES ${totalNet.toLocaleString()}</td>
        <td></td>
      </tr>
    </tfoot>
  </table>

  <!-- Signature / approval block -->
  <div class="sig-block">
    <div class="sig-col">
      <div class="sig-line">
        <div class="sig-title">Prepared by (HR Manager)</div>
        <div class="sig-date">Name: _______________</div>
        <div class="sig-date">Date: _______________</div>
      </div>
    </div>
    <div class="sig-col">
      <div class="sig-line">
        <div class="sig-title">Finance Approval</div>
        <div class="sig-date">Name: _______________</div>
        <div class="sig-date">Date: _______________</div>
      </div>
    </div>
    <div class="sig-col">
      <div class="sig-line">
        <div class="sig-title">Authorised by (Director)</div>
        <div class="sig-date">Name: _______________</div>
        <div class="sig-date">Date: _______________</div>
      </div>
    </div>
  </div>

  ${pdfDocFooter()}
</div>
</body>
</html>`;
}

/**
 * Renders HTML → PDF via expo-print, then saves it permanently to the device.
 *
 * iOS  → saved to the app's Documents directory (visible in Files app under
 *         "On My iPhone / <AppName>") via FileSystem.
 * Android → saved to the public Downloads folder via MediaLibrary after
 *            requesting WRITE_EXTERNAL_STORAGE / MEDIA permission.
 *
 * A success alert tells the user exactly where the file landed.
 */
async function exportPDF(html: string, fileName: string): Promise<void> {
  try {
    // 1. Render HTML → temp PDF
    const { uri: tmpUri } = await Print.printToFileAsync({ html, base64: false });

    const safeFileName = `${fileName.replace(/[^a-zA-Z0-9_\-]/g, "_")}.pdf`;

    if (Platform.OS === "ios") {
      // ── iOS: copy into the app Documents folder (Files app accessible) ──
      const destUri = `${(FileSystem as any).documentDirectory}${safeFileName}`;
      await FileSystem.copyAsync({ from: tmpUri, to: destUri });

      Alert.alert(
        "✓ PDF Saved",
        `"${safeFileName}" has been saved to your Files app under On My iPhone → ${COMPANY_NAME}.`,
        [{ text: "OK" }]
      );
    } else {
      // ── Android: save to public Downloads via MediaLibrary ──
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant storage permission to save PDFs to your Downloads folder.",
          [{ text: "OK" }]
        );
        return;
      }

      // Create the asset in MediaLibrary (lands in Downloads)
      const asset = await MediaLibrary.createAssetAsync(tmpUri);
      // Try to put it in a named album for cleaner organisation
      let album = await MediaLibrary.getAlbumAsync(COMPANY_NAME);
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync(COMPANY_NAME, asset, false);
      }

      Alert.alert(
        "✓ PDF Downloaded",
        `"${safeFileName}" has been saved to your Downloads / ${COMPANY_NAME} folder.`,
        [{ text: "OK" }]
      );
    }

    // Clean up the temp file expo-print left behind
    await FileSystem.deleteAsync(tmpUri, { idempotent: true });

  } catch (err: any) {
    console.error("[PayrollScreen] exportPDF error:", err);
    Alert.alert(
      "Export Failed",
      err?.message ?? "Could not save the PDF. Please try again."
    );
  }
}

// ─── Payslip Detail Modal ─────────────────────────────────────────────────────
const PayslipModal: React.FC<{
  record: HydratedPayroll | null;
  visible: boolean;
  onClose: () => void;
  onMarkPaid: () => void;
}> = ({ record, visible, onClose, onMarkPaid }) => {
  const [exporting, setExporting] = useState(false);
  if (!record) return null;

  const gross    = calcGross(record);
  const totalDed = calcTotalDeductions(record);
  const net      = calcNet(record);
  const emp      = record.employee;

  const handleExport = async () => {
    setExporting(true);
    const fileName = `Payslip_${(emp?.fullName ?? "Employee").replace(/\s+/g, "_")}_${record.period.label.replace(/\s+/g, "")}`;
    const html = await buildPayslipHTML(record);
    await exportPDF(html, fileName);
    setExporting(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={st.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={st.payslipSheet}>
          <View style={st.modalHandle} />

          {/* ── X close button ── */}
          <TouchableOpacity style={st.modalCloseBtn} onPress={onClose} activeOpacity={0.75} hitSlop={{ top:8, left:8, bottom:8, right:8 }}>
            <X size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>

          {/* Payslip header */}
          <View style={st.payslipHeader}>
            <View style={st.payslipHeroLeft}>
              <View style={st.payslipAvatar}>
                <Text style={st.payslipAvatarText}>{emp?.initials ?? "??"}</Text>
              </View>
              <View>
                <Text style={st.payslipName}>{emp?.fullName ?? "Employee"}</Text>
                <Text style={st.payslipRole}>{emp?.role ?? ""}</Text>
                <Text style={st.payslipPeriod}>
                  {record.period.label} · {record.attendance.daysWorked}/{record.attendance.totalDays} days
                </Text>
              </View>
            </View>
            <View style={[st.statusChip, { backgroundColor: statusBg(record.status) }]}>
              <Text style={[st.statusChipText, { color: statusColor(record.status) }]}>
                {record.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Earnings */}
            <Text style={st.slipSection}>Earnings</Text>
            <View style={st.slipCard}>
              <View style={st.slipRow}>
                <Text style={st.slipLabel}>Basic Salary</Text>
                <Text style={st.slipValue}>KES {record.baseSalary.toLocaleString()}</Text>
              </View>
              <View style={[st.slipRow, st.slipRowBorder]}>
                <Text style={st.slipLabel}>Sales Bonus</Text>
                <Text style={[st.slipValue, { color: COLORS.success }]}>
                  KES {record.bonuses.salesBonus.toLocaleString()}
                </Text>
              </View>
              {record.bonuses.performanceBonus > 0 && (
                <View style={[st.slipRow, st.slipRowBorder]}>
                  <Text style={st.slipLabel}>Performance Bonus</Text>
                  <Text style={[st.slipValue, { color: COLORS.success }]}>
                    KES {record.bonuses.performanceBonus.toLocaleString()}
                  </Text>
                </View>
              )}
              {record.allowances.map((a, i) => (
                <View key={i} style={[st.slipRow, st.slipRowBorder]}>
                  <Text style={st.slipLabel}>{a.label} Allowance</Text>
                  <Text style={[st.slipValue, { color: COLORS.accentBlue }]}>
                    KES {a.amount.toLocaleString()}
                  </Text>
                </View>
              ))}
              <View style={[st.slipRow, st.slipRowBorder, st.grossRow]}>
                <Text style={st.grossLabel}>Gross Pay</Text>
                <Text style={st.grossValue}>KES {gross.toLocaleString()}</Text>
              </View>
            </View>

            {/* Deductions */}
            <Text style={st.slipSection}>Deductions</Text>
            <View style={st.slipCard}>
              {record.deductions.map((d, i) => (
                <View key={i} style={[st.slipRow, i > 0 && st.slipRowBorder]}>
                  <Text style={st.slipLabel}>{d.label}</Text>
                  <Text style={[st.slipValue, { color: COLORS.danger }]}>
                    - KES {d.amount.toLocaleString()}
                  </Text>
                </View>
              ))}
              <View style={[st.slipRow, st.slipRowBorder, st.grossRow]}>
                <Text style={st.grossLabel}>Total Deductions</Text>
                <Text style={[st.grossValue, { color: COLORS.danger }]}>
                  KES {totalDed.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Net pay */}
            <View style={st.netPayCard}>
              <Text style={st.netPayLabel}>Net Pay</Text>
              <Text style={st.netPayValue}>KES {net.toLocaleString()}</Text>
            </View>

            {/* Notes */}
            {!!record.notes && (
              <View style={[st.slipCard, { marginTop: 0 }]}>
                <Text style={[st.slipLabel, { color: COLORS.textMuted }]}>Notes: {record.notes}</Text>
              </View>
            )}

            {/* Actions */}
            <View style={st.slipActions}>
              <TouchableOpacity
                style={[st.downloadBtn, exporting && { opacity: 0.6 }]}
                activeOpacity={0.85}
                onPress={handleExport}
                disabled={exporting}
              >
                {exporting
                  ? <ActivityIndicator size="small" color={COLORS.white} />
                  : <Download size={15} color={COLORS.white} />
                }
                <Text style={st.downloadBtnText}>
                  {exporting ? "Generating…" : "Export PDF"}
                </Text>
              </TouchableOpacity>
              {record.status !== "paid" && (
                <TouchableOpacity style={st.markPaidBtn} onPress={onMarkPaid} activeOpacity={0.85}>
                  <CheckCircle size={15} color={COLORS.white} />
                  <Text style={st.markPaidBtnText}>Mark as Paid</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Adjust Modal ─────────────────────────────────────────────────────────────
interface AdjustState {
  bonus: string; advance: string; overtime: string; otherAllowance: string; note: string;
}

const AdjustModal: React.FC<{
  record: HydratedPayroll | null;
  visible: boolean;
  onClose: () => void;
  onApply: (adj: AdjustState) => void;
}> = ({ record, visible, onClose, onApply }) => {
  const [adj, setAdj] = useState<AdjustState>({
    bonus: "", advance: "", overtime: "", otherAllowance: "", note: "",
  });
  if (!record) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={st.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={[st.payslipSheet, { paddingBottom: Platform.OS === "ios" ? 58 : 58 }]}>
          <View style={st.modalHandle} />

          {/* ── X close button ── */}
          <TouchableOpacity style={st.modalCloseBtn} onPress={onClose} activeOpacity={0.75} hitSlop={{ top:8, left:8, bottom:8, right:8 }}>
            <X size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <View style={st.adjustTitleRow}>
            <Text style={st.modalTitle}>Adjust Payroll</Text>
            <Text style={st.adjustSub}>{record.employee?.fullName ?? "Employee"}</Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {[
              { label:"Performance Bonus (KES)",  key:"bonus",          placeholder:"e.g. 2000" },
              { label:"Salary Advance (KES)",      key:"advance",        placeholder:"e.g. 5000" },
              { label:"Overtime Pay (KES)",        key:"overtime",       placeholder:"e.g. 1500" },
              { label:"Other Allowance (KES)",     key:"otherAllowance", placeholder:"e.g. 1000" },
            ].map(f => (
              <View key={f.key} style={st.adjField}>
                <Text style={st.adjLabel}>{f.label}</Text>
                <TextInput
                  style={st.adjInput}
                  placeholder={f.placeholder}
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={(adj as any)[f.key]}
                  onChangeText={(v) => setAdj({ ...adj, [f.key]: v })}
                />
              </View>
            ))}
            <View style={st.adjField}>
              <Text style={st.adjLabel}>Notes</Text>
              <TextInput
                style={[st.adjInput, { height:72, textAlignVertical:"top", paddingTop:10 }]}
                placeholder="Reason for adjustment..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                value={adj.note}
                onChangeText={(v) => setAdj({ ...adj, note: v })}
              />
            </View>
            <View style={st.slipActions}>
              <TouchableOpacity
                style={[st.downloadBtn, { backgroundColor:COLORS.background, borderWidth:1, borderColor:COLORS.border }]}
                onPress={onClose} activeOpacity={0.8}>
                <Text style={[st.downloadBtnText, { color: COLORS.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.markPaidBtn}
                onPress={() => { onApply(adj); onClose(); }}
                activeOpacity={0.85}>
                <Check size={15} color={COLORS.white} />
                <Text style={st.markPaidBtnText}>Apply Changes</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Payroll Row ──────────────────────────────────────────────────────────────
const PayrollRow: React.FC<{
  record: HydratedPayroll;
  onView: () => void;
  onAdjust: () => void;
  onMarkPaid: () => void;
}> = ({ record, onView, onAdjust, onMarkPaid }) => {
  const net = calcNet(record);
  const emp = record.employee;

  return (
    <View style={st.payRow}>
      <View style={st.payRowLeft}>
        <View style={[st.payAvatar, { backgroundColor: statusAvatarBg(record.status) }]}>
          <Text style={[st.payAvatarText, { color: statusColor(record.status) }]}>
            {emp?.initials ?? "??"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.payName}>{emp?.fullName ?? "Employee"}</Text>
          <Text style={st.payRole}>
            {emp?.role ?? ""} · {record.attendance.daysWorked}/{record.attendance.totalDays}d
          </Text>
        </View>
      </View>
      <View style={st.payRowRight}>
        <Text style={[st.payNet, { color: record.status === "paid" ? COLORS.success : COLORS.textPrimary }]}>
          KES {net.toLocaleString()}
        </Text>
        <View style={[st.statusChip, { backgroundColor: statusBg(record.status) }]}>
          <Text style={[st.statusChipText, { color: statusColor(record.status), fontSize: 9 }]}>
            {record.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={st.rowActions}>
        <TouchableOpacity style={st.rowActionBtn} onPress={onView} activeOpacity={0.8}>
          <Eye size={13} color={COLORS.accentBlue} />
        </TouchableOpacity>
        <TouchableOpacity style={st.rowActionBtn} onPress={onAdjust} activeOpacity={0.8}>
          <Edit2 size={13} color={COLORS.warning} />
        </TouchableOpacity>
        {record.status !== "paid" && (
          <TouchableOpacity
            style={[st.rowActionBtn, { backgroundColor: COLORS.successLight }]}
            onPress={onMarkPaid} activeOpacity={0.8}>
            <CheckCircle size={13} color={COLORS.success} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
interface PayrollScreenProps { navigation?: any }

const PayrollScreen: React.FC<PayrollScreenProps> = ({ navigation }) => {
  const [month,            setMonth]           = useState<Month>("Apr");
  const [year,             setYear]            = useState("2026");
  const [records,          setRecords]         = useState<HydratedPayroll[]>([]);
  const [summary,          setSummary]         = useState<PayrollPeriodSummary | null>(null);
  const [loading,          setLoading]         = useState(true);
  const [viewRecord,       setViewRecord]      = useState<HydratedPayroll | null>(null);
  const [adjustRecord,     setAdjustRecord]    = useState<HydratedPayroll | null>(null);
  const [showMonthPicker,  setShowMonthPicker] = useState(false);
  const [filterStatus,     setFilterStatus]    = useState<"all" | PayStatus>("all");
  const [exportingAll,     setExportingAll]    = useState(false);

  const loadPayroll = useCallback(async (m: string, y: string) => {
    setLoading(true);
    try {
      const [rawRecords, periodSummary] = await Promise.all([
        getPayrollByPeriod(m, y),
        getPayrollPeriodSummary(m, y),
      ]);
      const hydrated: HydratedPayroll[] = await Promise.all(
        rawRecords.map(async (r) => ({
          ...r,
          employee: await getEmployeeById(r.employeeId),
        }))
      );
      hydrated.sort((a, b) => {
        const order: Record<PayStatus, number> = { paid: 0, pending: 1, draft: 2 };
        if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
        return calcNet(b) - calcNet(a);
      });
      setRecords(hydrated);
      setSummary(periodSummary);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPayroll(month, year); }, [month, year, loadPayroll]);

  const handleMarkPaid = async (id: string) => {
    await markPayrollPaid(id);
    await loadPayroll(month, year);
    setViewRecord(null);
  };

  const handleApplyAdjust = async (id: string, adj: AdjustState) => {
    const record = records.find(r => r.id === id);
    if (!record) return;
    const perf    = Number(adj.bonus)          || 0;
    const advance = Number(adj.advance)        || 0;
    const overtime= Number(adj.overtime)       || 0;
    const other   = Number(adj.otherAllowance) || 0;
    const newDeductions = advance > 0
      ? [...record.deductions.filter(d => d.label !== "Advance"), { label:"Advance", amount: advance }]
      : record.deductions;
    const newAllowances = [
      ...record.allowances,
      ...(overtime > 0 ? [{ label:"Overtime", amount: overtime }] : []),
      ...(other    > 0 ? [{ label:"Other",    amount: other    }] : []),
    ];
    await updatePayrollRecord(id, {
      performanceBonus: record.bonuses.performanceBonus + perf,
      allowances: newAllowances,
      deductions: newDeductions,
      notes: adj.note || record.notes,
    });
    await loadPayroll(month, year);
  };

  const processDrafts = () => {
    Alert.alert("Process Payroll", "Move all draft entries to pending?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Process",
        onPress: async () => {
          await Promise.all(
            records.filter(r => r.status === "draft").map(r => updatePayrollRecord(r.id, {}))
          );
          await loadPayroll(month, year);
        },
      },
    ]);
  };

  const handleExportFullPDF = async () => {
    if (records.length === 0) {
      Alert.alert("No Records", "There are no payroll records to export for this period.");
      return;
    }
    setExportingAll(true);
    const period = `${month} ${year}`;
    const fileName = `Nyamasi_Roselle_Payroll_${period.replace(" ", "")}`;
    const html = await buildFullPayrollHTML(records, period);
    await exportPDF(html, fileName);
    setExportingAll(false);
  };

  const filtered = filterStatus === "all"
    ? records
    : records.filter(r => r.status === filterStatus);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation?.openDrawer()} activeOpacity={0.7}>
          <Menu size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payroll</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        <TouchableOpacity style={st.monthSelector}
          onPress={() => setShowMonthPicker(true)} activeOpacity={0.85}>
          <View style={st.monthSelectorLeft}>
            <FileText size={18} color={COLORS.primary} />
            <View>
              <Text style={st.monthSelectorLabel}>Payroll Period</Text>
              <Text style={st.monthSelectorValue}>{month} {year}</Text>
            </View>
          </View>
          <ChevronDown size={18} color={COLORS.primary} />
        </TouchableOpacity>

        {loading ? (
          <View style={{ alignItems:"center", paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <>
            {summary && (
              <>
                <View style={st.summaryGrid}>
                  <View style={[st.summaryCard, st.summaryCardFull]}>
                    <Text style={st.summaryCardLabel}>Total Net Payroll</Text>
                    <Text style={[st.summaryCardBig, { color: COLORS.success }]}>
                      KES {summary.totalNet.toLocaleString()}
                    </Text>
                    <Text style={st.summaryCardSub}>
                      Gross: KES {summary.totalGross.toLocaleString()}
                    </Text>
                  </View>
                </View>
                <View style={st.summaryRow}>
                  {[
                    { label:"Paid",    val: summary.paidCount,    color: COLORS.paid,       bg: COLORS.paidBg    },
                    { label:"Pending", val: summary.pendingCount, color: COLORS.pending,    bg: COLORS.pendingBg },
                    { label:"Draft",   val: summary.draftCount,   color: COLORS.draft,      bg: COLORS.draftBg   },
                    { label:"Total",   val: records.length,       color: COLORS.accentBlue, bg: COLORS.accentBlueLight },
                  ].map(s => (
                    <View key={s.label} style={[st.summaryMini, { backgroundColor: s.bg }]}>
                      <Text style={[st.summaryMiniVal, { color: s.color }]}>{s.val}</Text>
                      <Text style={[st.summaryMiniLbl, { color: s.color }]}>{s.label}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <View style={st.actionRow}>
              <TouchableOpacity style={st.processBtn} onPress={processDrafts} activeOpacity={0.85}>
                <Clock size={14} color={COLORS.white} />
                <Text style={st.processBtnText}>Process Drafts</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.exportAllBtn, exportingAll && { opacity: 0.6 }]}
                onPress={handleExportFullPDF}
                activeOpacity={0.85}
                disabled={exportingAll}
              >
                {exportingAll
                  ? <ActivityIndicator size="small" color={COLORS.accentBlue} />
                  : <Printer size={14} color={COLORS.accentBlue} />
                }
                <Text style={st.exportAllBtnText}>
                  {exportingAll ? "Generating…" : "Full Payroll PDF"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={st.filterTabs}>
              {(["all","paid","pending","draft"] as const).map(s => (
                <TouchableOpacity key={s}
                  style={[st.filterTab, filterStatus===s && st.filterTabActive]}
                  onPress={() => setFilterStatus(s)} activeOpacity={0.8}>
                  <Text style={[st.filterTabText, filterStatus===s && st.filterTabTextActive]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                    {s !== "all" && ` (${records.filter(r=>r.status===s).length})`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={st.sectionRow}>
              <Text style={st.sectionTitle}>{month} {year} Payroll</Text>
              <Text style={st.sectionCount}>{filtered.length} employees</Text>
            </View>

            {filtered.length === 0 ? (
              <View style={st.emptyState}>
                <Text style={st.emptyText}>No payroll records for this period.</Text>
              </View>
            ) : (
              <View style={st.payList}>
                {filtered.map((record, i) => (
                  <React.Fragment key={record.id}>
                    <PayrollRow
                      record={record}
                      onView={() => setViewRecord(record)}
                      onAdjust={() => setAdjustRecord(record)}
                      onMarkPaid={() => handleMarkPaid(record.id)}
                    />
                    {i < filtered.length - 1 && <View style={st.rowDivider} />}
                  </React.Fragment>
                ))}
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Month Picker Modal */}
      <Modal visible={showMonthPicker} transparent animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}>
        <TouchableOpacity style={st.modalOverlay} activeOpacity={1}
          onPress={() => setShowMonthPicker(false)}>
          <View style={st.pickerSheet}>
            <View style={st.modalHandle} />
            <Text style={st.modalTitle}>Select Period</Text>
            <View style={st.yearRow}>
              {YEARS.map(y => (
                <TouchableOpacity key={y} style={[st.yearBtn, year===y && st.yearBtnActive]}
                  onPress={() => setYear(y)} activeOpacity={0.8}>
                  <Text style={[st.yearBtnText, year===y && st.yearBtnTextActive]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={st.monthGrid}>
              {MONTHS.map(m => (
                <TouchableOpacity key={m} style={[st.monthBtn, month===m && st.monthBtnActive]}
                  onPress={() => { setMonth(m); setShowMonthPicker(false); }} activeOpacity={0.8}>
                  <Text style={[st.monthBtnText, month===m && st.monthBtnTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <PayslipModal
        record={viewRecord}
        visible={!!viewRecord}
        onClose={() => setViewRecord(null)}
        onMarkPaid={() => viewRecord && handleMarkPaid(viewRecord.id)}
      />

      <AdjustModal
        record={adjustRecord}
        visible={!!adjustRecord}
        onClose={() => setAdjustRecord(null)}
        onApply={(adj) => adjustRecord && handleApplyAdjust(adjustRecord.id, adj)}
      />
    </SafeAreaView>
  );
};

// ─── Shared screen styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryDark },
  header: {
    backgroundColor: COLORS.primaryDark,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  menuBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: {
    flex: 1, fontSize: 18, fontWeight: "800", color: COLORS.white,
    textAlign: "center", letterSpacing: 0.3,
  },
  scroll: {
    flex: 1, backgroundColor: COLORS.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -8,
  },
  scrollContent: { paddingTop: 16, paddingHorizontal: 16 },
});

// ─── Payroll-specific styles ──────────────────────────────────────────────────
const st = StyleSheet.create({
  monthSelector: {
    flexDirection:"row", alignItems:"center", justifyContent:"space-between",
    backgroundColor:COLORS.cardBg, borderRadius:16, padding:16, marginBottom:16,
    borderWidth:1.5, borderColor:COLORS.border,
  },
  monthSelectorLeft: { flexDirection:"row", alignItems:"center", gap:12 },
  monthSelectorLabel: { fontSize:10, fontWeight:"700", color:COLORS.textMuted, textTransform:"uppercase" },
  monthSelectorValue: { fontSize:16, fontWeight:"800", color:COLORS.textPrimary },

  summaryGrid: { marginBottom:8 },
  summaryCard: { backgroundColor:COLORS.cardBg, borderRadius:16, padding:16, alignItems:"center" },
  summaryCardFull: { borderWidth:1, borderColor:COLORS.border },
  summaryCardLabel: { fontSize:11, fontWeight:"700", color:COLORS.textMuted, textTransform:"uppercase", marginBottom:4 },
  summaryCardBig: { fontSize:28, fontWeight:"800", letterSpacing:-1 },
  summaryCardSub: { fontSize:12, color:COLORS.textMuted, marginTop:4, fontWeight:"500" },
  summaryRow: { flexDirection:"row", gap:8, marginBottom:16 },
  summaryMini: { flex:1, borderRadius:14, padding:12, alignItems:"center" },
  summaryMiniVal: { fontSize:18, fontWeight:"800" },
  summaryMiniLbl: { fontSize:10, fontWeight:"700", marginTop:2, textTransform:"uppercase" },

  actionRow: { flexDirection:"row", gap:10, marginBottom:14 },
  processBtn: {
    flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:6,
    backgroundColor:COLORS.primary, borderRadius:12, paddingVertical:12,
  },
  processBtnText: { fontSize:13, fontWeight:"800", color:COLORS.white },
  exportAllBtn: {
    flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:6,
    backgroundColor:COLORS.cardBg, borderRadius:12, paddingVertical:12,
    borderWidth:1.5, borderColor:COLORS.accentBlue,
  },
  exportAllBtnText: { fontSize:13, fontWeight:"700", color:COLORS.accentBlue },

  filterTabs: { flexDirection:"row", gap:6, marginBottom:14 },
  filterTab: {
    flex:1, paddingVertical:9, borderRadius:12, alignItems:"center",
    backgroundColor:COLORS.background, borderWidth:1, borderColor:COLORS.border,
  },
  filterTabActive: { backgroundColor:COLORS.primary, borderColor:COLORS.primary },
  filterTabText: { fontSize:11, fontWeight:"700", color:COLORS.textMuted },
  filterTabTextActive: { color:COLORS.white },

  sectionRow: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:10 },
  sectionTitle: { fontSize:14, fontWeight:"800", color:COLORS.textPrimary },
  sectionCount: { fontSize:11, color:COLORS.textMuted, fontWeight:"600" },

  payList: { backgroundColor:COLORS.cardBg, borderRadius:20, overflow:"hidden" },
  payRow: {
    flexDirection:"row", alignItems:"center",
    paddingVertical:12, paddingHorizontal:14, gap:10,
  },
  payRowLeft: { flexDirection:"row", alignItems:"center", gap:10, flex:1 },
  payAvatar: {
    width:42, height:42, borderRadius:21,
    alignItems:"center", justifyContent:"center",
  },
  payAvatarText: { fontSize:14, fontWeight:"800" },
  payName: { fontSize:13, fontWeight:"700", color:COLORS.textPrimary },
  payRole: { fontSize:11, color:COLORS.textMuted, fontWeight:"500", marginTop:1 },
  payRowRight: { alignItems:"flex-end", gap:4 },
  payNet: { fontSize:14, fontWeight:"800" },
  statusChip: { paddingHorizontal:8, paddingVertical:3, borderRadius:8 },
  statusChipText: { fontSize:10, fontWeight:"800" },
  rowActions: { flexDirection:"row", gap:6 },
  rowActionBtn: {
    width:30, height:30, borderRadius:15,
    backgroundColor:COLORS.accentBlueLight,
    alignItems:"center", justifyContent:"center",
  },
  rowDivider: { height:1, backgroundColor:COLORS.border, marginHorizontal:14 },

  emptyState: { alignItems:"center", paddingVertical:40 },
  emptyText: { fontSize:14, color:COLORS.textMuted, fontWeight:"600" },

  // Modal shared
  modalOverlay: { flex:1, backgroundColor:COLORS.overlayBg, justifyContent:"flex-end" },
  payslipSheet: {
    backgroundColor:COLORS.cardBg,
    borderTopLeftRadius:28, borderTopRightRadius:28,
    padding:24, paddingBottom: Platform.OS==="ios" ? 58 : 58,
    maxHeight:"90%",
  },
  modalHandle: {
    width:44, height:5, borderRadius:3,
    backgroundColor:COLORS.border, alignSelf:"center", marginBottom:16,
  },

  // ── X close button — positioned top-right inside the sheet ──
  modalCloseBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  payslipHeader: {
    flexDirection:"row", alignItems:"flex-start",
    justifyContent:"space-between", marginBottom:16,
    paddingRight: 40, // leave room for the X button
  },
  payslipHeroLeft: { flexDirection:"row", alignItems:"flex-start", gap:12, flex:1 },
  payslipAvatar: {
    width:48, height:48, borderRadius:24,
    backgroundColor:COLORS.primaryMuted,
    alignItems:"center", justifyContent:"center",
  },
  payslipAvatarText: { fontSize:16, fontWeight:"800", color:COLORS.primary },
  payslipName: { fontSize:16, fontWeight:"800", color:COLORS.textPrimary },
  payslipRole: { fontSize:12, color:COLORS.textMuted, fontWeight:"500", marginTop:2 },
  payslipPeriod: { fontSize:11, color:COLORS.textMuted, marginTop:2 },

  slipSection: {
    fontSize:12, fontWeight:"700", color:COLORS.textMuted,
    textTransform:"uppercase", letterSpacing:0.5,
    marginTop:14, marginBottom:8,
  },
  slipCard: { backgroundColor:COLORS.background, borderRadius:14, overflow:"hidden" },
  slipRow: { flexDirection:"row", justifyContent:"space-between", padding:12 },
  slipRowBorder: { borderTopWidth:1, borderTopColor:COLORS.border },
  slipLabel: { fontSize:13, color:COLORS.textSecondary },
  slipValue: { fontSize:13, fontWeight:"700", color:COLORS.textPrimary },
  grossRow: { backgroundColor:COLORS.primaryMuted },
  grossLabel: { fontSize:14, fontWeight:"800", color:COLORS.textPrimary },
  grossValue: { fontSize:14, fontWeight:"800", color:COLORS.textPrimary },
  netPayCard: {
    backgroundColor:COLORS.primary, borderRadius:16,
    paddingVertical:18, paddingHorizontal:20,
    flexDirection:"row", justifyContent:"space-between", alignItems:"center",
    marginVertical:14,
  },
  netPayLabel: { fontSize:15, fontWeight:"700", color:"rgba(255,255,255,0.8)" },
  netPayValue: { fontSize:24, fontWeight:"900", color:COLORS.white, letterSpacing:-1 },
  slipActions: { flexDirection:"row", gap:10, marginTop:8 },
  downloadBtn: {
    flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center",
    gap:6, backgroundColor:COLORS.primary, borderRadius:12, paddingVertical:13,
  },
  downloadBtnText: { fontSize:13, fontWeight:"800", color:COLORS.white },
  markPaidBtn: {
    flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center",
    gap:6, backgroundColor:COLORS.success, borderRadius:12, paddingVertical:13,
  },
  markPaidBtnText: { fontSize:13, fontWeight:"800", color:COLORS.white },

  // Adjust modal
  adjustTitleRow: { marginBottom:20 },
  modalTitle: { fontSize:17, fontWeight:"800", color:COLORS.textPrimary },
  adjustSub: { fontSize:12, color:COLORS.textMuted, marginTop:3 },
  adjField: { marginBottom:14 },
  adjLabel: {
    fontSize:11, fontWeight:"700", color:COLORS.textMuted,
    textTransform:"uppercase", letterSpacing:0.5, marginBottom:6,
  },
  adjInput: {
    backgroundColor:COLORS.background, borderRadius:12,
    borderWidth:1.5, borderColor:COLORS.border,
    paddingHorizontal:14, paddingVertical:12,
    fontSize:14, color:COLORS.textPrimary,
  },

  // Month picker
  pickerSheet: {
    backgroundColor:COLORS.cardBg,
    borderTopLeftRadius:28, borderTopRightRadius:28,
    padding:24, paddingBottom: Platform.OS==="ios" ? 58 : 50,
  },
  yearRow: { flexDirection:"row", gap:8, marginBottom:16 },
  yearBtn: {
    flex:1, paddingVertical:10, borderRadius:12,
    borderWidth:1.5, borderColor:COLORS.border, alignItems:"center",
  },
  yearBtnActive: { backgroundColor:COLORS.primary, borderColor:COLORS.primary },
  yearBtnText: { fontSize:13, fontWeight:"700", color:COLORS.textMuted },
  yearBtnTextActive: { color:COLORS.white },
  monthGrid: { flexDirection:"row", flexWrap:"wrap", gap:8 },
  monthBtn: {
    width:"22%", paddingVertical:10, borderRadius:12,
    borderWidth:1.5, borderColor:COLORS.border, alignItems:"center",
  },
  monthBtnActive: { backgroundColor:COLORS.primary, borderColor:COLORS.primary },
  monthBtnText: { fontSize:12, fontWeight:"700", color:COLORS.textMuted },
  monthBtnTextActive: { color:COLORS.white },
});

export default PayrollScreen;