import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGetPatientByIdQuery } from "@/api/patients.api";
import { useGetPrescriptionsQuery } from "@/api/prescriptions.api";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { useGetPatientHistoryQuery } from "@/api/visits.api";

interface HistoryDepartment {
  id: string;
  name: string;
  visits: Array<{
    id: string;
    visitDate: string;
    status: string;
    diagnosis?: string;
    clinicalNotes?: string;
    externalMedications?: string;
    doctor: { fullName: string; specialty?: string | null };
  }>;
}

export default function PatientHistoryPrintPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation("patients");

  const { data: patientData, isLoading: patientLoading } =
    useGetPatientByIdQuery(id!);
  const { data: historyData, isLoading: historyLoading } =
    useGetPatientHistoryQuery(id!);
  const { data: rxData, isLoading: rxLoading } = useGetPrescriptionsQuery({
    patientId: id,
    limit: 100,
  });

  const patient = patientData?.data;
  const history = historyData?.data as
    | { departments: HistoryDepartment[] }
    | undefined;
  const prescriptions = rxData?.data?.items ?? [];

  const isLoading = patientLoading || historyLoading || rxLoading;

  const printedOnce = useRef(false);
  useEffect(() => {
    if (!isLoading && patient && !printedOnce.current) {
      printedOnce.current = true;
      // Small delay so the browser has a fully laid-out page before printing.
      const timer = setTimeout(() => window.print(), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading, patient]);

  if (isLoading) {
    return (
      <div className="p-10 text-center text-muted-foreground text-sm">
        {t("common:table.updating", { defaultValue: "Loading…" })}
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-10 text-center text-muted-foreground text-sm">
        {t("common:actions.notFound")}
      </div>
    );
  }

  const departments = history?.departments ?? [];
  const totalVisits = departments.reduce((s, d) => s + d.visits.length, 0);

  return (
    <div className="print-page">
      {/* Print-only styles: screen preview shows the A4 sheet centered on a
          gray backdrop; @media print strips all of that to just the page. */}
      <style>{`
        @page { size: A4; margin: 14mm; }
        html, body { background: #e5e7eb; }
        .print-page { font-family: "Inter", "Geist", system-ui, sans-serif; color: #111827; }
        .print-sheet {
          width: 210mm;
          min-height: 297mm;
          margin: 12px auto;
          background: #ffffff;
          padding: 14mm;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.12);
        }
        .no-print { }
        @media print {
          html, body { background: #ffffff; }
          .print-sheet { margin: 0; box-shadow: none; width: auto; min-height: auto; padding: 0; }
          .no-print { display: none !important; }
          .print-avoid-break { break-inside: avoid; page-break-inside: avoid; }
          .print-dept { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      {/* Screen-only toolbar */}
      <div className="no-print sticky top-0 z-10 bg-card border-b border-border px-4 py-2 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {t("print.previewNotice", {
            defaultValue: "Print preview — use your browser's print dialog.",
          })}
        </span>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5"
        >
          {t("print.printNow", { defaultValue: "Print" })}
        </button>
      </div>

      <div className="print-sheet text-[11px] leading-snug">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-foreground pb-3 mb-4 print-avoid-break">
          <div>
            <h1 className="text-lg font-bold">
              {t("print.title", { defaultValue: "Patient Medical History" })}
            </h1>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {t("print.generatedOn", {
                defaultValue: "Generated",
              })}
              : {formatDateTime(new Date().toISOString())}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">RC HMS</p>
            <p className="text-[10px] text-gray-500">
              {t("print.systemName", {
                defaultValue: "Hospital Management System",
              })}
            </p>
          </div>
        </div>

        {/* Patient demographics */}
        <div className="mb-5 print-avoid-break">
          <h2 className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">
            {t("print.patientInfo", { defaultValue: "Patient Information" })}
          </h2>
          <div className="grid grid-cols-4 gap-x-4 gap-y-1.5 border border-gray-300 rounded-md p-3">
            <Field label={t("fields.fullName")} value={patient.fullName} />
            <Field label={t("fields.patientId")} value={patient.patientId} />
            <Field
              label={t("fields.nationalId")}
              value={patient.nationalId ?? "—"}
            />
            <Field
              label={t("fields.familyBookNumber")}
              value={patient.familyBookNumber ?? "—"}
            />
            <Field
              label={t("fields.registeredAt")}
              value={formatDate(patient.createdAt)}
            />
            <Field
              label={t("print.totalVisits", { defaultValue: "Total visits" })}
              value={String(totalVisits)}
            />
            <Field
              label={t("print.totalPrescriptions", {
                defaultValue: "Total prescriptions",
              })}
              value={String(prescriptions.length)}
            />
            <Field
              label={t("print.departmentsSeen", {
                defaultValue: "Departments seen",
              })}
              value={String(departments.length)}
            />
          </div>
        </div>

        {/* Visit history, grouped by department */}
        <div className="mb-5">
          <h2 className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1.5 print-avoid-break">
            {t("tabs.visits")}
          </h2>
          {departments.length === 0 && (
            <p className="text-gray-400 italic">{t("history.noVisits")}</p>
          )}
          {departments.map((dept) => (
            <div key={dept.id} className="mb-3 print-dept">
              <p className="font-semibold bg-gray-100 px-2 py-1 rounded-t-md border border-gray-300 border-b-0">
                {dept.name}
              </p>
              <table className="w-full border border-gray-300 rounded-b-md border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <Th>{t("print.date", { defaultValue: "Date" })}</Th>
                    <Th>{t("doctor")}</Th>
                    <Th>{t("diagnosis")}</Th>
                    <Th>{t("clinicalNotes")}</Th>
                    <Th>{t("status")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {dept.visits.map((v) => (
                    <tr
                      key={v.id}
                      className="border-t border-gray-200 align-top"
                    >
                      <Td>{formatDateTime(v.visitDate)}</Td>
                      <Td>
                        {v.doctor?.fullName}
                        {v.doctor?.specialty ? ` (${v.doctor.specialty})` : ""}
                      </Td>
                      <Td>{v.diagnosis || "—"}</Td>
                      <Td>{v.clinicalNotes || "—"}</Td>
                      <Td className="capitalize">{v.status}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Prescriptions */}
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1.5 print-avoid-break">
            {t("tabs.prescriptions")}
          </h2>
          {prescriptions.length === 0 && (
            <p className="text-gray-400 italic">
              {t("tabs.prescriptions")} — {t("common:empty.title")}
            </p>
          )}
          {prescriptions.map((rx) => (
            <div
              key={rx.id}
              className="mb-3 border border-gray-300 rounded-md print-avoid-break"
            >
              <div className="flex items-center justify-between bg-gray-100 px-2 py-1 rounded-t-md border-b border-gray-300">
                <span className="font-semibold">
                  {formatDate(rx.startDate)} — Dr. {rx.doctor?.fullName}
                </span>
                <span className="capitalize text-gray-600">{rx.status}</span>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <Th>
                      {t("print.medication", { defaultValue: "Medication" })}
                    </Th>
                    <Th>
                      {t("prescription.dosage", { defaultValue: "Dosage" })}
                    </Th>
                    <Th>
                      {t("prescription.frequency", {
                        defaultValue: "Frequency",
                      })}
                    </Th>
                    <Th>
                      {t("print.qty", {
                        defaultValue: "Prescribed / Dispensed",
                      })}
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {rx.items?.map((item) => (
                    <tr key={item.id} className="border-t border-gray-200">
                      <Td>{item.variant?.variantName ?? "—"}</Td>
                      <Td>{item.dosage || "—"}</Td>
                      <Td>{item.frequency || "—"}</Td>
                      <Td>
                        {item.prescribedQuantity} / {item.dispensedQuantity}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-2 border-t border-gray-300 text-[9px] text-gray-400 flex items-center justify-between print-avoid-break">
          <span>
            {t("print.confidential", {
              defaultValue:
                "Confidential — for authorized medical personnel only.",
            })}
          </span>
          <span>
            {t("fields.patientId")}: {patient.patientId}
          </span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-start font-semibold px-2 py-1 border-b border-gray-300 text-[10px]">
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-2 py-1 ${className ?? ""}`}>{children}</td>;
}
