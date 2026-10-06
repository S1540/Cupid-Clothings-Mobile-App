import CollectionPage from "@/components/catalog/CollectionPage";
import { useLocalSearchParams } from "expo-router";

export default function SearchResults() {
  const { q } = useLocalSearchParams<{ q?: string | string[] }>();
  const query = (Array.isArray(q) ? q[0] : q ?? "").trim();
  return <CollectionPage key={query} searchQuery={query} />;
}
