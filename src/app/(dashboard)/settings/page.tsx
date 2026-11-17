// src/app/(dashboard)/settings/page.tsx
import { getSettings } from "@/server/actions/settings";
import { SettingsClient } from "@/components/settings/SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const result = await getSettings();

  const settings = result.success
    ? result.data
    : {
        companyName:   "SkyRideTour",
        phone:         "+91 98765 43210",
        email:         "info@skyridetour.com",
        address:       "Somnath, Gujarat, India",
        gstNumber:     "24AAAAA0000A1Z5",
        invoicePrefix: "SRT-2026-",
        currencySymbol: "₹",
      };

  return <SettingsClient initialSettings={settings} />;
}
