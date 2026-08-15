import { Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AppEmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export default function AppEmptyState({ title, description, icon }: AppEmptyStateProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
      <div className="rounded-2xl bg-muted p-4">
        {icon ?? <Inbox className="size-8 opacity-50" />}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{title ?? t("empty.title")}</p>
        <p className="text-xs mt-1">{description ?? t("empty.description")}</p>
      </div>
    </div>
  );
}
