import {
  LayoutDashboard,
  Users,
  Building2,
  Stethoscope,
  ClipboardList,
  Pill,
  Package,
  Boxes,
  ArrowLeftRight,
  BarChart3,
  ShoppingCart,
  Truck,
  Archive,
  Settings,
  Bell,
  User,
  Layers,
  Tag,
  Factory,
  Gauge,
  ListOrdered,
  CalendarClock,
  Activity,
  BarChart4,
  Sparkles,
  Trash2,
  Search,
  DollarSign,
} from "lucide-react";
import { PERMISSIONS } from "@/lib/permissions";

export interface NavItem {
  labelKey: string;
  path: string;
  icon: typeof LayoutDashboard;
  permission?: string;
  anyOf?: string[];
}

export interface NavSection {
  titleKey?: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { labelKey: "nav:dashboard", path: "/", icon: LayoutDashboard },

      {
        labelKey: "nav:reports",
        path: "/reports",
        icon: BarChart4,
        permission: PERMISSIONS.VIEW_REPORTS,
      },
      { labelKey: "nav:notifications", path: "/notifications", icon: Bell },
      { labelKey: "nav:profile", path: "/profile", icon: User },
      { labelKey: "nav:assistant", path: "/assistant", icon: Sparkles },
    ],
  },
  {
    titleKey: "nav:sections.disposal",
    items: [
      {
        labelKey: "nav:disposalTransfers",
        path: "/disposal/transfers",
        icon: Trash2,
        permission: PERMISSIONS.VIEW_DISPOSAL,
      },
      {
        labelKey: "nav:disposalCandidates",
        path: "/disposal/candidates",
        icon: Search,
        permission: PERMISSIONS.VIEW_DISPOSAL,
      },
      {
        labelKey: "nav:destinations",
        path: "/destinations",
        icon: Building2,
        permission: PERMISSIONS.MANAGE_DESTINATIONS,
      },
      {
        labelKey: "nav:disposalSales",
        path: "/disposal/sales",
        icon: DollarSign,
        permission: PERMISSIONS.VIEW_DISPOSAL,
      },
    ],
  },
  {
    titleKey: "nav:sections.clinical",
    items: [
      {
        labelKey: "nav:patients",
        path: "/patients",
        icon: Users,
        permission: PERMISSIONS.VIEW_PATIENTS,
      },
      {
        labelKey: "nav:queue",
        path: "/queue",
        icon: ListOrdered,
        permission: PERMISSIONS.MANAGE_DEPARTMENT_QUEUE,
      },
      {
        labelKey: "nav:consultationRoom",
        path: "/consultation",
        icon: Stethoscope,
        permission: PERMISSIONS.START_CONSULTATION,
      },
      {
        labelKey: "nav:visits",
        path: "/visits",
        icon: Activity,
        permission: PERMISSIONS.VIEW_PATIENT_HISTORY,
      },
      {
        labelKey: "nav:prescriptions",
        path: "/prescriptions",
        icon: ClipboardList,
        permission: PERMISSIONS.VIEW_PATIENT_HISTORY,
      },
    ],
  },
  {
    titleKey: "nav:sections.pharmacy",
    items: [
      {
        labelKey: "nav:dispenseQueue",
        path: "/pharmacy/queue",
        icon: Pill,
        permission: PERMISSIONS.DISPENSE_PRESCRIPTION,
      },
    ],
  },
  {
    titleKey: "nav:sections.inventory",
    items: [
      {
        labelKey: "nav:liveStock",
        path: "/inventory/live-stock",
        icon: Boxes,
        permission: PERMISSIONS.VIEW_INVENTORY,
      },
      {
        labelKey: "nav:batches",
        path: "/inventory/batches",
        icon: Archive,
        permission: PERMISSIONS.VIEW_INVENTORY,
      },
      {
        labelKey: "nav:transactions",
        path: "/inventory/transactions",
        icon: ArrowLeftRight,
        permission: PERMISSIONS.VIEW_INVENTORY,
      },
      {
        labelKey: "nav:adjustments",
        path: "/inventory/adjustments",
        icon: BarChart3,
        permission: PERMISSIONS.VIEW_INVENTORY,
      },
      {
        labelKey: "nav:consumption",
        path: "/inventory/consumption",
        icon: Activity,
        permission: PERMISSIONS.RECORD_DEPARTMENT_CONSUMPTION,
      },
      {
        labelKey: "nav:stockCounts",
        path: "/inventory/stock-counts",
        icon: Gauge,
        permission: PERMISSIONS.PERFORM_STOCK_COUNT,
      },
    ],
  },
  {
    titleKey: "nav:sections.departmentRefills",
    items: [
      {
        labelKey: "nav:refillRequests",
        path: "/refills/requests",
        icon: Package,
        anyOf: [
          PERMISSIONS.CREATE_DEPARTMENT_REFILL_REQUEST,
          PERMISSIONS.APPROVE_DEPARTMENT_REFILL_REQUEST_HOSPITAL,
          PERMISSIONS.APPROVE_DEPARTMENT_REFILL_REQUEST_MANAGER,
        ],
      },
      {
        labelKey: "nav:deliveries",
        path: "/refills/deliveries",
        icon: Truck,
        anyOf: [
          PERMISSIONS.PREPARE_DEPARTMENT_REFILL,
          PERMISSIONS.CONFIRM_DEPARTMENT_DELIVERY,
        ],
      },
      {
        labelKey: "nav:periodicSchedules",
        path: "/refills/schedules",
        icon: CalendarClock,
        permission: PERMISSIONS.MANAGE_PERIODIC_REFILL_SCHEDULES,
      },
    ],
  },
  {
    titleKey: "nav:sections.purchasing",
    items: [
      {
        labelKey: "nav:purchaseRequests",
        path: "/purchasing/requests",
        icon: ShoppingCart,
        permission: PERMISSIONS.VIEW_PURCHASING_HISTORY,
      },
      {
        labelKey: "nav:purchaseReceipts",
        path: "/purchasing/receipts",
        icon: Truck,
        permission: PERMISSIONS.VIEW_PURCHASING_HISTORY,
      },
    ],
  },
  {
    titleKey: "nav:sections.administration",
    items: [
      {
        labelKey: "nav:products",
        path: "/catalog/products",
        icon: Layers,
        permission: PERMISSIONS.MANAGE_MATERIALS,
      },
      {
        labelKey: "nav:suppliers",
        path: "/suppliers",
        icon: Factory,
        permission: PERMISSIONS.MANAGE_SUPPLIERS,
      },
      {
        labelKey: "nav:stockSettings",
        path: "/stock-settings",
        icon: Gauge,
        permission: PERMISSIONS.VIEW_INVENTORY,
      },
      {
        labelKey: "nav:departments",
        path: "/departments",
        icon: Building2,
        permission: PERMISSIONS.MANAGE_DEPARTMENTS,
      },
      {
        labelKey: "nav:users",
        path: "/users",
        icon: Users,
        permission: PERMISSIONS.MANAGE_ACCOUNTS,
      },
      {
        labelKey: "nav:roles",
        path: "/rbac/roles",
        icon: Tag,
        permission: PERMISSIONS.MANAGE_ROLES,
      },
      { labelKey: "nav:settings", path: "/settings", icon: Settings },
    ],
  },
];
