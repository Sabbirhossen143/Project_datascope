import type { Metadata } from "next";
import DatasetLibraryClient from "./dataset-library-client";

export const metadata: Metadata = {
  title: "Dataset Library | DataScope",
  description: "Browse and manage accessible datasets.",
};

export default function DatasetLibraryPage() {
  return <DatasetLibraryClient />;
}
