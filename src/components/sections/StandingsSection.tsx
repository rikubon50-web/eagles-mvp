import { fetchStandingsFromCsv } from "@/lib/sheets";
import StandingsBoard from "@/components/StandingsBoard";

export default async function StandingsSection() {
  const standingsData = await fetchStandingsFromCsv(process.env.STANDINGS_CSV!);
  return (
    <section>
      <StandingsBoard rows={standingsData.rows} updatedAt={standingsData.updatedAt ?? undefined} />
    </section>
  );
}
