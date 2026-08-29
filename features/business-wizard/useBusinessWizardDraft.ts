"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiClientError } from "@/lib/api/errors";
import { browserApiFetch } from "@/lib/api/browser";

export type WizardServiceDraft = {
  id: string;
  name: string;
  categoryId: string;
  basePriceCents: number;
  baseDurationMins: number;
  optionLabels: string[];
};

export type WizardDocument = {
  id: string;
  documentType: "GOVERNMENT_ID" | "PROFESSIONAL_LICENSE";
};

export type WizardAddress = {
  line1: string;
  line2?: string;
  neighborhood?: string;
  locality: string;
  administrativeArea?: string;
  postalCode?: string;
  countryCode: string;
};

export type WizardApplication = {
  id: string;
  status: "DRAFT" | "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  businessCategory: string | null;
  workMode: string | null;
  businessName: string | null;
  professionalName: string | null;
  businessPhone: string | null;
  businessDescription: string | null;
  logoUrl: string | null;
  handle: string | null;
  locationType: string[];
  hideAddressUntilConfirmed: boolean;
  timezone: string | null;
  workingDays: number[];
  address: WizardAddress | null;
  draftServices: WizardServiceDraft[];
  documents: WizardDocument[];
};

export type WizardStep1Payload = {
  businessCategory?: string;
  workMode?: string;
};

export type WizardStep2Payload = {
  businessName?: string;
  professionalName?: string;
  businessPhone?: string;
  businessDescription?: string;
  handle?: string;
  logoUrl?: string;
};

export type WizardServiceDraftPayload = {
  name: string;
  categoryId: string;
  basePriceCents: number;
  baseDurationMins: number;
  optionLabels: string[];
};

export type WizardStep3Payload = {
  locationType?: string[];
  address?: WizardAddress;
  latitude?: number;
  longitude?: number;
  hideAddressUntilConfirmed?: boolean;
  timezone?: string;
  workingDays?: number[];
  services?: WizardServiceDraftPayload[];
};

const WIZARD_BASE = "/api/v1/professional-applications/wizard";

export function useBusinessWizardDraft() {
  const [application, setApplication] = useState<WizardApplication | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const data = await browserApiFetch<{ application: WizardApplication }>(
        WIZARD_BASE,
      );
      setApplication(data.application);
      setStatus("ready");
    } catch (caught) {
      setStatus("error");
      setError(
        caught instanceof ApiClientError
          ? caught.message
          : "We could not load your application. Try again.",
      );
    }
  }, []);

  useEffect(() => {
    // Loading the draft on mount is the whole point of this hook.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const saveStep1 = useCallback(async (input: WizardStep1Payload) => {
    setSaving(true);
    try {
      const data = await browserApiFetch<{ application: WizardApplication }>(
        `${WIZARD_BASE}/step-1`,
        { method: "PATCH", body: input },
      );
      setApplication(data.application);
      return data.application;
    } finally {
      setSaving(false);
    }
  }, []);

  const saveStep2 = useCallback(async (input: WizardStep2Payload) => {
    setSaving(true);
    try {
      const data = await browserApiFetch<{ application: WizardApplication }>(
        `${WIZARD_BASE}/step-2`,
        { method: "PATCH", body: input },
      );
      setApplication(data.application);
      return data.application;
    } finally {
      setSaving(false);
    }
  }, []);

  const saveStep3 = useCallback(async (input: WizardStep3Payload) => {
    setSaving(true);
    try {
      const data = await browserApiFetch<{ application: WizardApplication }>(
        `${WIZARD_BASE}/step-3`,
        { method: "PATCH", body: input },
      );
      setApplication(data.application);
      return data.application;
    } finally {
      setSaving(false);
    }
  }, []);

  const submit = useCallback(
    async (input: { confirmAccurate: boolean; agreeToProfessionalAgreement: boolean }) => {
      setSaving(true);
      try {
        return await browserApiFetch<{ message: string; status: string }>(
          `${WIZARD_BASE}/submit`,
          { method: "POST", body: input },
        );
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return { application, status, error, saving, saveStep1, saveStep2, saveStep3, submit, reload: load };
}
