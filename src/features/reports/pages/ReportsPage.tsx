import { useTranslation } from "react-i18next";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/primitive/tabs";
import AdjustmentsReportPage from "./AdjustmentsReportPage";
import InventoryMovementReportPage from "./InventoryMovementReportPage";
import PatientVisitsReportPage from "./PatientVisitsReportPage";

export default function ReportsPage() {
  const { t } = useTranslation("reports");
  return (
    <div className="p-6 pb-0">
      <Tabs defaultValue="movement">
        <TabsList className="mb-2">
          <TabsTrigger value="movement">{t("tabs.movement")}</TabsTrigger>
          <TabsTrigger value="adjustments">{t("tabs.adjustments")}</TabsTrigger>
          <TabsTrigger value="visits">{t("tabs.visits")}</TabsTrigger>
        </TabsList>
        <TabsContent value="movement" className="-mx-6 -mt-4">
          <InventoryMovementReportPage />
        </TabsContent>
        <TabsContent value="adjustments" className="-mx-6 -mt-4">
          <AdjustmentsReportPage />
        </TabsContent>
        <TabsContent value="visits" className="-mx-6 -mt-4">
          <PatientVisitsReportPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
