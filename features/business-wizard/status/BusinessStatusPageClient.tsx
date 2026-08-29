"use client";

import { useEffect, useState } from "react";
import { browserApiFetch } from "@/lib/api/browser";
import { BusinessStatusPage } from "@/features/business-wizard/status/BusinessStatusPage";

type Application = {
  id: string;
  status: string;
  businessName: string | null;
  submittedAt: string | null;
};

export function BusinessStatusPageClient({ userFirstName }: { userFirstName: string }) {
  const [businessName, setBusinessName] = useState<string | null>(null);

  useEffect(() => {
    // The status page shows the most recently *submitted* application -
    // not the wizard's own draft endpoint, which always resolves to the
    // caller's current DRAFT (a fresh, empty one gets created the moment
    // the previous one is submitted - see wizard.service.ts#submitApplication).
    browserApiFetch<{ applications: Application[] }>(
      "/api/v1/professional-applications/me",
    )
      .then((data) => {
        const submitted = data.applications
          .filter((application) => application.status !== "DRAFT")
          .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""))[0];
        setBusinessName(submitted?.businessName ?? "your business");
      })
      .catch(() => setBusinessName("your business"));
  }, []);

  if (businessName === null) {
    return (
      <p className="mx-auto max-w-2xl text-center text-sm text-[var(--color-text-muted)]">
        Loading...
      </p>
    );
  }

  return <BusinessStatusPage businessName={businessName} firstName={userFirstName} />;
}
