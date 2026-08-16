export type UserStatus = "active" | "inactive";
export type DepartmentType = "central_warehouse" | "pharmacy" | "standard";
export type OtpChannel = "phone" | "email";
export type SessionPlatform = "web" | "mobile";
export type PermissionEffect = "grant" | "revoke";
// Unified status enum shared by Purchase Requests and Department Refill Requests
export type RequestStatus =
  | "draft"
  | "pending_hospital_approval"
  | "pending_manager_approval"
  | "hospital_rejected"
  | "manager_rejected"
  | "preparing"
  | "complete"
  | "partially_complete"
  | "cancelled";

export type TransactionType =
  | "purchase_receipt"
  | "department_transfer_out"
  | "department_transfer_in"
  | "prescription_dispense"
  | "department_consumption"
  | "adjustment_damaged"
  | "adjustment_expired"
  | "adjustment_shrinkage"
  | "adjustment_found";

export type AdjustmentType = "damaged" | "expired" | "shrinkage" | "found";

export type ReferenceType =
  | "purchase_receipt"
  | "refill_request"
  | "department_refill_delivery_item"
  | "prescription_dispense"
  | "adjustment"
  | "stock_count";

export type StockCountStatus = "draft" | "completed";
export type QueueStatus =
  | "waiting"
  | "in_consultation"
  | "completed"
  | "removed";
export type VisitStatus = "completed" | "cancelled";
export type PrescriptionStatus = "active" | "completed" | "cancelled";
export type CycleStatus =
  | "ready"
  | "partially_delivered"
  | "delivered"
  | "missed"
  | "cancelled";
export type FrequencyUnit = "day" | "week" | "month";
export type RefillRequestPriority = "normal" | "urgent";
export type RefillRequestType = "normal" | "daily" | "weekly" | "monthly";
export type PeriodicScheduleStatus = "active" | "cancelled";
export type ScheduleApprovalPolicy =
  | "auto_approved"
  | "approval_required_each_cycle";
export type PurchaseReceiptStatus =
  | "pending_confirmation"
  | "confirmed"
  | "cancelled";
export type MaterialType = "consumable" | "fixed_asset";
export type NotificationCategory =
  | "inventory"
  | "queue"
  | "pharmacy"
  | "purchasing"
  | "ai_insight";
export type DeliveryType = "batch" | "final_batch";
export type DisposalTransferStatus = "initiated" | "confirmed" | "cancelled";
export type DisposalItemSource = "adjustment" | "near_expiry";
