import { baseApi } from "./baseApi";
import type { ApiResponse, PaginatedResult, Visit, QueueEntry } from "@/lib/apiTypes";

interface PrescriptionItemInput {
  variantId: string;
  prescribedQuantity: number;
  dosage?: string;
  frequency?: string;
  durationDays?: number;
}

interface PrescriptionInput {
  frequencyUnit?: "day" | "week" | "month";
  frequencyInterval?: number;
  totalCycles?: number;
  startDate: string;
  items: PrescriptionItemInput[];
}

interface CompleteConsultationDto {
  queueEntryId: string;
  clinicalNotes?: string;
  diagnosis?: string;
  externalMedications?: string;
  prescriptions?: PrescriptionInput[];
}

export const visitsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVisits: builder.query<ApiResponse<PaginatedResult<Visit>>, { page?: number; limit?: number; patientId?: string; doctorId?: string; departmentId?: string; status?: string } | void>({
      query: (params) => ({ url: "/medical-visits", params: params ?? {} }),
      providesTags: ["Visit"],
    }),
    getPatientHistory: builder.query<ApiResponse<unknown>, string>({
      query: (patientId) => `/medical-visits/patient/${patientId}/history`,
      providesTags: ["Visit"],
    }),
    getVisitById: builder.query<ApiResponse<Visit>, string>({
      query: (id) => `/medical-visits/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Visit", id }],
    }),
    selectPatient: builder.mutation<ApiResponse<QueueEntry>, { queueEntryId: string }>({
      query: (body) => ({ url: "/medical-visits/select", method: "POST", body }),
      invalidatesTags: ["QueueEntry", "Visit"],
    }),
    completeConsultation: builder.mutation<ApiResponse<Visit>, CompleteConsultationDto>({
      query: (body) => ({ url: "/medical-visits/complete", method: "POST", body }),
      invalidatesTags: ["Visit", "QueueEntry", "Prescription"],
    }),
    cancelVisit: builder.mutation<ApiResponse<Visit>, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/medical-visits/${id}/cancel`, method: "POST", body: { reason } }),
      invalidatesTags: ["Visit"],
    }),
  }),
});

export const {
  useGetVisitsQuery, useGetPatientHistoryQuery, useGetVisitByIdQuery,
  useSelectPatientMutation, useCompleteConsultationMutation, useCancelVisitMutation,
} = visitsApi;
