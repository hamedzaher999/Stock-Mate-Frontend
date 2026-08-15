import { baseApi } from "./baseApi";
import type { ApiResponse, PaginatedResult, Patient } from "@/lib/apiTypes";

export const patientsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPatients: builder.query<ApiResponse<PaginatedResult<Patient>>, { page?: number; limit?: number; search?: string } | void>({
      query: (params) => ({ url: "/patients", params: params ?? {} }),
      providesTags: ["Patient"],
    }),
    lookupPatient: builder.query<ApiResponse<Patient | { multipleMatches: Patient[] } | null>, { nationalId?: string; familyBookNumber?: string; patientId?: string }>({
      query: (params) => ({ url: "/patients/lookup", params }),
    }),
    getPatientById: builder.query<ApiResponse<Patient>, string>({
      query: (id) => `/patients/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Patient", id }],
    }),
    createPatient: builder.mutation<ApiResponse<Patient>, { fullName: string; nationalId?: string; familyBookNumber?: string }>({
      query: (body) => ({ url: "/patients", method: "POST", body }),
      invalidatesTags: ["Patient"],
    }),
    updatePatient: builder.mutation<ApiResponse<Patient>, { id: string; data: Partial<{ fullName: string; nationalId: string; familyBookNumber: string }> }>({
      query: ({ id, data }) => ({ url: `/patients/${id}`, method: "PATCH", body: data }),
      invalidatesTags: ["Patient"],
    }),
  }),
});

export const {
  useGetPatientsQuery, useLookupPatientQuery, useGetPatientByIdQuery,
  useCreatePatientMutation, useUpdatePatientMutation,
} = patientsApi;
