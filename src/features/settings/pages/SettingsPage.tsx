import { useThemeStore } from "@/stores/theme.store";
import AppPageHeader from "@/components/shared/AppPageHeader";
import { Switch } from "@/components/primitive/switch";
import { Label } from "@/components/primitive/label";
import { Input } from "@/components/primitive/input";
import { Button } from "@/components/primitive/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitive/card";
import { useTranslation } from "react-i18next";
const PRESET_COLORS = ["#C8102E", "#1A56DB", "#0E9F6E", "#FF8800", "#7E3AF2"];
const FONT_SIZES = [
  { label: "sm", value: 12 },
  { label: "base", value: 14 },
  { label: "lg", value: 16 },
  { label: "xl", value: 18 },
];
const RADII = [
  { label: "none", value: 0 },
  { label: "sm", value: 4 },
  { label: "md", value: 8 },
  { label: "lg", value: 12 },
  { label: "full", value: 24 },
];
const DENSITIES = ["compact", "comfortable"] as const;

export default function SettingsPage() {
  const { t } = useTranslation("settings");
  const store = useThemeStore();
  const { i18n } = useTranslation();
  const changeLanguage = (l: "en" | "ar") => {
    store.setLanguage(l);
    i18n.changeLanguage(l);
  };
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <AppPageHeader title={t("title")} subtitle={t("subtitle")} />

      <Card>
        <CardHeader>
          <CardTitle>{t("themeColor")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                className={`size-8 rounded-full border-2 transition-all ${store.primaryColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }}
                onClick={() => store.setPrimaryColor(c)}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Label>{t("custom")}</Label>
            <Input
              type="color"
              value={store.primaryColor}
              onChange={(e) => store.setPrimaryColor(e.target.value)}
              className="w-16 h-8 p-0 border-0"
            />
            <Input
              value={store.primaryColor}
              onChange={(e) => store.setPrimaryColor(e.target.value)}
              className="w-32 font-mono text-sm"
              placeholder="#C8102E"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("appearance")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>{t("darkMode")}</Label>
            <Switch
              checked={store.darkMode}
              onCheckedChange={store.setDarkMode}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("fontSize")}</Label>
            <div className="flex gap-2">
              {FONT_SIZES.map((f) => (
                <Button
                  key={f.value}
                  variant={store.fontSize === f.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => store.setFontSize(f.value)}
                >
                  {t(`fontSizes.${f.label.toLowerCase()}`)}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("borderRadius")}</Label>
            <div className="flex gap-2 flex-wrap">
              {RADII.map((r) => (
                <Button
                  key={r.value}
                  variant={
                    store.borderRadius === r.value ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => store.setBorderRadius(r.value)}
                >
                  {t(`radiusLabels.${r.label.toLowerCase()}`)}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("density")}</Label>
            <div className="flex gap-2">
              {DENSITIES.map((d) => (
                <Button
                  key={d}
                  variant={store.density === d ? "default" : "outline"}
                  size="sm"
                  onClick={() => store.setDensity(d)}
                  className="capitalize"
                >
                  {t(d)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("regional")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("language")}</Label>
            <div className="flex gap-2">
              {(["en", "ar"] as const).map((l) => (
                <Button
                  key={l}
                  variant={store.language === l ? "default" : "outline"}
                  size="sm"
                  onClick={() => changeLanguage(l)}
                  className="uppercase"
                >
                  {t(l)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={() => store.reset()}>
        {t("reset")}
      </Button>
    </div>
  );
}
