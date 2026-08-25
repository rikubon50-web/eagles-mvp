import { fetchStandings } from "@/lib/standings";
import StandingsBoard from "@/components/StandingsBoard";

export default async function StandingsSection() {
  const standingsData = await fetchStandings();
  return (
    <section>
      <StandingsBoard rows={standingsData.rows} updatedAt={standingsData.updatedAt ?? undefined} />
    </section>
  );
}
