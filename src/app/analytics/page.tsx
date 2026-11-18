import AnalyticsClient from "./analytics-client";

export const metadata = {
  title: "Analytics | DataScope",
  description: "Dataset performance and transaction analytics.",
};

export default function AnalyticsPage() {
  return <AnalyticsClient />;
}
