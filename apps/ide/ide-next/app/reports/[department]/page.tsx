/**
 * Department dynamic index page server wrapper.
 */
import { getDepartments } from "@/lib/department-config";
import DepartmentPage from "./department-client-page";

export function generateStaticParams() {
  return getDepartments().map((dept) => ({
    department: dept.slug,
  }));
}

export default function Page() {
  return <DepartmentPage />;
}
