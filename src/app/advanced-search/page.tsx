import type { Metadata } from "next";
import AdvancedSearchClient from "./advanced-search-client";
export const metadata: Metadata = { title: "Advanced Search | DataScope", description: "Build precise multi-condition searches across authorized datasets." };
export default function AdvancedSearchPage() { return <AdvancedSearchClient />; }
