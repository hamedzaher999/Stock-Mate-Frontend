import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageCircle, X, Sparkles } from "lucide-react";
import { Button } from "@/components/primitive/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/primitive/card";
import AssistantChat from "./AssistantChat";

export default function AssistantWidget() {
  const { t } = useTranslation("assistant");
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 inset-e-5 z-40">
      {open && (
        <Card className="absolute bottom-14 inset-e-0 w-88 shadow-xl flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 rounded-xl p-1.5">
                <Sparkles className="size-4 text-primary" />
              </div>
              <CardTitle className="text-sm">{t("title")}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-3 flex-1 min-h-0">
            <AssistantChat variant="panel" />
          </CardContent>
        </Card>
      )}

      <Button
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </Button>
    </div>
  );
}
