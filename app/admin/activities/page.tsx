import { getDeletedItems, getItems } from "@/db/activity";
import ItemsClient from "./ItemsClient";

export type AdminItem = {
  id: string;
  name: string;
  score: number;
  checksPerWeek: number;
  allowedWeekdays: string | null;
  scope: string;
  order: number;
  enabled: boolean;
};

export type DeletedItem = {
  id: string;
  name: string;
  deletedAt: string;
};

export default async function AdminActivitiesPage() {
  const [items, deleted] = await Promise.all([getItems(), getDeletedItems()]);

  const deletedItems: DeletedItem[] = deleted.map((item) => ({
    id: item.id,
    name: item.name,
    deletedAt: item.deletedAt
      ? item.deletedAt.toISOString().slice(0, 10)
      : "",
  }));

  return <ItemsClient items={items} deletedItems={deletedItems} />;
}
