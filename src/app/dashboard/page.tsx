import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ClientRedirect from "@/components/shared/ClientRedirect";

export default async function DashboardRootPage() {
  const session = await getServerSession(authOptions);

  let targetUrl = "/auth/signin";

  if (session) {
    const role = session.user.role;
    if (role === "ADMIN") {
      targetUrl = "/admin/users";
    } else if (role === "OWNER" || role === "WAREHOUSE_OWNER") {
      targetUrl = "/dashboard/warehouse";
    } else if (role === "CLIENT") {
      targetUrl = "/dashboard/client";
    } else {
      targetUrl = "/unauthorized";
    }
  }

  return <ClientRedirect to={targetUrl} />;
}
