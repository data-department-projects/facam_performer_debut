import { prisma } from "@/lib/prisma";

export type EtpEntry = {
  id: string;
  collaboratorName: string;
  initials: string;
  department: string;
  team: string;
  activityLabel: string;
  hoursSpent: number;
  date: string;
};

export type TeamCharge = {
  team: string;
  department: string;
  consumedHours: number;
  availableHours: number;
};

type Period = "week" | "month" | "quarter";

function getPeriodRange(period: Period): {
  startDate: Date;
  endDate: Date;
  workingDays: number;
  label: string;
} {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();

  if (period === "week") {
    const dow = now.getUTCDay();
    const toMon = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(Date.UTC(y, m, d + toMon));
    const friday = new Date(Date.UTC(y, m, d + toMon + 4));
    const label = `Semaine du ${monday.toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })} au ${friday.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}`;
    return { startDate: monday, endDate: friday, workingDays: 5, label };
  }

  if (period === "month") {
    const start = new Date(Date.UTC(y, m, 1));
    const end = new Date(Date.UTC(y, m + 1, 0));
    const raw = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    const label = raw.charAt(0).toUpperCase() + raw.slice(1);
    return { startDate: start, endDate: end, workingDays: 21, label };
  }

  // quarter
  const q = Math.floor(m / 3);
  const qStart = new Date(Date.UTC(y, q * 3, 1));
  const qEnd = new Date(Date.UTC(y, q * 3 + 3, 0));
  return { startDate: qStart, endDate: qEnd, workingDays: 63, label: `T${q + 1} ${y}` };
}

export async function getEtpData(period: Period): Promise<{
  entries: EtpEntry[];
  teamCharges: TeamCharge[];
  periodLabel: string;
}> {
  const { startDate, endDate, workingDays, label } = getPeriodRange(period);

  const [rawEntries, teams] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        user: { isActive: true },
      },
      select: {
        id: true,
        userId: true,
        hoursSpent: true,
        activityLabel: true,
        date: true,
        user: {
          select: {
            fullName: true,
            teamId: true,
            team: {
              select: {
                id: true,
                name: true,
                subDepartment: {
                  select: { department: { select: { name: true } } },
                },
              },
            },
          },
        },
      },
    }),
    prisma.team.findMany({
      select: {
        id: true,
        name: true,
        subDepartment: {
          select: { department: { select: { name: true } } },
        },
        members: {
          where: { isActive: true, role: "COLLABORATOR" },
          select: { id: true },
        },
      },
    }),
  ]);

  const entries: EtpEntry[] = rawEntries.map((te) => {
    const parts = te.user.fullName.trim().split(/\s+/);
    const initials =
      parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : te.user.fullName.slice(0, 2).toUpperCase();

    return {
      id: te.id,
      collaboratorName: te.user.fullName,
      initials,
      department: te.user.team?.subDepartment?.department?.name ?? "—",
      team: te.user.team?.name ?? "—",
      activityLabel: te.activityLabel,
      hoursSpent: Number(te.hoursSpent),
      date: te.date.toISOString().split("T")[0],
    };
  });

  const teamCharges: TeamCharge[] = teams
    .filter((t) => t.members.length > 0)
    .map((t) => {
      const consumedHours = rawEntries
        .filter((te) => te.user.teamId === t.id)
        .reduce((sum, te) => sum + Number(te.hoursSpent), 0);

      return {
        team: t.name,
        department: t.subDepartment?.department?.name ?? "—",
        consumedHours: Math.round(consumedHours * 10) / 10,
        availableHours: t.members.length * 8 * workingDays,
      };
    });

  return { entries, teamCharges, periodLabel: label };
}
