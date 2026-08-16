import { BellRing, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/primitive/button";
import {
  usePromptDismissed,
  usePushNotifications,
} from "../hooks/usePushNotifications";

export default function PushPermissionBanner() {
  const { t } = useTranslation("notifications");
  const { state, enable } = usePushNotifications();
  const { dismissed, dismiss } = usePromptDismissed();

  if (dismissed) return null;
  if (state !== "not-enabled") return null;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 mb-4">
      <div className="rounded-xl bg-primary/10 p-2 shrink-0">
        <BellRing className="size-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          {t("push.bannerTitle", { defaultValue: "Enable push notifications" })}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("push.bannerDescription", {
            defaultValue: "Get notified even when this tab isn't open.",
          })}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button size="sm" onClick={enable}>
          {t("push.enable", { defaultValue: "Enable" })}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={dismiss}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
