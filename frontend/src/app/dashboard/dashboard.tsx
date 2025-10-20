import DashboardClient from "./DashboardClient";

export default async function Dashboard() {
  // 🔹 Saat SSR (dijalankan di server, bukan browser)
  const baseUrl =
    process.env.INTERNAL_API_ENDPOINT ||
    process.env.NEXT_PUBLIC_API_ENDPOINT ||
    "http://localhost:8080";

  try {
    const [reportsRes, countRes] = await Promise.all([
      fetch(`${baseUrl}/reports?anchor_id=0&page=next&page_size=10`, {
        cache: "no-store",
      }),
      fetch(`${baseUrl}/reports/idp-count`, { cache: "no-store" }),
    ]);

    if (!reportsRes.ok || !countRes.ok) {
      throw new Error(`Backend responded with ${reportsRes.status} / ${countRes.status}`);
    }

    const reportsJson = await reportsRes.json();
    const countsJson = await countRes.json();

    return (
      <DashboardClient
        initialReports={reportsJson.data}
        initialCounts={countsJson.data}
      />
    );
  } catch (error) {
    console.error("Gagal memuat data dashboard:", error);
    return (
      <div className="p-6 text-center text-red-500">
        Gagal memuat data dashboard.
      </div>
    );
  }
}