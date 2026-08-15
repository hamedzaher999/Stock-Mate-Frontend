import { useTranslation } from "react-i18next";
import AppPageHeader from "@/components/shared/AppPageHeader";
import { Card, CardContent } from "@/components/primitive/card";
import AssistantChat from "../components/AssistantChat";

export default function AssistantPage() {
  const { t } = useTranslation("assistant");

  return (
    <div>
      <AppPageHeader title={t("title")} subtitle={t("pageSubtitle")} />
      <Card>
        <CardContent className="p-4">
          <AssistantChat variant="page" />
        </CardContent>
      </Card>
    </div>
  );
}
