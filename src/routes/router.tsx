import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import PermissionRoute from "./PermissionRoute";
import ShellLayout from "@/components/shared/ShellLayout";
import LoginPage from "@/features/auth/pages/LoginPage";
import { PERMISSIONS } from "@/lib/permissions";

// Lazy page imports
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/primitive/skeleton";

const Loader = () => (
  <div className="space-y-3 p-4">
    <Skeleton className="h-8 w-64" />
    <Skeleton className="h-64 w-full" />
  </div>
);

const wrap = (
  Component: React.LazyExoticComponent<() => React.ReactElement>,
) => (
  <Suspense fallback={<Loader />}>
    <Component />
  </Suspense>
);

const DashboardPage = lazy(() => import("@/features/dashboard/DashboardPage"));
const PatientsPage = lazy(
  () => import("@/features/patients/pages/PatientsPage"),
);
const DestinationsPage = lazy(
  () => import("@/features/destinations/pages/DestinationsPage"),
);
const DisposalSalesPage = lazy(
  () => import("@/features/disposal-sales/pages/DisposalSalesPage"),
);
const DisposalSaleDetailPage = lazy(
  () => import("@/features/disposal-sales/pages/DisposalSaleDetailPage"),
);
const DisposalCandidatesPage = lazy(
  () => import("@/features/disposal/pages/DisposalCandidatesPage"),
);
const ReportsPage = lazy(() => import("@/features/reports/pages/ReportsPage"));

const PatientDetailPage = lazy(
  () => import("@/features/patients/pages/PatientDetailPage"),
);
const MySessionsPage = lazy(
  () => import("@/features/users/pages/MySessionsPage"),
);
const DisposalTransfersPage = lazy(
  () => import("@/features/disposal/pages/DisposalTransfersPage"),
);
const DisposalTransferDetailPage = lazy(
  () => import("@/features/disposal/pages/DisposalTransferDetailPage"),
);
const QueuePage = lazy(
  () => import("@/features/department-queue/pages/QueuePage"),
);
const ConsultationPage = lazy(
  () => import("@/features/medical-visits/pages/ConsultationPage"),
);
const VisitsPage = lazy(
  () => import("@/features/medical-visits/pages/VisitsPage"),
);
const PrescriptionsPage = lazy(
  () => import("@/features/prescriptions/pages/PrescriptionsPage"),
);
const PrescriptionDetailPage = lazy(
  () => import("@/features/prescriptions/pages/PrescriptionDetailPage"),
);
const DispenseQueuePage = lazy(
  () => import("@/features/pharmacy/pages/DispenseQueuePage"),
);
const LiveStockPage = lazy(
  () => import("@/features/inventory/pages/LiveStockPage"),
);
const BatchesPage = lazy(
  () => import("@/features/inventory/pages/BatchesPage"),
);
const TransactionsPage = lazy(
  () => import("@/features/inventory/pages/TransactionsPage"),
);
const AdjustmentsPage = lazy(
  () => import("@/features/inventory/pages/AdjustmentsPage"),
);
const ConsumptionPage = lazy(
  () => import("@/features/inventory/pages/ConsumptionPage"),
);
const StockCountsPage = lazy(
  () => import("@/features/inventory/pages/StockCountsPage"),
);
const StockCountDetailPage = lazy(
  () => import("@/features/inventory/pages/StockCountDetailPage"),
);
const RefillRequestsPage = lazy(
  () => import("@/features/department-refills/pages/RefillRequestsPage"),
);
const RefillRequestDetailPage = lazy(
  () => import("@/features/department-refills/pages/RefillRequestDetailPage"),
);
const DeliveriesPage = lazy(
  () => import("@/features/department-refills/pages/DeliveriesPage"),
);
const DeliveryDetailPage = lazy(
  () => import("@/features/department-refills/pages/DeliveryDetailPage"),
);
const PeriodicSchedulesPage = lazy(
  () => import("@/features/department-refills/pages/PeriodicSchedulesPage"),
);
const PurchaseRequestsPage = lazy(
  () => import("@/features/purchasing/pages/PurchaseRequestsPage"),
);
const PurchaseRequestDetailPage = lazy(
  () => import("@/features/purchasing/pages/PurchaseRequestDetailPage"),
);
const PurchaseReceiptsPage = lazy(
  () => import("@/features/purchasing/pages/PurchaseReceiptsPage"),
);
const ProductsPage = lazy(
  () => import("@/features/catalog/pages/ProductsPage"),
);
const SuppliersPage = lazy(
  () => import("@/features/suppliers/pages/SuppliersPage"),
);
const StockSettingsPage = lazy(
  () => import("@/features/stock-settings/pages/StockSettingsPage"),
);
const DepartmentsPage = lazy(
  () => import("@/features/departments/pages/DepartmentsPage"),
);
const UsersPage = lazy(() => import("@/features/users/pages/UsersPage"));
const UserDetailPage = lazy(
  () => import("@/features/users/pages/UserDetailPage"),
);
const AssistantPage = lazy(
  () => import("@/features/assistant/pages/AssistantPage"),
);
const VisitDetailPage = lazy(
  () => import("@/features/medical-visits/pages/VisitDetailPage"),
);
const RolesPage = lazy(() => import("@/features/rbac/pages/RolesPage"));
const NotificationsPage = lazy(
  () => import("@/features/notifications/pages/NotificationsPage"),
);
const ProfilePage = lazy(() => import("@/features/users/pages/ProfilePage"));
const SettingsPage = lazy(() => import("@/features/settings/SettingsPage"));
const PurchaseReceiptCreatePage = lazy(
  () => import("@/features/purchasing/pages/PurchaseReceiptCreatePage"),
);
const PurchaseReceiptDetailPage = lazy(
  () => import("@/features/purchasing/pages/PurchaseReceiptDetailPage"),
);

