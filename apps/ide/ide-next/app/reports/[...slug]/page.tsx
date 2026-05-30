/**
 * Dynamic catch-all report page server wrapper.
 */
import { getDepartments } from "@/lib/department-config";
import ReportSlugPage from "./report-client-page";

export function generateStaticParams() {
  return getDepartments().map((dept) => ({
    slug: [dept.slug, "view"],
  }));
}

export default function Page() {
  return <ReportSlugPage />;
}
