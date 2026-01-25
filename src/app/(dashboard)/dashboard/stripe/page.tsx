import { auth } from "@/lib/auth"; // adjust if your NextAuth export differs
import { redirect } from "next/navigation";
import { EmbeddedDashboard } from "@/STRIPE-CONNECT-PSD/client/EmbeddedDashboard";

export default async function StripeDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login"); // adjust to your real login path: /(auth)/login
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Stripe</h1>
      <EmbeddedDashboard />
    </div>
  );
}