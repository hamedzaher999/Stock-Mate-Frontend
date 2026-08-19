import { isRejectedWithValue, isFulfilled, Middleware } from "@reduxjs/toolkit";
import { toast } from "sonner";

interface ApiErrorPayload {
  data?: { message?: string };
  status?: number | string;
}

interface ApiSuccessPayload {
  message?: string;
}

function isRtkQueryMutationAction(action: {
  type: string;
  meta?: { arg?: { type?: string; endpointName?: string } };
}): boolean {
  return action.meta?.arg?.type === "mutation";
}

const SILENT_ENDPOINTS = new Set<string>([
  // Auth
  "requestOtp",
  "verifyOtp",

  // Patients
  "createPatient",
  "updatePatient",

  // Department Queue
  "addToQueue",
  "removeFromQueue",

  // Department Refills
  "createDelivery",
  "confirmDelivery",
  "createRefillRequest",

  // Purchasing
  "createPurchaseReceipt",
  "confirmPurchaseReceipt",
  "updatePurchaseReceipt",
  //
  "sendAssistantMessage",
  // Inventory
  "createAdjustment",
  "recordConsumption",
  "addStockCountItem",
  "createStockCount",
  "createStockSetting",

  // Disposal
  "initiateDisposalTransfer",
  "confirmDisposalTransfer",
  "createDisposalSaleRequest",
  "addDisposalSaleImages",
  "confirmDisposalSaleRequest",

  // Destinations
  "createDestination",
  "updateDestination",

  // RBAC
  "createRole",

  // Users
  "updateUser",

  // Medical Visits
  "completeConsultation",
  "selectPatient",
]);

export const toastMiddleware: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action) && isRtkQueryMutationAction(action)) {
    const endpointName = action.meta?.arg?.endpointName;
    if (!endpointName || !SILENT_ENDPOINTS.has(endpointName)) {
      const payload = action.payload as ApiErrorPayload;
      const message =
        payload?.data?.message || "Something went wrong. Please try again.";
      toast.error(message);
    }
  }

  if (isFulfilled(action) && isRtkQueryMutationAction(action)) {
    const endpointName = action.meta?.arg?.endpointName;
    if (!endpointName || !SILENT_ENDPOINTS.has(endpointName)) {
      const payload = action.payload as ApiSuccessPayload;
      const message = payload?.message || "Action completed successfully.";
      toast.success(message);
    }
  }

  return next(action);
};
