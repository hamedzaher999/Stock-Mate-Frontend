import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { ChevronDown, Zap } from "lucide-react";

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
import logo from "../../../asset/logo.png";
const QUICK_LOGIN_ACCOUNTS = [
  {
    role: "hospital_manager",
    email: "hassanmohammad0010@gmail.com",
  },
  {
    role: "warehouse_manager",
    email: "warehouse_manager@example.com",
  },
  {
    role: "purchasing_manager",
    email: "purchasing_manager@example.com",
  },
  {
    role: "reception_staff",
    email: "reception_staff@example.com",
  },
  {
    role: "doctor",
    email: "doctor@example.com",
  },
  {
    role: "department_manager",
    email: "department_manager@example.com",
  },
  {
    role: "pharmacy_staff",
    email: "basharman2003@gmail.com",
  },
  {
    role: "disposal_manager",
    email: "disposal.manager@example.com",
  },
  {
    role: "super_admin",
    email: "super_admin@example.com",
  },
] as const;
export default function LoginPage() {
  const { t } = useTranslation("auth");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [quickLoginOpen, setQuickLoginOpen] = useState(false);

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
          <div className="bg-primary/10 rounded-2xl p-1 mb-4">
            {/* <Activity className="size-10 text-primary" /> */}
            <img src={logo} alt="" className="w-20" />
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
                {/* Quick demo accounts */}
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setQuickLoginOpen((value) => !value)}
                  >
                    <span className="flex items-center gap-2">
                      <Zap className="size-4" />
                      {t("login.quickLogin.button")}
                    </span>

                    <ChevronDown
                      className={`size-4 transition-transform ${
                        quickLoginOpen ? "rotate-180" : ""
                      }`}
                    />
                  </Button>

                  {quickLoginOpen && (
                    <div className="rounded-xl border border-border bg-muted/30 p-2 space-y-1">
                      <p className="px-3 py-2 text-xs text-muted-foreground">
                        {t("login.quickLogin.description")}
                      </p>

                      <div className="max-h-72 overflow-y-auto space-y-1">
                        {QUICK_LOGIN_ACCOUNTS.map((account) => (
                          <button
                            key={account.role}
                            type="button"
                            className="w-full text-start rounded-lg px-3 py-2 hover:bg-accent transition-colors"
                            onClick={() => {
                              setIdentifier(account.email);
                              setError(null);
                              setQuickLoginOpen(false);
                            }}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-medium">
                                {t(`login.quickLogin.roles.${account.role}`)}
                              </span>

                              <span className="text-xs text-muted-foreground truncate">
                                {account.email}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {error && <p className="text-xs text-danger">{error}</p>}{" "}
                {/* <div className="space-y-1.5">
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
                {error && <p className="text-xs text-danger">{error}</p>} */}
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
