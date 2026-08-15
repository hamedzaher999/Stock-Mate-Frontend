export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

// Shared nested types
export interface RoleRef {
  id: string;
  name: string;
  isSuperAdmin?: boolean;
}

export interface DepartmentRef {
  id: string;
  name: string;
  type?: string;
}

export interface UserRef {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  specialty?: string;
}

export interface UnitRef {
  id: string;
  name: string;
  abbreviation?: string;
}

export interface CategoryRef {
  id: string;
  name: string;
}

export interface ProductRef {
  id: string;
  name: string;
  materialType: string;
  category?: CategoryRef;
}

export interface VariantRef {
  id: string;
  variantName: string;
  sku: string;
  unit: UnitRef;
  product: ProductRef & { categoryId?: string };
  stockSettings?: Array<{
    id: string;
    departmentId: string;
    minimumStock: number;
    maximumStock: number;
  }>;
}

export interface BatchRef {
  id: string;
  batchNumber: string;
  expirationDate?: string;
}

export interface SupplierRef {
  id: string;
  name: string;
  isActive?: boolean;
}

// Full entity types
export interface UserProfile {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  specialty?: string;
  status: string;
  role: RoleRef;
  department?: DepartmentRef;
  permissions: string[];
}

export interface UserListItem {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  specialty?: string;
  status: string;
  roleId: string;
  departmentId?: string;
  role: RoleRef;
  department?: DepartmentRef;
  createdAt: string;
  updatedAt?: string;
}

export interface Department {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  hasQueue: boolean;
  managerId?: string;
  manager?: UserRef;
  createdAt: string;
  updatedAt?: string;
}

