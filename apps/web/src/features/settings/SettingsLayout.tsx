import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";
import type { Id } from "../../../../../convex/_generated/dataModel";

type SettingsLayoutProps = {
  businessId?: Id<"businesses">;
};

export function SettingsLayout({ businessId }: SettingsLayoutProps) {
  const { t } = useTranslation("settings");

  if (!businessId) {
    return null;
  }

  // Usage, billing and phone-number are hidden: they manage a subscription the host
  // product owns and a phone line that needs a carrier account we have not opened. A tab
  // that can only fail is worse than a missing one -- it reads as broken software rather
  // than an unconfigured service. Restoring them is this list, one line each.
  const navigationItems = [
    { label: t("sections.business"), to: "/settings/team" },
    { label: t("sections.appearance"), to: "/settings/appearance" },
    { label: t("sections.notifications"), to: "/settings/notifications" },
  ] as const;

  return (
    <section className="flex flex-1 flex-col gap-6">
      <PageHeader title={t("header.title")} />
      <nav
        aria-label={t("header.title")}
        className="overflow-x-auto pb-1"
      >
        <div className="flex min-w-max items-center gap-2">
          {navigationItems.map((item) => (
            <NavLink
                className={({ isActive }) =>
                  cn(
                    "inline-flex h-9 items-center rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                  )
                }
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <div className="w-full">
        <Outlet />
      </div>
    </section>
  );
}
