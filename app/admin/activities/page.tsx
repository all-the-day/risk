import { getTemplates } from "@/db/activity";
import TemplatesClient from "./TemplatesClient";

export default async function AdminActivitiesPage() {
  const templates = await getTemplates();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">活动模板</h1>
      <TemplatesClient initialTemplates={JSON.parse(JSON.stringify(templates))} />
    </div>
  );
}
