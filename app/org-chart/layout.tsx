import { AppShell } from "@/components/layout/AppShell";

export default function OrgChartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell pageTitle="Organigramme">{children}</AppShell>;
}
