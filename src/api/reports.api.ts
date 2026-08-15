import {
  AdjustmentsReportResult,
  ApiResponse,
  InventoryMovementReportResult,
  PatientVisitsReportResult,
  ReportGroupBy,
} from "@/lib/apiTypes";
import { baseApi } from "./baseApi";

export interface ReportQueryParams {
  from: string;
  to: string;
  page?: number;
  limit?: number;
  departmentId?: string;
  groupBy?: ReportGroupBy;
}

export interface AdjustmentsReportParams extends ReportQueryParams {
  variantId?: string;
  adjustmentType?: string;
}

export interface InventoryMovementReportParams extends ReportQueryParams {
  variantId?: string;
  transactionType?: string;
}

export interface PatientVisitsReportParams extends ReportQueryParams {
  doctorId?: string;
  patientId?: string;
  status?: string;
}

function buildExportUrl(base: string, params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdjustmentsReport: builder.query<
      ApiResponse<AdjustmentsReportResult>,
      AdjustmentsReportParams
    >({
      query: (params) => ({ url: "/reports/adjustments", params }),
      providesTags: ["Adjustment"],
    }),
    getInventoryMovementReport: builder.query<
      ApiResponse<InventoryMovementReportResult>,
      InventoryMovementReportParams
    >({
      query: (params) => ({ url: "/reports/inventory-movement", params }),
      providesTags: ["Transaction"],
    }),
    getPatientVisitsReport: builder.query<
      ApiResponse<PatientVisitsReportResult>,
      PatientVisitsReportParams
    >({
      query: (params) => ({ url: "/reports/patient-visits", params }),
      providesTags: ["Visit"],
    }),
  }),
});

export const {
  useGetAdjustmentsReportQuery,
  useGetInventoryMovementReportQuery,
  useGetPatientVisitsReportQuery,
} = reportsApi;

export function getAdjustmentsReportExportUrl(
  params: AdjustmentsReportParams,
): string {
  const BASE_URL =
    import.meta.env.VITE_API_URL ?? "https://stock-mate-qb40.onrender.com/api";
  return buildExportUrl(`${BASE_URL}/reports/adjustments/export`, params);
}

export function getInventoryMovementReportExportUrl(
  params: InventoryMovementReportParams,
): string {
  const BASE_URL =
    import.meta.env.VITE_API_URL ?? "https://stock-mate-qb40.onrender.com/api";
  return buildExportUrl(
    `${BASE_URL}/reports/inventory-movement/export`,
    params,
  );
}

export function getPatientVisitsReportExportUrl(
  params: PatientVisitsReportParams,
): string {
  const BASE_URL =
    import.meta.env.VITE_API_URL ?? "https://stock-mate-qb40.onrender.com/api";
  return buildExportUrl(`${BASE_URL}/reports/patient-visits/export`, params);
}
