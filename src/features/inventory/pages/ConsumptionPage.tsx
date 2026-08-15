import { useState } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { useRecordConsumptionMutation } from "@/api/inventory.api";
import { useGetVariantsQuery } from "@/api/catalog.api";
import { useGetDepartmentsQuery } from "@/api/departments.api";
import { Button } from "@/components/primitive/button";
import { Input } from "@/components/primitive/input";
import { Label } from "@/components/primitive/label";
import { Textarea } from "@/components/primitive/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/primitive/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitive/card";
import AppPageHeader from "@/components/shared/AppPageHeader";
import { useTranslation } from "react-i18next";
interface Item {
  variantId: string;
  quantity: number;
}

export default function ConsumptionPage() {
  const { t } = useTranslation("inventory");
  const [deptId, setDeptId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Item[]>([{ variantId: "", quantity: 1 }]);
  const [result, setResult] = useState<Array<{
    variantId: string;
    batchId: string;
    quantity: number;
  }> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: deptData } = useGetDepartmentsQuery();
  const { data: variantData } = useGetVariantsQuery({
    isActive: true,
    limit: 100,
  } as { isActive: boolean; limit: number });
  const [recordConsumption, { isLoading }] = useRecordConsumptionMutation();

  const variants = (variantData?.data?.items ?? []).filter(
    (v) => v.product?.materialType !== "fixed_asset",
  );

  function addItem() {
    setItems((p) => [...p, { variantId: "", quantity: 1 }]);
  }
  function removeItem(i: number) {
    setItems((p) => p.filter((_, idx) => idx !== i));
  }
  function updateItem(i: number, field: keyof Item, value: string | number) {
    setItems((p) =>
      p.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)),
    );
  }

  async function handleSubmit() {
    if (!deptId) {
      setError(t("consumption.selectDepartment"));
      return;
    }
    if (items.some((i) => !i.variantId || !i.quantity)) {
      setError(t("consumption.allItemsRequired"));
      return;
    }
    setError(null);
    try {
      const res = await recordConsumption({
        departmentId: deptId,
        ...(notes ? { notes } : {}),
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: Number(i.quantity),
        })),
      }).unwrap();
      setResult(res.data);
    } catch (e: unknown) {
      setError(
        (e as { data?: { message?: string } })?.data?.message ??
          t("consumption.errorRecording"),
      );
    }
  }

  if (result) {
    return (
      <div>
        <AppPageHeader title={t("consumption.result")} />
        <Card>
          <CardHeader>
            <CardTitle>{t("consumption.fefoResult")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t("consumption.fefoDescription")}
            </p>
            {result.map((line, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 mb-2"
              >
                <code className="text-xs">{line.batchId.slice(0, 8)}...</code>
                <span className="text-sm font-medium">-{line.quantity}</span>
              </div>
            ))}
            <Button
              className="mt-4"
              onClick={() => {
                setResult(null);
                setItems([{ variantId: "", quantity: 1 }]);
              }}
            >
              {t("consumption.recordAnother")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <AppPageHeader title={t("consumption.title")} />
      <div className="max-w-xl space-y-4">
        <div className="space-y-1.5">
          <Label required>{t("consumption.department")}</Label>
          <Select value={deptId} onValueChange={setDeptId}>
            <SelectTrigger>
              <SelectValue placeholder={t("consumption.selectDepartment")} />
            </SelectTrigger>
            <SelectContent>
              {(deptData?.data?.items ?? []).map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>{t("consumption.items")}</Label>
          {items.map((item, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs">{t("consumption.material")}</Label>
                <Select
                  value={item.variantId}
                  onValueChange={(v) => updateItem(i, "variantId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {variants.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.variantName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24 space-y-1.5">
                <Label className="text-xs">{t("consumption.qty")}</Label>
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(i, "quantity", parseInt(e.target.value))
                  }
                />
              </div>
              {items.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(i)}
                  className="mb-0.5"
                >
                  <Trash2 className="size-4 text-danger" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addItem}>
            <PlusCircle className="size-4" /> {t("consumption.addItem")}
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label>{t("consumption.notes")}</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}
        <Button onClick={handleSubmit} loading={isLoading} className="w-full">
          {t("consumption.record")}
        </Button>
      </div>
    </div>
  );
}
