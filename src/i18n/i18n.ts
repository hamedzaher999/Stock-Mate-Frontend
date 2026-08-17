import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import enCommon from "./en/common.json";
import enAuth from "./en/auth.json";
import enNav from "./en/nav.json";
import enPatients from "./en/patients.json";
import enInventory from "./en/inventory.json";
import enPurchasing from "./en/purchasing.json";
import enRefills from "./en/refills.json";
import enPharmacy from "./en/pharmacy.json";
import enCatalog from "./en/catalog.json";
import enUsers from "./en/users.json";
import enNotifications from "./en/notifications.json";
import enQueue from "./en/queue.json";
import enVisits from "./en/visits.json";
import enPrescriptions from "./en/prescriptions.json";
import enSettings from "./en/settings.json";
import enDepartments from "./en/departments.json";
import enSuppliers from "./en/suppliers.json";
import enRbac from "./en/rbac.json";
import enStatus from "./en/status.json";
import enDashboard from "./en/dashboard.json";
import enSessions from "./en/sessions.json";
import enReports from "./en/reports.json";
import enDisposal from "./en/disposal.json";
import enAssistant from "./en/assistant.json";
import arCommon from "./ar/common.json";
import arAuth from "./ar/auth.json";
import arNav from "./ar/nav.json";
import arPatients from "./ar/patients.json";
import arInventory from "./ar/inventory.json";
import arPurchasing from "./ar/purchasing.json";
import arRefills from "./ar/refills.json";
import arPharmacy from "./ar/pharmacy.json";
import arCatalog from "./ar/catalog.json";
import arUsers from "./ar/users.json";
import arNotifications from "./ar/notifications.json";
import arQueue from "./ar/queue.json";
import arVisits from "./ar/visits.json";
import arPrescriptions from "./ar/prescriptions.json";
import arSettings from "./ar/settings.json";
import arDepartments from "./ar/departments.json";
import arSuppliers from "./ar/suppliers.json";
import arRbac from "./ar/rbac.json";
import arStatus from "./ar/status.json";
import arDashboard from "./ar/dashboard.json";
import arSessions from "./ar/sessions.json";
import arReports from "./ar/reports.json";
import arDisposal from "./ar/disposal.json";
import arAssistant from "./ar/assistant.json";

const applyHtmlLang = (lng?: string) => {
  const language = lng ?? "en";
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init(
    {
      resources: {
        en: {
          common: enCommon,
          reports: enReports,
          auth: enAuth,
          disposal: enDisposal,
          sessions: enSessions,
          nav: enNav,
          patients: enPatients,
          inventory: enInventory,
          purchasing: enPurchasing,
          refills: enRefills,
          pharmacy: enPharmacy,
          catalog: enCatalog,
          users: enUsers,
          notifications: enNotifications,
          queue: enQueue,
          visits: enVisits,
          prescriptions: enPrescriptions,
          settings: enSettings,
          departments: enDepartments,
          suppliers: enSuppliers,
          rbac: enRbac,
          status: enStatus,
          dashboard: enDashboard,
          assistant: enAssistant,
        },
        ar: {
          common: arCommon,
          auth: arAuth,
          nav: arNav,
          patients: arPatients,
          inventory: arInventory,
          purchasing: arPurchasing,
          refills: arRefills,
          pharmacy: arPharmacy,
          catalog: arCatalog,
          users: arUsers,
          notifications: arNotifications,
          queue: arQueue,
          visits: arVisits,
          prescriptions: arPrescriptions,
          settings: arSettings,
          departments: arDepartments,
          suppliers: arSuppliers,
          rbac: arRbac,
          status: arStatus,
          dashboard: arDashboard,
          sessions: arSessions,
          reports: arReports,
          disposal: arDisposal,
          assistant: arAssistant,
        },
      },
      defaultNS: "common",
      fallbackLng: "en",
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
      },
    },
    () => {
      applyHtmlLang(i18n.language);
    },
  );

i18n.on("languageChanged", applyHtmlLang);

export default i18n;
