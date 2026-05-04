/**
 * InventoryScreen.tsx — Inventory Management for Admin
 * ─────────────────────────────────────────────────────────────────────────────
 * All Supabase logic is in supabaseService.ts / dbService.ts
 * This screen only handles UI and calls service functions
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
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Package,
  AlertTriangle,
  TrendingDown,
  RefreshCw,
  Plus,
  Minus,
  Search,
  X,
  ChevronDown,
  History,
  MapPin,
  User,
  BarChart2,
  Menu,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Truck,
} from "lucide-react-native";

import {
  getEmployees,
  getInventory,
  getInventorySummary,
  getStockTransactions,
  restockInventory,
  adjustInventory,
  initializeInventory,
  PRODUCTS,
  Employee,
  ProductSKU,
  InventoryItem,
  StockTransaction,
  InventorySummary,
} from "../../data/dbService";

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = {
  primary: "#8B0111",
  primaryDark: "#8B0111",
  primaryMuted: "rgba(139,1,17,0.08)",
  primaryMid: "rgba(139,1,17,0.15)",
  white: "#FFFFFF",
  background: "#F0F5FB",
  cardBg: "#FFFFFF",
  textPrimary: "#0D2137",
  textSecondary: "#4A6580",
  textMuted: "#8FA3B8",
  border: "#D6E4F0",
  success: "#00897B",
  successLight: "#E0F2F1",
  warning: "#F57C00",
  warningLight: "#FFF3E0",
  danger: "#C62828",
  dangerLight: "#FFEBEE",
  accentBlue: "#1565C0",
  accentBlueLight: "#E3F0FF",
  overlayBg: "rgba(13,33,55,0.6)",
  purple: "#7B1FA2",
  purpleLight: "#F3E5F5",
  headerAlt: "#FAFCFF",
};

// ─── Inventory Screen Component ───────────────────────────────────────────────
const InventoryScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [summary, setSummary] = useState<InventorySummary>({
    totalItems: 0,
    totalProducts: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    byProduct: [],
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterEmployee, setFilterEmployee] = useState<string>("all");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
  sku: ProductSKU;
  name: string;
  totalQuantity: number;
  locations: number;
  locationBreakdown: Array<{
    employeeName: string;
    location: string;
    quantity: number;
  }>;
} | null>(null);

  const [restockEmployee, setRestockEmployee] = useState<string>("");
  const [restockQtys, setRestockQtys] = useState<Record<string, string>>({});
  const [restocking, setRestocking] = useState(false);
  const [restockNote, setRestockNote] = useState("");

  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // ── Load Data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [inventoryData, employeesData, summaryData] = await Promise.all([
        getInventory(),
        getEmployees("active"),
        getInventorySummary(),
      ]);
      setInventory(inventoryData);
      setEmployees(employeesData);
      setSummary(summaryData);
    } catch (error) {
      console.error("Failed to load inventory:", error);
      Alert.alert("Error", "Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle product card click to show location breakdown
const handleProductClick = (productSku: string) => {
  const productLocations = inventory.filter(item => item.sku === productSku);
  const productInfo = summary.byProduct.find(p => p.sku === productSku);
  
  if (!productInfo) return;

  const locationBreakdown = productLocations.map(item => ({
    employeeName: item.employee_name,
    location: item.location,
    quantity: item.quantity,
  }));

  // Sort by quantity descending
  locationBreakdown.sort((a, b) => b.quantity - a.quantity);

  setSelectedProduct({
    sku: productSku as ProductSKU,
    name: productInfo.name,
    totalQuantity: productInfo.totalQuantity,
    locations: productLocations.length,
    locationBreakdown,
  });
  
  setShowProductModal(true);
};

  // ── Load History ─────────────────────────────────────────────────────────
  const loadHistory = async (inventoryId?: string) => {
    setHistoryLoading(true);
    try {
      const historyData = await getStockTransactions(inventoryId);
      setTransactions(historyData);
      setShowHistoryModal(true);
    } catch (error) {
      console.error("Failed to load history:", error);
      Alert.alert("Error", "Failed to load transaction history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const totalRestockQty = Object.values(restockQtys).reduce(
    (sum, qty) => sum + (parseInt(qty) || 0),
    0
  );

  const handleRestockAll = async () => {
    if (!restockEmployee) {
      Alert.alert("Error", "Please select an employee");
      return;
    }
    const productsToRestock = Object.entries(restockQtys)
      .filter(([_, qty]) => parseInt(qty) > 0)
      .map(([sku, qty]) => ({ sku: sku as ProductSKU, qty: parseInt(qty) }));
    if (productsToRestock.length === 0) {
      Alert.alert("Error", "Enter at least one product quantity");
      return;
    }
    setRestocking(true);
    let successCount = 0;
    let failCount = 0;
    for (const product of productsToRestock) {
      const result = await restockInventory({
        employeeId: restockEmployee,
        sku: product.sku,
        quantity: product.qty,
        note: restockNote || undefined,
      });
      if (result.success) successCount++;
      else failCount++;
    }
    setRestocking(false);
    if (failCount === 0) {
      const employee = employees.find((e) => e.id === restockEmployee);
      Alert.alert(
        "Success",
        `Restocked ${successCount} product(s) with total ${totalRestockQty} items for ${employee?.fullName}`
      );
    } else {
      Alert.alert(
        "Partial Success",
        `${successCount} product(s) restocked, ${failCount} failed. Please try again.`
      );
    }
    setRestockEmployee("");
    setRestockQtys({});
    setRestockNote("");
    setShowRestockModal(false);
    await loadData();
  };

  const handleAdjust = async (item: InventoryItem, adjustment: number) => {
    if (adjustment < 0 && item.quantity <= 0) return;
    const result = await adjustInventory(item.id, adjustment);
    if (result.success) {
      await loadData();
    } else {
      Alert.alert("Error", result.error || "Failed to adjust inventory");
    }
  };

  const handleInitialize = () => {
    Alert.alert(
      "Initialize Inventory",
      "This will create inventory records for all active employees with 0 stock. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Initialize",
          onPress: async () => {
            const result = await initializeInventory();
            if (result.success) {
              Alert.alert("Success", `Created ${result.created} inventory records`);
              await loadData();
            } else {
              Alert.alert("Error", result.error || "Failed to initialize");
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredInventory = inventory.filter((item) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !item.employee_name.toLowerCase().includes(query) &&
        !item.product_name.toLowerCase().includes(query)
      )
        return false;
    }
    if (filterEmployee !== "all" && item.employee_id !== filterEmployee) return false;
    if (showLowStockOnly && item.quantity >= 5) return false;
    return true;
  });

  // ── Stock bar width helper ─────────────────────────────────────────────────
  const getStockBarWidth = (qty: number): string => {
    if (qty === 0) return "0%";
    if (qty >= 40) return "100%";
    return `${Math.round((qty / 40) * 100)}%`;
  };

  const getStockColor = (qty: number) => {
    if (qty === 0) return COLORS.danger;
    if (qty < 5) return COLORS.warning;
    return COLORS.success;
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* ── Header (UNCHANGED) ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => navigation?.openDrawer()}
          activeOpacity={0.7}
        >
          <Menu size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inventory Management</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={handleInitialize}
          activeOpacity={0.7}
        >
          <RefreshCw size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >


        <View style={styles.summaryCard}>
 
  {/* Header label */}
  <View style={styles.summaryHeader}>
    <View style={styles.summaryHeaderDot} />
    <Text style={styles.summaryHeaderLabel}>Stock Summary</Text>
  </View>
 
  {/* Four metrics in a row */}
  <View style={styles.metricsRow}>
 
    <View style={styles.metricCol}>
      <View style={[styles.metricIcon, { backgroundColor: COLORS.accentBlueLight }]}>
        <Package size={15} color={COLORS.accentBlue} />
      </View>
      <Text style={[styles.metricValue, { color: COLORS.accentBlue }]}>
        {summary.totalItems}
      </Text>
      <Text style={styles.metricLabel}>{"Total\nItems"}</Text>
    </View>
 
    <View style={[styles.metricCol, styles.metricColBorder]}>
      <View style={[styles.metricIcon, { backgroundColor: COLORS.successLight }]}>
        <BarChart2 size={15} color={COLORS.success} />
      </View>
      <Text style={[styles.metricValue, { color: COLORS.success }]}>
        {summary.totalProducts}
      </Text>
      <Text style={styles.metricLabel}>Products</Text>
    </View>
 
    <View style={[styles.metricCol, styles.metricColBorder]}>
      <View style={[styles.metricIcon, { backgroundColor: COLORS.warningLight }]}>
        <AlertTriangle size={15} color={COLORS.warning} />
      </View>
      <Text style={[styles.metricValue, { color: COLORS.warning }]}>
        {summary.lowStockItems}
      </Text>
      <Text style={styles.metricLabel}>{"Low\nStock"}</Text>
    </View>
 
    <View style={[styles.metricCol, styles.metricColBorder]}>
      <View style={[styles.metricIcon, { backgroundColor: COLORS.dangerLight }]}>
        <TrendingDown size={15} color={COLORS.danger} />
      </View>
      <Text style={[styles.metricValue, { color: COLORS.danger }]}>
        {summary.outOfStockItems}
      </Text>
      <Text style={styles.metricLabel}>{"Out of\nStock"}</Text>
    </View>
 
  </View>
 
  {/* Divider */}
  <View style={styles.summaryDivider} />
 
  {/* Health bars — low stock */}
  <View style={styles.healthRow}>
    <Text style={[styles.healthLabel, { color: COLORS.warning }]}>Low Stock</Text>
    <View style={styles.healthBarTrack}>
      <View
        style={[
          styles.healthBarFill,
          {
            backgroundColor: COLORS.warning,
            // cap at 100% — assumes ~40 total slots as ceiling
            width: `${Math.min(100, Math.round((summary.lowStockItems / 40) * 100))}%`,
          },
        ]}
      />
    </View>
    <Text style={[styles.healthValue, { color: COLORS.warning }]}>
      {summary.lowStockItems}
    </Text>
  </View>
 
  {/* Health bars — out of stock */}
  <View style={[styles.healthRow, { marginBottom: 4 }]}>
    <Text style={[styles.healthLabel, { color: COLORS.danger }]}>Out of Stock</Text>
    <View style={styles.healthBarTrack}>
      <View
        style={[
          styles.healthBarFill,
          {
            backgroundColor: COLORS.danger,
            width: `${Math.min(100, Math.round((summary.outOfStockItems / 40) * 100))}%`,
          },
        ]}
      />
    </View>
    <Text style={[styles.healthValue, { color: COLORS.danger }]}>
      {summary.outOfStockItems}
    </Text>
  </View>
 
