import DashboardClient from "./DashboardClient";

export default function Dashboard() {
  // 🔹 All data fetching is now handled by React Query in DashboardClient
  // This allows for better caching, automatic refetching, and client-side updates
  return <DashboardClient />;
}
