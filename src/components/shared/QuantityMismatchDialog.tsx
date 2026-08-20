import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/primitive/dialog";
import { Button } from "@/components/primitive/button";
import { useTranslation } from "react-i18next";

export interface MismatchLine {
  name: string;
  expected: number;
  entered: number;
}

export interface MismatchDiff extends MismatchLine {
  diff: number;
}

export function getQuantityMismatches(lines: MismatchLine[]): MismatchDiff[] {
  return lines
    .filter((l) => Number(l.entered) !== Number(l.expected))
    .map((l) => ({ ...l, diff: Number(l.entered) - Number(l.expected) }));
}

interface QuantityMismatchDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mismatches: MismatchDiff[];
  loading?: boolean;
  onConfirm: () => void;
}

export default function QuantityMismatchDialog({
  open,
  onOpenChange,
  mismatches,
  loading,
  onConfirm,
}: QuantityMismatchDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-warning/10 p-2 shrink-0">
              <AlertTriangle className="size-4 text-warning" />
            </div>
            <DialogTitle>
              {t("common:mismatch.title", {
                defaultValue: "Quantity mismatch detected",
              })}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("common:mismatch.description", {
              defaultValue:
                "The quantities you entered don't match what was expected:",
            })}
          </p>

          <div className="rounded-xl border border-warning/30 bg-warning/5 divide-y divide-warning/20 max-h-64 overflow-y-auto">
            {mismatches.map((m, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 text-sm"
              >
                <span className="font-medium">{m.name}</span>
                <span
                  className={
                    m.diff > 0
                      ? "font-mono font-semibold text-success"
                      : "font-mono font-semibold text-danger"
                  }
                >
                  {m.diff > 0 ? `+${m.diff}` : m.diff}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground bg-info/10 rounded-xl px-3 py-2">
            {t("common:mismatch.hint", {
              defaultValue:
                "If any of these numbers is a mistake, cancel and correct it now. If it's a real discrepancy, contact whoever sent the items to confirm the actual quantities. Once you confirm, you are responsible for the entered quantities.",
            })}
          </p>

          <p className="text-sm font-medium">
            {t("common:mismatch.confirmQuestion", {
              defaultValue: "Are you sure you want to confirm?",
            })}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common:actions.cancel")}
          </Button>
          <Button variant="destructive" onClick={onConfirm} loading={loading}>
            {t("common:mismatch.confirmAnyway", {
              defaultValue: "Yes, confirm anyway",
            })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