</View>
 
       

     

        {/* ── Products Overview — Horizontal Scroll Strip ── */}
<View style={styles.stripSection}>
  <Text style={styles.stripSectionLabel}>Products Overview</Text>
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.stripScroll}
  >
    {summary.byProduct.map((product) => {
      const color =
        product.totalQuantity === 0
          ? COLORS.danger
          : product.totalQuantity < 10
          ? COLORS.warning
          : COLORS.success;
      const colorBg =
        product.totalQuantity === 0
          ? COLORS.dangerLight
          : product.totalQuantity < 10
          ? COLORS.warningLight
          : COLORS.successLight;
      return (
        <TouchableOpacity 
          key={product.sku} 
          style={styles.productChip}
          onPress={() => handleProductClick(product.sku)}
          activeOpacity={0.7}
        >
          <Text style={styles.productChipName} numberOfLines={1}>
            {product.name}
          </Text>
          <View style={[styles.productChipQtyWrap,
            //  { backgroundColor: colorBg }
             ]}>
            <Text style={[styles.productChipQty, { color: color }]}>
              {product.totalQuantity}
            </Text>
          </View>
          <Text style={styles.productChipLocs}>
            {product.locations} location{product.locations !== 1 ? "s" : ""}
          </Text>
          {/* Add a subtle "tap to view" indicator */}
          <View style={styles.productChipFooter}>
            <Text style={styles.productChipFooterText}>Tap for details</Text>
            <ChevronDown size={8} color={COLORS.textMuted} />
          </View>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
</View>

        {/* ── Actions Bar ── */}
        <View style={styles.actionsBar}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
            onPress={() => setShowRestockModal(true)}
            activeOpacity={0.8}
          >
            <Plus size={16} color={COLORS.white} />
            <Text style={styles.actionBtnText}>Restock</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.accentBlue }]}
            onPress={() => loadHistory()}
            activeOpacity={0.8}
          >
            <History size={16} color={COLORS.white} />
            <Text style={styles.actionBtnText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: showLowStockOnly ? COLORS.warning : COLORS.textSecondary },
            ]}
            onPress={() => setShowLowStockOnly(!showLowStockOnly)}
            activeOpacity={0.8}
          >
            <AlertTriangle size={16} color={COLORS.white} />
            <Text style={styles.actionBtnText}>Low Stock</Text>
          </TouchableOpacity>
        </View>

        {/* ── Search ── */}
        <View style={styles.searchBox}>
          <Search size={14} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by employee or product…"
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={14} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── Employee Filter Pills ── */}
        <View style={styles.filterPills}>
          <TouchableOpacity
            style={[styles.filterPill, filterEmployee === "all" && styles.filterPillActive]}
            onPress={() => setFilterEmployee("all")}
          >
            <Text
              style={[
                styles.filterPillText,
                filterEmployee === "all" && styles.filterPillTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {employees.slice(0, 5).map((emp) => (
            <TouchableOpacity
              key={emp.id}
              style={[
                styles.filterPill,
                filterEmployee === emp.id && styles.filterPillActive,
              ]}
              onPress={() =>
                setFilterEmployee(filterEmployee === emp.id ? "all" : emp.id)
              }
            >
              <Text
                style={[
                  styles.filterPillText,
                  filterEmployee === emp.id && styles.filterPillTextActive,
                ]}
              >
                {emp.firstName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Inventory List ── */}
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderTitle}>Inventory by Location</Text>
          <View style={styles.listHeaderBadge}>
            <Text style={styles.listHeaderBadgeText}>{filteredInventory.length} items</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 30 }} />
        ) : filteredInventory.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Inventory Found</Text>
            <Text style={styles.emptySubtitle}>
              Click "Restock" to add inventory or the refresh icon to initialize all locations.
            </Text>
          </View>
        ) : (
          Array.from(new Set(filteredInventory.map((item) => item.employee_id))).map(
            (empId) => {
              const empItems = filteredInventory.filter((item) => item.employee_id === empId);
              const employee = empItems[0];
              const totalEmpItems = empItems.reduce((sum, item) => sum + item.quantity, 0);
              const lowStockCount = empItems.filter(
                (item) => item.quantity > 0 && item.quantity < 5
              ).length;

              return (
                <View key={empId} style={styles.employeeGroup}>
                  {/* Employee Header */}
                  <View style={styles.employeeGroupHeader}>
                    <View style={styles.employeeInfo}>
                      <View style={styles.employeeAvatar}>
                        <User size={15} color={COLORS.primary} />
                      </View>
                      <View>
                        <Text style={styles.employeeName}>{employee.employee_name}</Text>
                        <View style={styles.locationRow}>
                          <MapPin size={9} color={COLORS.textMuted} />
                          <Text style={styles.locationText}>{employee.location}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.employeeStats}>
                      <Text style={styles.employeeTotalItems}>{totalEmpItems}</Text>
                      <Text style={styles.employeeTotalLabel}>items</Text>
                      {lowStockCount > 0 && (
                        <View style={styles.lowStockBadge}>
                          <AlertTriangle size={9} color={COLORS.warning} />
                          <Text style={styles.lowStockBadgeText}>{lowStockCount} low</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Inventory Rows */}
                  {empItems.map((item) => {
                    const stockColor = getStockColor(item.quantity);
                    const barWidth = getStockBarWidth(item.quantity);

                    return (
                      <View key={item.id} style={styles.inventoryItem}>
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName}>{item.product_name}</Text>
                          <View style={styles.stockLevel}>
                            <View
                              style={[
                                styles.stockIndicator,
                                { backgroundColor: stockColor },
                              ]}
                            />
                            <Text style={[styles.stockQuantity, { color: stockColor }]}>
                              {item.quantity}
                            </Text>
                            <Text style={styles.stockUnit}>units</Text>
                          </View>
                          {/* Stock Progress Bar */}
                          <View style={styles.stockBarTrack}>
                            <View
                              style={[
                                styles.stockBarFill,
                                // { width: barWidth, backgroundColor: stockColor },
                              ]}
                            />
                          </View>
                        </View>
                        <View style={styles.itemActions}>
                          <TouchableOpacity
                            style={[styles.itemActionBtn, { backgroundColor: COLORS.successLight }]}
                            onPress={() => handleAdjust(item, 1)}
                          >
                            <Plus size={13} color={COLORS.success} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.itemActionBtn,
                              { backgroundColor: COLORS.dangerLight },
                              item.quantity === 0 && styles.itemActionBtnDisabled,
                            ]}
                            onPress={() => item.quantity > 0 && handleAdjust(item, -1)}
                            disabled={item.quantity === 0}
                          >
                            <Minus size={13} color={COLORS.danger} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.itemActionBtn,
                              { backgroundColor: COLORS.background },
                            ]}
                            onPress={() => {
                              setSelectedItem(item);
                              loadHistory(item.id);
                            }}
                          >
                            <Clock size={13} color={COLORS.textSecondary} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            }
          )
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Restock Modal (UNCHANGED) ── */}
      <Modal
        visible={showRestockModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRestockModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={() => setShowRestockModal(false)}
          />
          <View style={styles.modalSheet}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowRestockModal(false)}
              activeOpacity={0.7}
            >
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Restock Inventory</Text>
            <Text style={styles.modalSubtitle}>Add stock for a specific employee location</Text>

            <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>
                Select Employee <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setShowEmployeePicker(true)}
              >
                <View style={styles.selectContent}>
                  {restockEmployee ? (
                    <>
                      <View style={styles.selectAvatar}>
                        <User size={14} color={COLORS.primary} />
                      </View>
                      <View style={styles.selectTextContent}>
                        <Text style={styles.selectText}>
                          {employees.find((e) => e.id === restockEmployee)?.fullName ||
                            "Select employee"}
                        </Text>
                        <Text style={styles.selectSubtext}>
                          {employees.find((e) => e.id === restockEmployee)?.assignedArea || ""}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.selectPlaceholder}>Select employee</Text>
                  )}
                </View>
                <ChevronDown size={16} color={COLORS.textMuted} />
              </TouchableOpacity>

              {restockEmployee ? (
                <>
                  <Text style={styles.inputLabel}>
                    Products & Quantities <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <Text style={styles.inputHint}>
                    Enter quantities for products to restock. Leave blank or 0 to skip.
                  </Text>
                  <View style={styles.productsList}>
                    {PRODUCTS.map((product) => (
                      <View key={product.sku} style={styles.productRestockRow}>
                        <View style={styles.productRestockInfo}>
                          <Text style={styles.productRestockName}>{product.name}</Text>
                          <Text style={styles.productRestockCurrent}>
                            Current:{" "}
                            {(() => {
                              const existing = inventory.find(
                                (i) =>
                                  i.employee_id === restockEmployee && i.sku === product.sku
                              );
                              return existing ? `${existing.quantity} units` : "0 units";
                            })()}
                          </Text>
                        </View>
                        <View style={styles.productRestockInput}>
                          <TextInput
                            style={styles.quantityInput}
                            placeholder="0"
                            placeholderTextColor={COLORS.textMuted}
                            keyboardType="numeric"
                            value={restockQtys[product.sku] || ""}
                            onChangeText={(text) => {
                              const cleaned = text.replace(/[^0-9]/g, "");
                              setRestockQtys((prev) => ({
                                ...prev,
                                [product.sku]: cleaned,
                              }));
                            }}
                          />
                          <Text style={styles.quantityUnit}>units</Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {totalRestockQty > 0 && (
                    <View style={styles.restockSummary}>
                      <View style={styles.restockSummaryRow}>
                        <Text style={styles.restockSummaryLabel}>Total Products:</Text>
                        <Text style={styles.restockSummaryValue}>
                          {
                            Object.entries(restockQtys).filter(
                              ([_, qty]) => parseInt(qty) > 0
                            ).length
                          }
                        </Text>
                      </View>
                      <View style={styles.restockSummaryRow}>
                        <Text style={styles.restockSummaryLabel}>Total Items:</Text>
                        <Text style={styles.restockSummaryValue}>{totalRestockQty}</Text>
                      </View>
                    </View>
                  )}

                  <Text style={styles.inputLabel}>Note (Optional)</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="Add a note about this restock..."
                    placeholderTextColor={COLORS.textMuted}
                    multiline
                    numberOfLines={3}
                    value={restockNote}
                    onChangeText={setRestockNote}
                  />

                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      (totalRestockQty === 0 || restocking) && styles.submitBtnDisabled,
                    ]}
                    onPress={handleRestockAll}
                    activeOpacity={0.8}
                    disabled={totalRestockQty === 0 || restocking}
                  >
                    {restocking ? (
                      <>
                        <ActivityIndicator size="small" color={COLORS.white} />
                        <Text style={styles.submitBtnText}>Restocking...</Text>
                      </>
                    ) : (
                      <>
                        <Truck size={18} color={COLORS.white} />
                        <Text style={styles.submitBtnText}>
                          {totalRestockQty > 0
                            ? `Restock ${totalRestockQty} Items`
                            : "Enter quantities to restock"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.selectPrompt}>
                  <Package size={48} color={COLORS.textMuted} />
                  <Text style={styles.selectPromptTitle}>Select an Employee</Text>
                  <Text style={styles.selectPromptSubtitle}>
                    Choose an employee above to view their current stock levels and add inventory.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Employee Picker Modal (UNCHANGED) ── */}
      <Modal
        visible={showEmployeePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEmployeePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEmployeePicker(false)}
        >
          <View style={styles.pickerSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Employee</Text>
            <ScrollView>
              {employees.map((emp) => (
                <TouchableOpacity
                  key={emp.id}
                  style={[
                    styles.pickerItem,
                    restockEmployee === emp.id && styles.pickerItemActive,
                  ]}
                  onPress={() => {
                    setRestockEmployee(emp.id);
                    setShowEmployeePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      restockEmployee === emp.id && styles.pickerItemTextActive,
                    ]}
                  >
                    {emp.fullName}
                  </Text>
                  <Text style={styles.pickerItemSub}>{emp.assignedArea}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── History Modal (UNCHANGED) ── */}
      <Modal
        visible={showHistoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={() => setShowHistoryModal(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedItem
                  ? `${selectedItem.product_name} — ${selectedItem.employee_name}`
                  : "Transaction History"}
              </Text>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            {historyLoading ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 30 }} />
            ) : transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <History size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No Transactions Yet</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 400 }}>
                {transactions.map((transaction) => (
                  <View key={transaction.id} style={styles.historyItem}>
                    <View
                      style={[
                        styles.historyIcon,
                        {
                          backgroundColor:
                            transaction.type === "restock"
                              ? COLORS.successLight
                              : transaction.type === "sale"
                              ? COLORS.accentBlueLight
                              : transaction.type === "return"
                              ? COLORS.purpleLight
                              : COLORS.warningLight,
                        },
                      ]}
                    >
                      {transaction.type === "restock" ? (
                        <ArrowUpRight size={16} color={COLORS.success} />
                      ) : transaction.type === "sale" ? (
                        <ArrowDownRight size={16} color={COLORS.accentBlue} />
                      ) : transaction.type === "return" ? (
                        <RefreshCw size={16} color={COLORS.purple} />
                      ) : (
                        <AlertTriangle size={16} color={COLORS.warning} />
                      )}
                    </View>
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyType}>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </Text>
                      <Text style={styles.historyRef}>{transaction.reference}</Text>
                      <Text style={styles.historyDate}>
                        {new Date(transaction.created_at).toLocaleDateString("en-KE", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    <View style={styles.historyQty}>
                      <Text
                        style={[
                          styles.historyQtyChange,
                          {
                            color:
                              transaction.quantity_change > 0 ? COLORS.success : COLORS.danger,
                          },
                        ]}
                      >
                        {transaction.quantity_change > 0 ? "+" : ""}
                        {transaction.quantity_change}
                      </Text>
                      <Text style={styles.historyNewQty}>{transaction.new_quantity} total</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Product Location Detail Modal ── */}
<Modal
  visible={showProductModal}
  transparent
  animationType="slide"
  onRequestClose={() => setShowProductModal(false)}
>
  <View style={styles.modalOverlay}>
    <TouchableOpacity
      style={StyleSheet.absoluteFillObject}
      onPress={() => setShowProductModal(false)}
    />
    <View style={styles.modalSheet}>
      <TouchableOpacity
        style={styles.modalCloseBtn}
        onPress={() => setShowProductModal(false)}
        activeOpacity={0.7}
      >
        <X size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
      <View style={styles.modalHandle} />

      {selectedProduct && (
        <>
          {/* Product Header */}
          <View style={styles.productModalHeader}>
            <View style={styles.productModalIcon}>
              <Package size={24} color={COLORS.primary} />
            </View>
            <View style={styles.productModalInfo}>
              <Text style={styles.productModalName}>{selectedProduct.name}</Text>
              <View style={styles.productModalStats}>
                <View style={styles.productModalStat}>
                  <Text style={styles.productModalStatValue}>
                    {selectedProduct.totalQuantity}
                  </Text>
                  <Text style={styles.productModalStatLabel}>Total Units</Text>
                </View>
                <View style={styles.productModalDivider} />
                <View style={styles.productModalStat}>
                  <Text style={styles.productModalStatValue}>
                    {selectedProduct.locations}
                  </Text>
                  <Text style={styles.productModalStatLabel}>
                    Location{selectedProduct.locations !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Stock Level Bar */}
          <View style={styles.productModalStockBar}>
            <View style={styles.productModalStockInfo}>
              <Text style={styles.productModalStockLabel}>Stock Level</Text>
              <Text style={styles.productModalStockPercent}>
                {selectedProduct.totalQuantity === 0 
                  ? 'Out of Stock'
                  : selectedProduct.totalQuantity < 5 
                  ? 'Low Stock'
                  : selectedProduct.totalQuantity < 10 
                  ? 'Moderate'
                  : 'Healthy'}
              </Text>
            </View>
            <View style={styles.productModalBarTrack}>
              <View 
                style={[
                  styles.productModalBarFill,
                  { 
                    width: `${Math.min(100, Math.round((selectedProduct.totalQuantity / 40) * 100))}%`,
                    backgroundColor: selectedProduct.totalQuantity === 0 
                      ? COLORS.danger 
                      : selectedProduct.totalQuantity < 5 
                      ? COLORS.warning 
                      : COLORS.success
                  }
                ]} 
              />
            </View>
          </View>

          {/* Location Breakdown */}
          <Text style={styles.productModalSectionTitle}>Location Breakdown</Text>
          
          {selectedProduct.locationBreakdown.length === 0 ? (
            <View style={styles.emptyState}>
              <MapPin size={32} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No Locations Found</Text>
              <Text style={styles.emptySubtitle}>
                This product hasn't been stocked at any location yet.
              </Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {selectedProduct.locationBreakdown.map((location, index) => (
                <View key={index} style={styles.locationRows}>
                  <View style={styles.locationRowLeft}>
                    <View style={[
                      styles.locationDot,
                      { 
                        backgroundColor: location.quantity === 0 
                          ? COLORS.danger 
                          : location.quantity < 5 
                          ? COLORS.warning 
                          : COLORS.success 
                      }
                    ]} />
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationName}>{location.employeeName}</Text>
                      <View style={styles.locationMeta}>
                        <MapPin size={10} color={COLORS.textMuted} />
                        <Text style={styles.locationAddress}>{location.location}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.locationQtyBadge}>
                    <Text style={[
                      styles.locationQtyText,
                      { 
                        color: location.quantity === 0 
                          ? COLORS.danger 
                          : location.quantity < 5 
                          ? COLORS.warning 
                          : COLORS.textPrimary 
                      }
                    ]}>
                      {location.quantity}
                    </Text>
                    <Text style={styles.locationQtyUnit}>units</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Footer Actions */}
          <View style={styles.productModalActions}>
            <TouchableOpacity
              style={[styles.productModalBtn, { backgroundColor: COLORS.primary }]}
              onPress={() => {
                setShowProductModal(false);
                setShowRestockModal(true);
              }}
              activeOpacity={0.8}
            >
              <Plus size={16} color={COLORS.white} />
              <Text style={styles.productModalBtnText}>Restock This Product</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.productModalBtn, { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border }]}
              onPress={() => setShowProductModal(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.productModalBtnText, { color: COLORS.textSecondary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  </View>
</Modal>



    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryDark },

  // ── Header ──
  header: {
    backgroundColor: COLORS.primaryDark,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18, fontWeight: "800", color: COLORS.white,
    textAlign: "center", letterSpacing: 0.3,
  },

  // ── Product Chip Footer ──
productChipFooter: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 3,
  marginTop: 6,
  paddingTop: 6,
  borderTopWidth: 1,
  borderTopColor: COLORS.border,
},
productChipFooterText: {
  fontSize: 8,
  fontWeight: '600',
  color: COLORS.textMuted,
  textTransform: 'uppercase',
  letterSpacing: 0.3,
},

// ── Product Modal ──
productModalHeader: {
  flexDirection: 'row',
  gap: 14,
  marginBottom: 20,
},
productModalIcon: {
  width: 56,
  height: 56,
  borderRadius: 16,
  backgroundColor: COLORS.primaryMuted,
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 1.5,
  borderColor: COLORS.primaryMid,
},
productModalInfo: {
  flex: 1,
  justifyContent: 'center',
},
productModalName: {
  fontSize: 18,
  fontWeight: '800',
  color: COLORS.textPrimary,
  marginBottom: 8,
},
productModalStats: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
},
productModalStat: {
  alignItems: 'center',
},
productModalStatValue: {
  fontSize: 18,
  fontWeight: '900',
  color: COLORS.textPrimary,
  lineHeight: 20,
},
productModalStatLabel: {
  fontSize: 9,
  fontWeight: '600',
  color: COLORS.textMuted,
  textTransform: 'uppercase',
  marginTop: 2,
},
productModalDivider: {
  width: 1,
  height: 28,
  backgroundColor: COLORS.border,
},

// ── Product Modal Stock Bar ──
productModalStockBar: {
  backgroundColor: COLORS.background,
  borderRadius: 12,
  padding: 12,
  marginBottom: 16,
},
productModalStockInfo: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
},
productModalStockLabel: {
  fontSize: 11,
  fontWeight: '700',
  color: COLORS.textSecondary,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
},
productModalStockPercent: {
  fontSize: 11,
  fontWeight: '700',
  color: COLORS.textMuted,
},
productModalBarTrack: {
  height: 6,
  backgroundColor: COLORS.white,
  borderRadius: 3,
  overflow: 'hidden',
},
productModalBarFill: {
  height: '100%',
  borderRadius: 3,
},

// ── Product Modal Section ──
productModalSectionTitle: {
  fontSize: 12,
  fontWeight: '800',
  color: COLORS.textSecondary,
  textTransform: 'uppercase',
  letterSpacing: 0.6,
  marginBottom: 12,
},

// ── Location Rows ──
locationRows: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingVertical: 12,
  paddingHorizontal: 4,
  borderBottomWidth: 1,
  borderBottomColor: COLORS.border,
},
locationRowLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  flex: 1,
},
locationDot: {
  width: 10,
  height: 10,
  borderRadius: 5,
},
locationInfo: {
  flex: 1,
},
locationName: {
  fontSize: 13,
  fontWeight: '700',
  color: COLORS.textPrimary,
},
locationMeta: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  marginTop: 3,
},
locationAddress: {
  fontSize: 11,
  color: COLORS.textMuted,
  fontWeight: '500',
},
locationQtyBadge: {
  alignItems: 'center',
  backgroundColor: COLORS.background,
  borderRadius: 8,
  paddingHorizontal: 10,
  paddingVertical: 6,
  minWidth: 60,
},
locationQtyText: {
  fontSize: 15,
  fontWeight: '800',
  lineHeight: 18,
},
locationQtyUnit: {
  fontSize: 9,
  fontWeight: '600',
  color: COLORS.textMuted,
  textTransform: 'uppercase',
  marginTop: 1,
},

// ── Product Modal Actions ──
productModalActions: {
  flexDirection: 'row',
  gap: 8,
  marginTop: 20,
},
productModalBtn: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  borderRadius: 12,
  paddingVertical: 13,
},
productModalBtnText: {
  fontSize: 13,
  fontWeight: '700',
  color: COLORS.white,
},

  // ── Scroll ──
  scroll: { flex: 1, backgroundColor: COLORS.background, marginTop: -8 },
  scrollContent: { paddingTop: 16, paddingHorizontal: 14, paddingBottom: 16 },

 summaryCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    overflow: "hidden",
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 0,
  },
  summaryHeaderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  summaryHeaderLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
 
  // ── Four-column metrics ──
  metricsRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  metricCol: {
    flex: 1,
    alignItems: "center",
    paddingTop: 14,
    paddingBottom: 16,
    gap: 5,
  },
  metricColBorder: {
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  metricIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 28,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
    lineHeight: 13,
  },
 
  // ── Divider ──
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
 
  // ── Health bars ──
  healthRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  healthLabel: {
    fontSize: 11,
    fontWeight: "700",
    minWidth: 80,
  },
  healthBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: 3,
    overflow: "hidden",
  },
  healthBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  healthValue: {
    fontSize: 13,
    fontWeight: "900",
    minWidth: 20,
    textAlign: "right",
  },





  // ── Stats ──
  statsGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16,
  },
  statCard: {
    width: "47.5%",
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    gap: 4,
  },
  statCardBlue:  { borderTopColor: COLORS.accentBlue,  borderTopWidth: 3 },
  statCardGreen: { borderTopColor: COLORS.success,      borderTopWidth: 3 },
  statCardWarn:  { borderTopColor: COLORS.warning,      borderTopWidth: 3 },
  statCardRed:   { borderTopColor: COLORS.danger,       borderTopWidth: 3 },
  statAccentBar: { display: "none" }, // top border used instead
  statIconWrap: {
    width: 34, height: 34, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
    marginBottom: 8,
  },
  statValue: { fontSize: 30, fontWeight: "900", letterSpacing: -1, lineHeight: 34 },
  statLabel: {
    fontSize: 10, fontWeight: "700", color: COLORS.textMuted,
    textTransform: "uppercase", letterSpacing: 0.6,
  },

  // ── Products Horizontal Strip ──
  stripSection: { marginBottom: 14 },
  stripSectionLabel: {
    fontSize: 11, fontWeight: "800", color: COLORS.textSecondary,
    textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8,
  },
  stripScroll: { paddingRight: 4, gap: 8, flexDirection: "row" },
  productChip: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    minWidth: 110,
  },
  productChipName: {
    fontSize: 11, fontWeight: "700", color: COLORS.textSecondary,
    marginBottom: 6,
  },
  productChipQtyWrap: {
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    alignSelf: "flex-start", marginBottom: 6,
  },
  productChipQty: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  productChipLocs: { fontSize: 10, color: COLORS.textMuted, fontWeight: "500" },

  // ── Actions ──
  actionsBar: { flexDirection: "row", gap: 8, marginBottom: 12 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, borderRadius: 12, paddingVertical: 11,
  },
  actionBtnText: { fontSize: 12, fontWeight: "700", color: COLORS.white },

  // ── Search ──
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.cardBg, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.textPrimary },

  // ── Filter Pills ──
  filterPills: { flexDirection: "row", gap: 6, marginBottom: 12, flexWrap: "wrap" },
  filterPill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border,
  },
  filterPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterPillText: { fontSize: 11, fontWeight: "600", color: COLORS.textMuted },
  filterPillTextActive: { color: COLORS.white },

  // ── List Header ──
  listHeader: {
    flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10,
  },
  listHeaderTitle: {
    fontSize: 11, fontWeight: "800", color: COLORS.textSecondary,
    textTransform: "uppercase", letterSpacing: 0.6,
  },
  listHeaderBadge: {
    backgroundColor: COLORS.primaryMuted, borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  listHeaderBadgeText: { fontSize: 10, fontWeight: "700", color: COLORS.primary },

  // ── Employee Group ──
  employeeGroup: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    overflow: "hidden",
  },
  employeeGroupHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 12,
    backgroundColor: COLORS.headerAlt,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  employeeInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  employeeAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1.5, borderColor: COLORS.primaryMid,
    alignItems: "center", justifyContent: "center",
  },
  employeeName: { fontSize: 13, fontWeight: "800", color: COLORS.textPrimary },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  locationText: { fontSize: 10, color: COLORS.textMuted, fontWeight: "500" },
  employeeStats: { alignItems: "flex-end", gap: 2 },
  employeeTotalItems: { fontSize: 18, fontWeight: "900", color: COLORS.textPrimary, lineHeight: 20 },
  employeeTotalLabel: { fontSize: 9, fontWeight: "600", color: COLORS.textMuted, textTransform: "uppercase" },
  lowStockBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: COLORS.warningLight, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2, marginTop: 2,
  },
  lowStockBadgeText: { fontSize: 9, fontWeight: "700", color: COLORS.warning },

  // ── Inventory Item Row ──
  inventoryItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  itemInfo: { flex: 1, gap: 3 },
  itemName: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary },
  stockLevel: { flexDirection: "row", alignItems: "center", gap: 5 },
  stockIndicator: { width: 7, height: 7, borderRadius: 4 },
  stockQuantity: { fontSize: 14, fontWeight: "900" },
  stockUnit: { fontSize: 10, fontWeight: "500", color: COLORS.textMuted },
  stockBarTrack: {
    height: 3, backgroundColor: COLORS.border,
    borderRadius: 2, marginTop: 4, width: 80, overflow: "hidden",
  },
  stockBarFill: { height: "100%", borderRadius: 2 },
  itemActions: { flexDirection: "row", gap: 5, marginLeft: 10 },
  itemActionBtn: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  itemActionBtnDisabled: { opacity: 0.35 },

  // ── Empty State ──
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary },
  emptySubtitle: {
    fontSize: 12, color: COLORS.textMuted, textAlign: "center", lineHeight: 18,
  },

  // ── Modal Base (UNCHANGED) ──
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlayBg, justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: COLORS.cardBg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: "80%",
  },
  modalHandle: {
    width: 44, height: 5, borderRadius: 3, backgroundColor: COLORS.border,
    alignSelf: "center", marginBottom: 20,
  },
  modalTitle: { fontSize: 17, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 16 },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 16,
  },
  modalCloseBtn: {
    position: "absolute", top: 16, right: 16, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: "center", justifyContent: "center",
  },
  modalSubtitle: {
    fontSize: 13, color: COLORS.textMuted, textAlign: "center",
    marginBottom: 20, fontWeight: "500",
  },

  // ── Form Elements (UNCHANGED) ──
  inputLabel: {
    fontSize: 12, fontWeight: "700", color: COLORS.textSecondary,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, marginTop: 12,
  },
  requiredStar: { color: COLORS.danger },
  inputHint: {
    fontSize: 11, color: COLORS.textMuted, marginBottom: 10, marginTop: -2, fontStyle: "italic",
  },
  selectInput: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: COLORS.background, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  selectContent: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  selectAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primaryMuted,
    alignItems: "center", justifyContent: "center",
  },
  selectTextContent: { flex: 1 },
  selectText: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  selectSubtext: { fontSize: 11, color: COLORS.textMuted, fontWeight: "500", marginTop: 2 },
  selectPlaceholder: { fontSize: 14, color: COLORS.textMuted },
  textInput: {
    backgroundColor: COLORS.background, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1.5, borderColor: COLORS.border,
    fontSize: 15, fontWeight: "600", color: COLORS.textPrimary,
  },
  textArea: { height: 80, textAlignVertical: "top" },

  // ── Products List in Modal (UNCHANGED) ──
  productsList: {
    backgroundColor: COLORS.background, borderRadius: 12,
    overflow: "hidden", marginBottom: 12,
  },
  productRestockRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  productRestockInfo: { flex: 1, marginRight: 12 },
  productRestockName: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  productRestockCurrent: { fontSize: 11, color: COLORS.textMuted, fontWeight: "500", marginTop: 3 },
  productRestockInput: { flexDirection: "row", alignItems: "center", gap: 6 },
  quantityInput: {
    width: 60, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 8, textAlign: "center",
    fontSize: 15, fontWeight: "700", color: COLORS.textPrimary,
    paddingVertical: 8, backgroundColor: COLORS.cardBg,
  },
  quantityUnit: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },

  // ── Restock Summary (UNCHANGED) ──
  restockSummary: {
    backgroundColor: COLORS.primaryMuted, borderRadius: 12,
    padding: 12, marginBottom: 12, gap: 6,
  },
  restockSummaryRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  restockSummaryLabel: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary },
  restockSummaryValue: { fontSize: 16, fontWeight: "800", color: COLORS.primary },

  // ── Submit Button (UNCHANGED) ──
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 14, marginTop: 16,
  },
  submitBtnText: { fontSize: 14, fontWeight: "800", color: COLORS.white },
  submitBtnDisabled: { opacity: 0.5 },

  // ── Select Prompt (UNCHANGED) ──
  selectPrompt: { alignItems: "center", paddingVertical: 30, gap: 12 },
  selectPromptTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary },
  selectPromptSubtitle: {
    fontSize: 12, color: COLORS.textMuted, textAlign: "center",
    lineHeight: 18, paddingHorizontal: 20,
  },

  // ── Picker (UNCHANGED) ──
  pickerSheet: {
    backgroundColor: COLORS.cardBg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: "60%",
  },
  pickerItem: {
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, marginBottom: 4,
  },
  pickerItemActive: { backgroundColor: COLORS.primaryMuted },
  pickerItemText: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  pickerItemTextActive: { color: COLORS.primary },
  pickerItemSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  // ── History (UNCHANGED) ──
  historyItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  historyIcon: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  historyInfo: { flex: 1, gap: 2 },
  historyType: { fontSize: 12, fontWeight: "700", color: COLORS.textPrimary },
  historyRef: { fontSize: 11, color: COLORS.textSecondary },
  historyDate: { fontSize: 10, color: COLORS.textMuted },
  historyQty: { alignItems: "flex-end", gap: 2 },
  historyQtyChange: { fontSize: 14, fontWeight: "800" },
  historyNewQty: { fontSize: 10, color: COLORS.textMuted, fontWeight: "500" },
});

export default InventoryScreen;