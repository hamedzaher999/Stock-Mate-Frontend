import { useTranslation } from "react-i18next";
import { Badge, type BadgeProps } from "@/components/primitive/badge";

type BadgeVariant = BadgeProps["variant"];

const REQUEST_STATUS_MAP: Record<string, BadgeVariant> = {
  draft: "neutral",
  pending_hospital_approval: "warning",
  pending_manager_approval: "warning",
  hospital_rejected: "danger",
  manager_rejected: "danger",
  preparing: "info",
  complete: "success",
  partially_complete: "warning",
  cancelled: "neutral",
};

const STATUS_MAP: Record<string, Record<string, BadgeVariant>> = {
  purchaseRequest: REQUEST_STATUS_MAP,
  refillRequest: REQUEST_STATUS_MAP,
  disposalTransfer: {
    initiated: "warning",
    confirmed: "success",
    cancelled: "neutral",
  },
  purchaseReceipt: {
    pending_confirmation: "warning",
    confirmed: "success",
    cancelled: "neutral",
  },

  stockCount: {
    draft: "warning",
    completed: "success",
  },

  queue: {
    waiting: "warning",
    in_consultation: "info",
    completed: "success",
    removed: "neutral",
  },

  visit: {
    completed: "success",
    cancelled: "neutral",
  },

  prescription: {
    active: "success",
    completed: "neutral",
    cancelled: "danger",
  },

  prescriptionCycle: {
    ready: "success",
    partially_delivered: "warning",
    delivered: "success",
    missed: "danger",
    cancelled: "neutral",
  },

  periodicSchedule: {
    active: "success",
    cancelled: "neutral",
  },

  user: {
    active: "success",
    inactive: "neutral",
  },

  department: {
    active: "success",
    inactive: "neutral",
  },

  adjustment: {
    damaged: "danger",
    expired: "warning",
    shrinkage: "warning",
    found: "success",
  },

  priority: {
    normal: "neutral",
    urgent: "danger",
  },

  material: {
    consumable: "info",
    fixed_asset: "warning",
  },

  transaction: {
    purchase_receipt: "info",
    department_transfer_out: "warning",
    department_transfer_in: "success",
    prescription_dispense: "info",
    department_consumption: "neutral",
    adjustment_damaged: "danger",
    adjustment_expired: "warning",
    adjustment_shrinkage: "warning",
    adjustment_found: "success",
  },

  delivery: {
    pending: "warning",
    confirmed: "success",
  },

  department_type: {
    central_warehouse: "info",
    pharmacy: "success",
    standard: "neutral",
  },

  refillType: {
    normal: "neutral",
    daily: "info",
    weekly: "info",
    monthly: "info",
  },

  batchType: {
    batch: "info",
    final_batch: "success",
  },
};

interface StatusBadgeProps {
  status: string;
  domain: keyof typeof STATUS_MAP;
  className?: string;
}

export default function StatusBadge({
  status,
  domain,
  className,
}: StatusBadgeProps) {
  const { t } = useTranslation("status");
  const map = STATUS_MAP[domain] ?? {};
  const variant: BadgeVariant = map[status] ?? "neutral";
  const label = t(`${domain}.${status}`, {
    defaultValue: status.replace(/_/g, " "),
  });
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