const NotFoundPage = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
    <p className="text-6xl font-bold text-muted">404</p>
    <p className="text-lg font-medium">Page not found</p>
    <a href="/" className="text-primary hover:underline text-sm">
      Go to dashboard
    </a>
  </div>
);

const ForbiddenPage = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
    <p className="text-6xl font-bold text-danger/30">403</p>
    <p className="text-lg font-medium">Access denied</p>
    <p className="text-sm text-muted-foreground">
      You don't have permission to view this page.
    </p>
    <a href="/" className="text-primary hover:underline text-sm">
      Go to dashboard
    </a>
  </div>
);

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <ShellLayout />,
        children: [
          { path: "/", element: wrap(DashboardPage) },
          { path: "/profile", element: wrap(ProfilePage) },
          { path: "/settings", element: wrap(SettingsPage) },
          { path: "/notifications", element: wrap(NotificationsPage) },
          { path: "/my-sessions", element: wrap(MySessionsPage) },
          { path: "/assistant", element: wrap(AssistantPage) },
          // Patients
          {
            element: <PermissionRoute permission={PERMISSIONS.VIEW_PATIENTS} />,
            children: [
              { path: "/patients", element: wrap(PatientsPage) },
              { path: "/patients/:id", element: wrap(PatientDetailPage) },
            ],
          },

          // Queue
          { path: "/queue", element: wrap(QueuePage) },

          // Consultation
          {
            element: (
              <PermissionRoute permission={PERMISSIONS.START_CONSULTATION} />
            ),
            children: [
              { path: "/consultation", element: wrap(ConsultationPage) },
            ],
          },

          // Visits
          {
            element: (
              <PermissionRoute permission={PERMISSIONS.VIEW_PATIENT_HISTORY} />
            ),
            children: [
              { path: "/visits", element: wrap(VisitsPage) },
              { path: "/visits/:id", element: wrap(VisitDetailPage) },
              { path: "/prescriptions", element: wrap(PrescriptionsPage) },
              {
                path: "/prescriptions/:id",
                element: wrap(PrescriptionDetailPage),
              },
            ],
          },

          // Pharmacy
          {
            element: (
              <PermissionRoute permission={PERMISSIONS.DISPENSE_PRESCRIPTION} />
            ),
            children: [
              { path: "/pharmacy/queue", element: wrap(DispenseQueuePage) },
            ],
          },

          // Inventory
          {
            element: (
              <PermissionRoute permission={PERMISSIONS.VIEW_INVENTORY} />
            ),
            children: [
              { path: "/inventory/live-stock", element: wrap(LiveStockPage) },
              { path: "/inventory/batches", element: wrap(BatchesPage) },
              {
                path: "/inventory/transactions",
                element: wrap(TransactionsPage),
              },
              {
                path: "/inventory/adjustments",
                element: wrap(AdjustmentsPage),
              },
            ],
          },
          {
            element: (
              <PermissionRoute
                permission={PERMISSIONS.RECORD_DEPARTMENT_CONSUMPTION}
              />
            ),
            children: [
              {
                path: "/inventory/consumption",
                element: wrap(ConsumptionPage),
              },
            ],
          },
          {
            element: (
              <PermissionRoute permission={PERMISSIONS.PERFORM_STOCK_COUNT} />
            ),
            children: [
              {
                path: "/inventory/stock-counts",
                element: wrap(StockCountsPage),
              },
              {
                path: "/inventory/stock-counts/:id",
                element: wrap(StockCountDetailPage),
              },
            ],
          },

          // Refills
          {
            element: (
              <PermissionRoute
                anyOf={[
                  PERMISSIONS.CREATE_DEPARTMENT_REFILL_REQUEST,
                  PERMISSIONS.APPROVE_DEPARTMENT_REFILL_REQUEST_HOSPITAL,
                  PERMISSIONS.APPROVE_DEPARTMENT_REFILL_REQUEST_MANAGER,
                ]}
              />
            ),
            children: [
              { path: "/refills/requests", element: wrap(RefillRequestsPage) },
              {
                path: "/refills/requests/:id",
                element: wrap(RefillRequestDetailPage),
              },
            ],
          },
          {
            element: (
              <PermissionRoute
                anyOf={[
                  PERMISSIONS.PREPARE_DEPARTMENT_REFILL,
                  PERMISSIONS.CONFIRM_DEPARTMENT_DELIVERY,
                ]}
              />
            ),
            children: [
              { path: "/refills/deliveries", element: wrap(DeliveriesPage) },
              {
                path: "/refills/deliveries/:id",
                element: wrap(DeliveryDetailPage),
              },
            ],
          },
          {
            element: (
              <PermissionRoute
                permission={PERMISSIONS.MANAGE_PERIODIC_REFILL_SCHEDULES}
              />
            ),
            children: [
              {
                path: "/refills/schedules",
                element: wrap(PeriodicSchedulesPage),
              },
            ],
          },
          {
            element: <PermissionRoute permission={PERMISSIONS.VIEW_DISPOSAL} />,
            children: [
              {
                path: "/disposal/transfers",
                element: wrap(DisposalTransfersPage),
              },
              {
                path: "/disposal/transfers/:id",
                element: wrap(DisposalTransferDetailPage),
              },
              {
                path: "/disposal/candidates",
                element: wrap(DisposalCandidatesPage),
              },
            ],
          },
          //
          {
            element: (
              <PermissionRoute permission={PERMISSIONS.MANAGE_DESTINATIONS} />
            ),
            children: [
              { path: "/destinations", element: wrap(DestinationsPage) },
            ],
          },
          {
            element: <PermissionRoute permission={PERMISSIONS.VIEW_DISPOSAL} />,
            children: [
              { path: "/disposal/sales", element: wrap(DisposalSalesPage) },
              {
                path: "/disposal/sales/:id",
                element: wrap(DisposalSaleDetailPage),
              },
            ],
          },
          // Purchasing
          {
            element: (
              <PermissionRoute
                permission={PERMISSIONS.VIEW_PURCHASING_HISTORY}
              />
            ),
            children: [
              {
                path: "/purchasing/requests",
                element: wrap(PurchaseRequestsPage),
              },
              {
                path: "/purchasing/requests/:id",
                element: wrap(PurchaseRequestDetailPage),
              },
              {
                path: "/purchasing/receipts",
                element: wrap(PurchaseReceiptsPage),
              },
              {
                path: "/purchasing/receipts/:id",
                element: wrap(PurchaseReceiptDetailPage),
              },
            ],
          },
          {
            element: (
              <PermissionRoute permission={PERMISSIONS.RECEIVE_PURCHASE} />
            ),
            children: [
              {
                path: "/purchasing/receipts/new",
                element: wrap(PurchaseReceiptCreatePage),
              },
            ],
          },

          // Catalog
          {
            element: (
              <PermissionRoute permission={PERMISSIONS.MANAGE_MATERIALS} />
            ),
            children: [
              { path: "/catalog/products", element: wrap(ProductsPage) },
            ],
          },

          // Suppliers
          {
            element: (
              <PermissionRoute permission={PERMISSIONS.MANAGE_SUPPLIERS} />
            ),
            children: [{ path: "/suppliers", element: wrap(SuppliersPage) }],
          },

          // Stock settings
          { path: "/stock-settings", element: wrap(StockSettingsPage) },
          // Reports
          {
            element: <PermissionRoute permission={PERMISSIONS.VIEW_REPORTS} />,
            children: [{ path: "/reports", element: wrap(ReportsPage) }],
          },
          // Admin
          {
            element: (
              <PermissionRoute permission={PERMISSIONS.MANAGE_DEPARTMENTS} />
            ),
            children: [
              { path: "/departments", element: wrap(DepartmentsPage) },
            ],
          },
          {
            element: (
              <PermissionRoute permission={PERMISSIONS.MANAGE_ACCOUNTS} />
            ),
            children: [
              { path: "/users", element: wrap(UsersPage) },
              { path: "/users/:id", element: wrap(UserDetailPage) },
            ],
          },
          {
            element: <PermissionRoute permission={PERMISSIONS.MANAGE_ROLES} />,
            children: [{ path: "/rbac/roles", element: wrap(RolesPage) }],
          },

          { path: "/403", element: <ForbiddenPage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
