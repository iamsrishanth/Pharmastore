import { getEmployees } from '@/lib/actions/employees';
import EmployeeClient from '@/components/dashboard/EmployeeClient';

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
  const employees = await getEmployees();
  return <EmployeeClient initialEmployees={employees} />;
}
