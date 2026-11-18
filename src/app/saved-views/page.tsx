import SavedViewsClient from "./saved-views-client";

export const metadata = {
  title: "Saved Views | DataScope",
  description: "Manage saved data views and restore previous searches.",
};

export default function SavedViewsPage() {
  return <SavedViewsClient />;
}
