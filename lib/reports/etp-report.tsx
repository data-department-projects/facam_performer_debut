import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { EtpEntry, TeamCharge } from "@/lib/dashboard-queries";

const styles = StyleSheet.create({
  page: { padding: 32, fontFamily: "Helvetica" },
  header: { marginBottom: 18 },
  title: { fontSize: 14, fontWeight: "bold", color: "#001b61", marginBottom: 4 },
  subtitle: { fontSize: 9, color: "#6b7280" },
  sectionTitle: { fontSize: 11, fontWeight: "bold", color: "#001b61", marginTop: 18, marginBottom: 6 },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#f0f4fa",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottom: 1,
    borderBottomColor: "#e5e7eb",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottom: 1,
    borderBottomColor: "#e5e7eb",
  },
  cell: { fontSize: 8, color: "#111827" },
  headerCell: { fontSize: 8, fontWeight: "bold", color: "#6b7280" },
  w28: { width: "28%" },
  w25: { width: "25%" },
  w22: { width: "22%" },
  w15: { width: "15%" },
  w10: { width: "10%" },
  w12: { width: "12%" },
  w35: { width: "35%" },
  w20: { width: "20%" },
  right: { textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: "#f9fafb",
  },
  totalCell: { fontSize: 8, fontWeight: "bold", color: "#000d32" },
});

type Props = {
  entries: EtpEntry[];
  teamCharges: TeamCharge[];
  periodLabel: string;
};

function EtpReportDocument({ entries, periodLabel }: Props) {
  // Group by collaborateur
  const byCollab = Object.values(
    entries.reduce<Record<string, { name: string; department: string; team: string; hours: number }>>(
      (acc, e) => {
        if (!acc[e.collaboratorName]) {
          acc[e.collaboratorName] = { name: e.collaboratorName, department: e.department, team: e.team, hours: 0 };
        }
        acc[e.collaboratorName].hours += e.hoursSpent;
        return acc;
      },
      {},
    ),
  ).sort((a, b) => b.hours - a.hours);

  // Group by département
  const byDept = Object.values(
    entries.reduce<Record<string, { department: string; hours: number; collabs: Set<string> }>>(
      (acc, e) => {
        if (!acc[e.department]) acc[e.department] = { department: e.department, hours: 0, collabs: new Set() };
        acc[e.department].hours += e.hoursSpent;
        acc[e.department].collabs.add(e.collaboratorName);
        return acc;
      },
      {},
    ),
  )
    .map((d) => ({ ...d, collabCount: d.collabs.size }))
    .sort((a, b) => b.hours - a.hours);

  const totalHours = byCollab.reduce((s, r) => s + r.hours, 0);
  const genDate = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Rapport Suivi ETP & Temps — FACAM STAIRWAY</Text>
          <Text style={styles.subtitle}>
            {periodLabel} · Généré le {genDate}
          </Text>
        </View>

        {/* Table 1 — Par collaborateur */}
        <Text style={styles.sectionTitle}>Par collaborateur</Text>
        <View>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, styles.w28]}>Collaborateur</Text>
            <Text style={[styles.headerCell, styles.w28]}>Département</Text>
            <Text style={[styles.headerCell, styles.w22]}>Équipe</Text>
            <Text style={[styles.headerCell, styles.w12, styles.right]}>Heures</Text>
            <Text style={[styles.headerCell, styles.w10, styles.right]}>ETP</Text>
          </View>
          {byCollab.map((row) => (
            <View key={row.name} style={styles.row}>
              <Text style={[styles.cell, styles.w28]}>{row.name}</Text>
              <Text style={[styles.cell, styles.w28]}>{row.department}</Text>
              <Text style={[styles.cell, styles.w22]}>{row.team}</Text>
              <Text style={[styles.cell, styles.w12, styles.right]}>{row.hours.toFixed(1)} h</Text>
              <Text style={[styles.cell, styles.w10, styles.right]}>{(row.hours / 8).toFixed(1)} j</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={[styles.totalCell, styles.w28]}>Total</Text>
            <Text style={[styles.totalCell, styles.w28]}></Text>
            <Text style={[styles.totalCell, styles.w22]}></Text>
            <Text style={[styles.totalCell, styles.w12, styles.right]}>{totalHours.toFixed(1)} h</Text>
            <Text style={[styles.totalCell, styles.w10, styles.right]}>{(totalHours / 8).toFixed(1)} j</Text>
          </View>
        </View>

        {/* Table 2 — Par département */}
        <Text style={styles.sectionTitle}>Par département</Text>
        <View>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, styles.w35]}>Département</Text>
            <Text style={[styles.headerCell, styles.w20, styles.right]}>Collaborateurs</Text>
            <Text style={[styles.headerCell, styles.w25, styles.right]}>Heures déclarées</Text>
            <Text style={[styles.headerCell, styles.w20, styles.right]}>ETP consommé</Text>
          </View>
          {byDept.map((row) => (
            <View key={row.department} style={styles.row}>
              <Text style={[styles.cell, styles.w35]}>{row.department}</Text>
              <Text style={[styles.cell, styles.w20, styles.right]}>{row.collabCount}</Text>
              <Text style={[styles.cell, styles.w25, styles.right]}>{row.hours.toFixed(1)} h</Text>
              <Text style={[styles.cell, styles.w20, styles.right]}>{(row.hours / 8).toFixed(1)} j</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

export async function generateEtpPdf(
  entries: EtpEntry[],
  teamCharges: TeamCharge[],
  periodLabel: string,
): Promise<Buffer> {
  return renderToBuffer(
    <EtpReportDocument entries={entries} teamCharges={teamCharges} periodLabel={periodLabel} />,
  ) as Promise<Buffer>;
}
