import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notify";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
  }

  const now = new Date();
  const [y, m, d] = now.toISOString().split("T")[0].split("-").map(Number);
  const todayUTC = new Date(Date.UTC(y, m - 1, d));
  const jsDay = todayUTC.getUTCDay();
  const diffToMonday = jsDay === 0 ? 1 : 8 - jsDay;
  const nextMonday = new Date(Date.UTC(y, m - 1, d + diffToMonday));

  // Cherche tous les Managers actifs ayant ≥1 Collaborateur de leur département
  // sans WeekPlanner SUBMITTED ou VALIDATED pour la semaine prochaine
  const managers = await prisma.user.findMany({
    where: { role: "MANAGER", isActive: true },
    select: { id: true, fullName: true, departmentId: true },
  });

  // Une seule requête pour tous les départements plutôt qu'une par manager (N+1) —
  // les membres sont ensuite regroupés par departmentId en mémoire.
  const allMembers = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: ["COLLABORATOR", "INTERN"] },
      departmentId: { in: managers.map((m) => m.departmentId) },
    },
    select: {
      departmentId: true,
      weekPlanners: {
        where: {
          weekStartDate: nextMonday,
          status: { in: ["SUBMITTED", "VALIDATED"] },
        },
        select: { id: true },
        take: 1,
      },
    },
  });

  let managersNotified = 0;

  for (const manager of managers) {
    const members = allMembers.filter((m) => m.departmentId === manager.departmentId);
    const pendingCount = members.filter((m) => m.weekPlanners.length === 0).length;

    if (pendingCount === 0) continue;

    try {
      await notifyUser(manager.id, {
        title: "Planification de la semaine",
        body: `${pendingCount} membre${pendingCount > 1 ? "s" : ""} n'${pendingCount > 1 ? "ont" : "a"} pas encore soumis le planning de la semaine prochaine.`,
        url: "/week-planner",
        emailTemplate: "weekly-reminder",
        emailData: { pendingCount: String(pendingCount) },
      });
      managersNotified++;
    } catch (error) {
      console.error(`[cron/weekly-planner-reminder] manager ${manager.id}`, error);
    }
  }

  return NextResponse.json({ success: true, data: { managersNotified } });
}
