import type { Metadata } from "next";
import OverviewClient from "./overview-client";

export const metadata: Metadata = {
  title: "Overview | DataScope",
  description: "Workspace overview and data intelligence summary.",
};

export default function OverviewPage() {
  return <OverviewClient />;
}
