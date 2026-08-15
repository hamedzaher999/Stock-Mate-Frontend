import { Search } from "lucide-react";
import { Input } from "@/components/primitive/input";
import { useTranslation } from "react-i18next";

interface AppSearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export default function AppSearchInput({ value, onChange, placeholder, className }: AppSearchInputProps) {
  const { t } = useTranslation();
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? t("actions.search")}
      leftIcon={<Search />}
      className={className}
    />
  );
}