export interface Patient {
  id: string;
  fullName: string;
  nationalId?: string;
  familyBookNumber?: string;
  patientId: string;
  registeredById?: string;
  registeredBy?: UserRef;
  createdAt: string;
  updatedAt?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Unit {
  id: string;
  name: string;
  abbreviation?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  parentCategoryId?: string;
  parentCategory?: CategoryRef;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId?: string;
  materialType: string;
  description?: string;
  isActive: boolean;
  category?: CategoryRef;
  createdAt: string;
  updatedAt?: string;
}

export interface VariantListItem {
  id: string;
  productId: string;
  variantName: string;
  sku: string;
  unitId: string;
  isActive: boolean;
  product: { id: string; name: string; materialType: string };
  unit: UnitRef;
}

export interface VariantSupplier {
  id: string;
  supplierId: string;
  expectedPurchasePrice?: number;
  supplierProductCode?: string;
  isPreferred: boolean;
  supplier: SupplierRef;
}

export interface VariantDetail extends VariantListItem {
  product: ProductRef & { categoryId?: string };
  variantSuppliers: VariantSupplier[];
  createdAt: string;
  updatedAt?: string;
}

export interface StockSetting {
  id: string;
  variantId: string;
  departmentId: string;
  storageLocation?: string;
  minimumStock?: number;
  maximumStock?: number;
  isActive: boolean;
  variant: { id: string; variantName: string; sku: string };
  department: DepartmentRef;
  createdAt: string;
  updatedAt?: string;
}
export interface CreateStockSettingResultItem {
  variantId: string;
  success: boolean;
  data?: StockSetting;
  error?: string;
}

export interface CreateStockSettingResult {
  created: number;
  failed: number;
  results: CreateStockSettingResultItem[];
}
export interface BatchStock {
  id: string;
  departmentId: string;
  quantity: number;
  department: DepartmentRef;
}

export interface Batch {
  id: string;
  variantId: string;
  supplierId?: string;
  batchNumber: string;
  quantityReceived: number;
  purchasePrice?: number;
  manufacturingDate?: string;
  expirationDate?: string;
  receivingDate?: string;
  variant: VariantRef;
  supplier?: SupplierRef;
  batchStocks: BatchStock[];
  createdAt: string;
}

export interface LiveStockRow {
  variantId: string;
  variantName: string;
  sku: string;
  unit: UnitRef;
  product: ProductRef;
  totalQuantity: number;
  minimumStock?: number | null;
  maximumStock?: number | null;
  batches: Array<{
    batchId: string;
    batchNumber: string;
    expirationDate?: string;
    quantity: number;
  }>;
}

export interface Adjustment {
  id: string;
  variantId: string;
  departmentId: string;
  batchId: string;
  adjustmentType: string;
  quantity: number;
  notes?: string;
  createdAt: string;
  variant: VariantRef;
  department: DepartmentRef;
  batch: BatchRef;
  reportedBy: UserRef;
}

export interface InventoryTransaction {
  id: string;
  transactionType: string;
  variantId: string;
  batchId: string;
  departmentId: string;
  quantity: number;
  balanceAfter: number;
  referenceType?: string;
  referenceId?: string;
  transactionDate: string;
  notes?: string;
  variant: VariantRef;
  batch: BatchRef;
  department: DepartmentRef;
  performedBy: UserRef;
}

export interface StockCountItem {
  id: string;
  variantId: string;
  batchId: string;
  expectedQuantity: number;
  countedQuantity: number;
  variance: number;
  notes?: string;
  variant: VariantRef;
  batch: BatchRef;
}

export interface StockCountSession {
  id: string;
  departmentId: string;
  department: DepartmentRef;
  initiatedById: string;
  initiatedBy: UserRef;
  status: string;
  countDate: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  items: StockCountItem[];
}

export interface QueueEntry {
  id: string;
  departmentId: string;
  department: DepartmentRef;
  patientId: string;
  patient: Patient;
  status: string;
  addedById: string;
  addedBy: UserRef;
  addedAt: string;
  lockedById?: string;
  lockedBy?: UserRef;
  lockedAt?: string;
  completedAt?: string;
  removedById?: string;
  removedReason?: string;
}

export interface Visit {
  id: string;
  patientId: string;
  doctorId: string;
  departmentId: string;
  queueEntryId: string;
  visitDate: string;
  clinicalNotes?: string;
  diagnosis?: string;
  externalMedications?: string;
  status: string;
  cancelReason?: string;
  cancelledById?: string;
  cancelledAt?: string;
  patient: Patient;
  doctor: UserRef & { specialty?: string };
  department: DepartmentRef;
  createdAt: string;
  updatedAt?: string;
}

export interface PrescriptionItem {
  id: string;
  variantId: string;
  prescribedQuantity: number;
  dosage?: string;
  frequency?: string;
  durationDays?: number;
  dispensedQuantity: number;
  variant: VariantRef;
}

export interface Prescription {
  id: string;
  visitId: string;
  patientId: string;
  doctorId: string;
  status: string;
  frequencyUnit?: string;
  frequencyInterval?: number;
  startDate?: string;
  totalCycles?: number;
  currentCycleNumber?: number;
  currentCycleStart?: string;
  currentCycleEnd?: string;
  currentCycleStatus?: string;
  renewedFromPrescriptionId?: string;
  cancelReason?: string;
  cancelledById?: string;
  cancelledAt?: string;
  patient: Patient;
  doctor: UserRef;
  items: PrescriptionItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface DispenseQueueEntry {
  id: string;
  patientId: string;
  nationalId?: string;
  familyBookNumber?: string;
  patientName: string;
  prescriptionId: string;
  cycleNumber: number;
  medicationSummary: string;
  status: string;
  readySince?: string;
  updatedAt?: string;
}

export interface RefillItem {
  id: string;
  variantId: string;
  requestedQuantity: number;
  approvedQuantity?: number;
  deliveredQuantity?: number;
  quantityDiscrepancy?: number;
  variant: VariantRef;
  deliveryItems?: unknown[];
}

export interface RefillRequest {
  id: string;
  requestNumber: string;
  departmentId: string;
  department: DepartmentRef;
  requestedById: string;
  requestedBy: UserRef;
  status: string;
  priority: string;
  requestType: string;
  frequencyInterval?: number;
  periodicScheduleId?: string;
  hospitalApprovedById?: string;
  hospitalApprovedAt?: string;
  hospitalRejectionReason?: string;
  approvedById?: string;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
  deliveries?: { id: string }[];
  items: RefillItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface DeliveryItem {
  id: string;
  refillItemId: string;
  batchId: string;
  shippedQuantity: number;
  receivedQuantity?: number;
  quantityDiscrepancy?: number;
  batch: BatchRef & { variant: VariantRef };
}

export interface Delivery {
  id: string;
  refillRequestId: string;
  deliveredById: string;
  deliveredAt: string;
  receivedById?: string;
  confirmedAt?: string;
  notes?: string;
  items: DeliveryItem[];
}

export interface PeriodicSchedule {
  id: string;
  departmentId: string;
  department: DepartmentRef;
  createdById: string;
  createdBy: UserRef;
  originRequestId: string;
  originRequest: { id: string; requestNumber: string; priority: string };
  status: string;
  approvalPolicy: string;
  requestType: string;
  frequencyInterval: number;
  hospitalApprovedById?: string;
  hospitalApprovedAt?: string;
  nextRunDate?: string;
  lastGeneratedAt?: string;
  cancelledById?: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PurchaseRequestItem {
  id: string;
  variantId: string;
  requestedQuantity: number;
  estimatedPrice?: number;
  approvedQuantity?: number;
  receivedQuantity?: number;
  notes?: string;
  variant: VariantRef;
}

export interface PurchaseRequest {
  id: string;
  requestNumber: string;
  requestedById: string;
  status: string;
  hospitalApprovedById?: string;
  hospitalApprovedAt?: string;
  hospitalRejectionReason?: string;
  approvedById?: string;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
  requestedBy: UserRef;
  receipts?: { id: string }[];
  items: PurchaseRequestItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface PurchaseReceiptItem {
  id: string;
  purchaseRequestItemId: string;
  variantId: string;
  supplierId?: string;
  expectedQuantity?: number;
  quantity: number;
  quantityDiscrepancy?: number;
  confirmedQuantity?: number;
  confirmedQuantityDiscrepancy?: number;
  purchasePrice?: number;
  batchNumber?: string;
  manufacturingDate?: string;
  expirationDate?: string;
  variant: VariantRef;
  batch?: BatchRef;
}

export interface PurchaseReceiptImage {
  id: string;
  sortOrder: number;
  createdAt: string;
}

export interface PurchaseReceipt {
  id: string;
  purchaseRequestId: string;
  supplierId?: string;
  receivingDate: string;
  type?: string;
  status: string;
  confirmedById?: string;
  confirmedAt?: string;
  notes?: string;
  receivedBy: UserRef;
  confirmedBy?: UserRef;
  images: PurchaseReceiptImage[];
  items: PurchaseReceiptItem[];
  createdAt: string;
}

export interface PurchaseReceiptImageUrl {
  id: string;
  sortOrder: number;
  url: string;
  expiresAt: string;
}

export interface Notification {
  id: string;
  type: string;
  category: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  isSuperAdmin: boolean;
  isActive: boolean;
  rolePermissions: Array<{
    id: string;
    roleId: string;
    permissionId: string;
    permission: Permission;
  }>;
  createdAt: string;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
}

export interface UserPermissionOverride {
  id: string;
  userId: string;
  permissionId: string;
  effect: string;
  reason?: string;
  permission: Permission;
  grantedBy: UserRef;
  createdAt: string;
}

export type ReportGroupBy = "day" | "week" | "month";

export interface ReportSummaryByType {
  count: number;
  totalQuantity: number;
}

export interface AdjustmentsReportSummary {
  totalAdjustments: number;
  totalQuantity: number;
  byAdjustmentType: Array<{
    adjustmentType: string;
    count: number;
    totalQuantity: number;
  }>;
}

export interface AdjustmentsDepartmentBreakdown {
  departmentId: string;
  departmentName: string;
  count: number;
  quantityIncreased: number;
  quantityDecreased: number;
}

export interface AdjustmentsSeriesPoint {
  bucket: string;
  quantityIncreased: number;
  quantityDecreased: number;
}

export interface AdjustmentReportRow {
  id: string;
  variantId: string;
  departmentId: string;
  batchId: string;
  adjustmentType: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdAt: string;
  variant: { id: string; variantName: string; sku: string };
  batch?: { id: string; batchNumber: string };
  department: { id: string; name: string };
  reportedBy: { id: string; fullName: string };
}

export interface AdjustmentsReportResult {
  summary: AdjustmentsReportSummary;
  byDepartment: AdjustmentsDepartmentBreakdown[];
  series: AdjustmentsSeriesPoint[];
  rows: PaginatedResult<AdjustmentReportRow>;
  groupBy: ReportGroupBy;
}

export interface InventoryMovementSummary {
  totalTransactions: number;
  totalQuantityIn: number;
  totalQuantityOut: number;
  netQuantity: number;
  byTransactionType: Array<{
    transactionType: string;
    count: number;
    totalQuantity: number;
  }>;
}

export interface InventoryMovementDepartmentBreakdown {
  departmentId: string;
  departmentName: string;
  count: number;
  quantityIn: number;
  quantityOut: number;
}

export interface InventoryMovementSeriesPoint {
  bucket: string;
  quantityIn: number;
  quantityOut: number;
}

export interface InventoryMovementReportRow {
  id: string;
  transactionType: string;
  variantId: string;
  batchId: string;
  departmentId: string;
  quantity: number;
  balanceAfter: number;
  referenceType?: string;
  referenceId?: string;
  performedById: string;
  transactionDate: string;
  notes?: string;
  variant: { id: string; variantName: string; sku: string };
  batch?: { id: string; batchNumber: string };
  department: { id: string; name: string };
  performedBy: { id: string; fullName: string };
}

export interface InventoryMovementReportResult {
  summary: InventoryMovementSummary;
  byDepartment: InventoryMovementDepartmentBreakdown[];
  series: InventoryMovementSeriesPoint[];
  rows: PaginatedResult<InventoryMovementReportRow>;
  groupBy: ReportGroupBy;
}

export interface PatientVisitsSummary {
  totalVisits: number;
  uniquePatients: number;
  byStatus: Array<{ status: string; count: number }>;
}

export interface PatientVisitsDepartmentBreakdown {
  departmentId: string;
  departmentName: string;
  visitCount: number;
  uniquePatientCount: number;
}

export interface PatientVisitsSeriesPoint {
  bucket: string;
  visitCount: number;
}

export interface PatientVisitsReportRow {
  id: string;
  patientId: string;
  doctorId: string;
  departmentId: string;
  visitDate: string;
  status: string;
  cancelReason?: string;
  patient: {
    id: string;
    fullName: string;
    nationalId?: string;
    patientId?: string;
  };
  doctor: { id: string; fullName: string; specialty?: string };
  department: { id: string; name: string };
}

export interface PatientVisitsReportResult {
  summary: PatientVisitsSummary;
  byDepartment: PatientVisitsDepartmentBreakdown[];
  series: PatientVisitsSeriesPoint[];
  rows: PaginatedResult<PatientVisitsReportRow>;
  groupBy: ReportGroupBy;
}
