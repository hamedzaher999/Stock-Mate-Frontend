import { baseApi } from "./baseApi";
import type { ApiResponse, PaginatedResult, DispenseQueueEntry } from "@/lib/apiTypes";

export const pharmacyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDispenseQueue: builder.query<ApiResponse<PaginatedResult<DispenseQueueEntry>>, { page?: number; limit?: number } | void>({
      query: (params) => ({ url: "/pharmacy/dispense-queue", params: params ?? {} }),
      providesTags: ["DispenseQueue"],
    }),
    lookupDispenseQueue: builder.query<ApiResponse<{ ambiguous: boolean; results: DispenseQueueEntry[] }>, { nationalId?: string; familyBookNumber?: string }>({
      query: (params) => ({ url: "/pharmacy/dispense-queue/lookup", params }),
    }),
    dispensePrescription: builder.mutation<ApiResponse<unknown>, { prescriptionId: string; notes?: string; items: Array<{ prescriptionItemId: string; quantity: number }> }>({
      query: (body) => ({ url: "/pharmacy/dispensing", method: "POST", body }),
      invalidatesTags: ["DispenseQueue", "Prescription", "LiveStock"],
    }),
  }),
});

export const {
  useGetDispenseQueueQuery, useLookupDispenseQueueQuery, useDispensePrescriptionMutation,
} = pharmacyApi;
