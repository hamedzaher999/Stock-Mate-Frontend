import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
} from "@reduxjs/toolkit/query/react";
import type { FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { ApiResponse } from "@/lib/apiTypes";

const BASE_URL =
  import.meta.env.VITE_API_URL ?? "https://stock-mate-qb40.onrender.com/api";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("access_token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

let refreshPromise: Promise<unknown> | null = null;

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extra) => {
  let result = await rawBaseQuery(args, api, extra);

  if (result.error?.status === 401) {
    if (!refreshPromise) {
      refreshPromise = Promise.resolve(
        rawBaseQuery({ url: "/auth/refresh", method: "POST" }, api, extra),
      ).finally(() => {
        refreshPromise = null;
      });
    }
    await refreshPromise;
    result = await rawBaseQuery(args, api, extra);

    if (result.error?.status === 401) {
      api.dispatch({ type: "auth/logout" });
      window.location.href = "/login";
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "User",
    "Role",
    "Permission",
    "Department",
    "Product",
    "Variant",
    "Unit",
    "Category",
    "Supplier",
    "StockSetting",
    "Batch",
    "LiveStock",
    "Adjustment",
    "Transaction",
    "StockCount",
    "QueueEntry",
    "Visit",
    "Prescription",
    "DispenseQueue",
    "Dispense",
    "RefillRequest",
    "Delivery",
    "PeriodicSchedule",
    "PurchaseRequest",
    "PurchaseReceipt",
    "Patient",
    "Notification",
    "UnreadCount",
    "Session",
    "PeriodicSchedule",
    "DisposalTransfer",
  ],
  endpoints: () => ({}),
});

export function unwrapResponse<T>(response: ApiResponse<T>): T {
  return response.data;
}
