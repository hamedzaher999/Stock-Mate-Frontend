import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Activity } from "lucide-react";
import { Button } from "@/components/primitive/button";
import { Input } from "@/components/primitive/input";
import { Label } from "@/components/primitive/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/primitive/card";
import { useRequestOtpMutation, useVerifyOtpMutation } from "@/api/auth.api";
import { setUser } from "../auth.slice";

export default function LoginPage() {
  const { t } = useTranslation("auth");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [step, setStep] = useState<"request" | "verify">("request");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [requestOtp, { isLoading: requesting }] = useRequestOtpMutation();
  const [verifyOtp, { isLoading: verifying }] = useVerifyOtpMutation();

  const isEmail = identifier.includes("@");

  async function handleRequestOtp() {
    setError(null);
    try {
      const body = isEmail
        ? { email: identifier, channel: "email" as const }
        : { phone: identifier, channel: "phone" as const };
      const res = await requestOtp(body).unwrap();
      if (res.data?.code) setDevCode(res.data.code);
      setStep("verify");
    } catch (e: unknown) {
      setError(
        (e as { data?: { message?: string } })?.data?.message ??
          t("errors.invalidOtp"),
      );
    }
  }

  async function handleVerify() {
    setError(null);
    try {
      const body = isEmail
        ? { email: identifier, code, platform: "web" as const }
        : { phone: identifier, code, platform: "web" as const };
      const res = await verifyOtp(body).unwrap();
      if (res.data?.user) {
        dispatch(setUser(res.data.user));
        navigate("/");
      }
    } catch (e: unknown) {
      setError(
        (e as { data?: { message?: string } })?.data?.message ??
          t("errors.invalidOtp"),
      );
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/10 rounded-2xl p-4 mb-4">
            <Activity className="size-10 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {t("login.subtitle")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("login.systemName")}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("login.title")}</CardTitle>
            <CardDescription>
              {step === "request"
                ? t("login.enterIdentifier")
                : `${t("login.codeSent")} ${devCode ? `(${t("auth:login.devBanner", { code: devCode })})` : ""}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === "request" ? (
              <>
                <div className="space-y-1.5">
                  <Label>
                    {identifier.includes("@")
                      ? t("login.email")
                      : t("login.phone")}
                  </Label>
                  <Input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={t("login.identifierPlaceholder")}
                    onKeyDown={(e) => e.key === "Enter" && handleRequestOtp()}
                  />
                </div>
                {error && <p className="text-xs text-danger">{error}</p>}
                <Button
                  className="w-full"
                  onClick={handleRequestOtp}
                  loading={requesting}
                >
                  {t("login.requestOtp")}
                </Button>
              </>
            ) : (
              <>
                {devCode && (
                  <div className="rounded-xl bg-warning/10 border border-warning/30 px-3 py-2 text-xs text-warning font-mono">
                    DEV — OTP: {devCode}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>{t("login.otpCode")}</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={t("login.otpPlaceholder")}
                    maxLength={6}
                    onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  />
                </div>
                {error && <p className="text-xs text-danger">{error}</p>}
                <Button
                  className="w-full"
                  onClick={handleVerify}
                  loading={verifying}
                >
                  {t("login.verify")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStep("request");
                    setCode("");
                    setDevCode(null);
                    setError(null);
                  }}
                >
                  {t("login.back")}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
