"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Palette, Loader2 } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
] as const;

type HostTypeRequested = "INDIVIDUAL" | "ORG";
type OrgApprovalStatus = "NONE" | "PENDING";
type PayoutMode = "PLATFORM"; // during signup it is always PLATFORM

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // NEW: Host intent fields
  const [hostTypeRequested, setHostTypeRequested] = useState<HostTypeRequested>("INDIVIDUAL");
  const [orgName, setOrgName] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");
  const [orgCity, setOrgCity] = useState("");
  const [orgState, setOrgState] = useState<(typeof US_STATES)[number] | "">("");
  const [orgProofUrl, setOrgProofUrl] = useState("");

  const isOrg = useMemo(() => hostTypeRequested === "ORG", [hostTypeRequested]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    // If they request org payouts, require a minimum set of info
    if (isOrg) {
      if (!orgName.trim()) {
        toast({ title: "Missing info", description: "Please enter your organization name.", variant: "destructive" });
        return;
      }
      if (!orgCity.trim() || !orgState) {
        toast({ title: "Missing info", description: "Please enter your organization city and state.", variant: "destructive" });
        return;
      }
    }

    setIsLoading(true);

    try {
      const orgApprovalStatus: OrgApprovalStatus = isOrg ? "PENDING" : "NONE";
      const payoutMode: PayoutMode = "PLATFORM";

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,

          // NEW fields for gating payouts
          hostTypeRequested,
          orgApprovalStatus,
          payoutMode,

          // org metadata (only meaningful when ORG)
          orgName: isOrg ? orgName.trim() : null,
          orgWebsite: isOrg ? orgWebsite.trim() || null : null,
          orgCity: isOrg ? orgCity.trim() : null,
          orgState: isOrg ? orgState : null,
          orgProofUrl: isOrg ? orgProofUrl.trim() || null : null,

          // explicitly keep Stripe connect empty at signup
          stripeAccountId: null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      toast({
        title: "Success!",
        description: isOrg
          ? "Account created. Your organization payout request is under review. Please sign in."
          : "Account created. Please sign in.",
      });

      router.push("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-muted/30">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
  <Image
    src="/logo.svg"
    alt="Logo"
    width={48}
    height={48}
    priority
  />
</div>
          </Link>
          <h1 className="font-display text-3xl font-bold">Create your account</h1>
          <p className="text-muted-foreground mt-2">Start hosting paint and sip events today</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Create a new host account to get started</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic account info */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Jane Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Host intent */}
              <div className="space-y-2">
                <Label>How do you plan to host events?</Label>
                <Select
                  value={hostTypeRequested}
                  onValueChange={(v) => setHostTypeRequested(v as HostTypeRequested)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select host type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIVIDUAL">Individual host (default)</SelectItem>
                    <SelectItem value="ORG">Organization host (request payouts)</SelectItem>
                  </SelectContent>
                </Select>
                {isOrg && (
                  <p className="text-xs text-muted-foreground">
                    Organization payouts require review. Until approved, ticket payments route to Paint &amp; Sip Depot.
                  </p>
                )}
              </div>

              {/* Org details (only when ORG) */}
              {isOrg && (
                <div className="space-y-4 rounded-lg border p-3 bg-background">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization name</Label>
                    <Input
                      id="orgName"
                      type="text"
                      placeholder="UNC Charlotte Art Club"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      required={isOrg}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orgWebsite">Website or Instagram (optional)</Label>
                    <Input
                      id="orgWebsite"
                      type="text"
                      placeholder="https://... or @handle"
                      value={orgWebsite}
                      onChange={(e) => setOrgWebsite(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="orgCity">City</Label>
                      <Input
                        id="orgCity"
                        type="text"
                        placeholder="Charlotte"
                        value={orgCity}
                        onChange={(e) => setOrgCity(e.target.value)}
                        required={isOrg}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>State</Label>
                      <Select
                        value={orgState}
                        onValueChange={(v) => setOrgState(v as any)}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orgProofUrl">Proof link (optional)</Label>
                    <Input
                      id="orgProofUrl"
                      type="url"
                      placeholder="Link to doc / folder / verification"
                      value={orgProofUrl}
                      onChange={(e) => setOrgProofUrl(e.target.value)}
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional—adding proof can speed up approval (student org letter, business license, etc.).
                    </p>
                  </div>
                </div>
              )}

              {/* Passwords */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}