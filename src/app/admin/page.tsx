import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export default async function AdminPage() {
  const session = await auth();

  if (session?.user?.role === "ADMIN") {
    redirect("/admin/orders");
  }

  if (session?.user) {
    redirect("/dashboard");
  }

  return <AdminLoginForm />;
}
