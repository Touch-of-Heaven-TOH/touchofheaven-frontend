"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/shared/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import { Input } from "@/components/shared/Input";
import {
  Card,
  FormError,
  PageHeader,
  Pill,
  SelectField,
  SkeletonRows,
  TextAreaField,
} from "@/features/studio/components/ui/primitives";
import { SERVICE_STATUS } from "@/features/studio/components/services/StudioServices";
import { useToast } from "@/features/studio/components/ui/Toaster";
import { errorMessage, studioFetcher, studioRequest } from "@/features/studio/lib/api";
import { formatMoney, parseMoneyToCents } from "@/features/studio/lib/format";
import type { OwnService } from "@/features/studio/lib/types";
import { CANCELLATION_POLICIES } from "@/lib/businesses/policies";

type Category = { id: string; name: string; slug: string };

const POLICIES = CANCELLATION_POLICIES;

const VARIATION_TYPES = {
  LENGTH: "Length",
  SIZE: "Size",
  COLOR: "Colour",
  HAIR_INCLUSION: "Hair included",
  ADD_ON: "Add-on",
  REMOVAL: "Takedown / removal",
  AGE_GROUP: "Age group",
} as const;

export function ServiceEditor({ serviceId }: { serviceId: string | null }) {
  const { data: categories } = useSWR<{ categories: Category[] }>("/api/v1/services/categories", studioFetcher);
  const { data: existing, error, isLoading, mutate } = useSWR<{ service: OwnService & { categoryId: string } }>(
    serviceId ? `/api/v1/services/${serviceId}` : null,
    studioFetcher,
  );

  if (serviceId && isLoading && !existing) {
    return (
      <div className="grid *:min-w-0 gap-5">
        <PageHeader title="Edit service" backHref="/studio/services" backLabel="Services" />
        <SkeletonRows label="Loading service" rows={3} />
      </div>
    );
  }
  if (serviceId && error && !existing) {
    return (
      <div className="grid *:min-w-0 gap-5">
        <PageHeader title="Edit service" backHref="/studio/services" backLabel="Services" />
        <ErrorState description={errorMessage(error)} onRetry={() => void mutate()} />
      </div>
    );
  }

  return (
    <ServiceForm
      key={existing?.service.id ?? "new"}
      service={existing?.service ?? null}
      categories={categories?.categories ?? []}
      onVariationsChanged={() => void mutate()}
    />
  );
}

function ServiceForm({
  service,
  categories,
  onVariationsChanged,
}: {
  service: (OwnService & { categoryId: string }) | null;
  categories: Category[];
  onVariationsChanged: () => void;
}) {
  const router = useRouter();
  const notify = useToast();
  const [name, setName] = useState(service?.name ?? "");
  const [categoryId, setCategoryId] = useState(service?.categoryId ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [price, setPrice] = useState(service ? (service.basePriceCents / 100).toFixed(2) : "");
  const [duration, setDuration] = useState(service ? String(service.baseDurationMins) : "120");
  const [deposit, setDeposit] = useState(service ? String(service.depositPercentage) : "20");
  const [policy, setPolicy] = useState(service?.cancellationPolicy ?? "standard-v1");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setError(null);
    const basePriceCents = parseMoneyToCents(price);
    const baseDurationMins = Number(duration);
    const depositPercentage = Number(deposit);
    if (!name.trim()) return setError("Give the service a name.");
    if (!categoryId) return setError("Choose a category so clients can find it.");
    if (basePriceCents === null) return setError("Enter the starting price, for example 120 or 120.50.");
    if (!Number.isInteger(baseDurationMins) || baseDurationMins < 5 || baseDurationMins > 1440) {
      return setError("Duration must be between 5 and 1440 minutes.");
    }
    if (!Number.isInteger(depositPercentage) || depositPercentage < 0 || depositPercentage > 100) {
      return setError("Deposit must be a whole percentage between 0 and 100.");
    }

    setSaving(true);
    try {
      const body = {
        categoryId,
        name: name.trim(),
        basePriceCents,
        baseDurationMins,
        depositPercentage,
        cancellationPolicy: policy,
      };
      if (service) {
        await studioRequest(`/api/v1/services/${service.id}`, "PATCH", {
          ...body,
          description: description.trim() || null,
        });
        notify({ tone: "success", title: "Service saved" });
        router.push("/studio/services");
      } else {
        const created = await studioRequest<{ service: { id: string } }>("/api/v1/services", "POST", {
          ...body,
          ...(description.trim() ? { description: description.trim() } : {}),
        });
        notify({
          tone: "success",
          title: "Service created as a draft",
          description: "Add price options if you need them, then publish it.",
        });
        router.replace(`/studio/services/${created.service.id}`);
      }
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid *:min-w-0 gap-5">
      <PageHeader
        backHref="/studio/services"
        backLabel="Services"
        title={service ? service.name : "New service"}
        actions={service ? <Pill tone={SERVICE_STATUS[service.status].tone}>{SERVICE_STATUS[service.status].label}</Pill> : null}
      />

      <div className="grid *:min-w-0 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card title="Details">
          <div className="grid *:min-w-0 gap-4">
            <Input label="Name" value={name} maxLength={140} onChange={(event) => setName(event.target.value)} required />
            <SelectField label="Category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              <option value="" disabled>
                Choose a category
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </SelectField>
            <TextAreaField
              label="Description"
              value={description}
              maxLength={4000}
              rows={5}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What's included, how long it lasts, how to prepare."
            />
            <div className="grid *:min-w-0 gap-4 sm:grid-cols-3">
              <Input label="Starting price (USD)" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} required />
              <Input label="Duration (minutes)" inputMode="numeric" value={duration} onChange={(event) => setDuration(event.target.value)} required />
              <Input label="Deposit (%)" inputMode="numeric" value={deposit} onChange={(event) => setDeposit(event.target.value)} required />
            </div>
            <fieldset className="grid *:min-w-0 gap-2">
              <legend className="mb-1 text-sm font-semibold text-[var(--color-text-primary)]">Cancellation policy</legend>
              {POLICIES.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
                    policy === option.value
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-brand)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="policy"
                    value={option.value}
                    checked={policy === option.value}
                    onChange={() => setPolicy(option.value)}
                    className="mt-1 size-4 accent-[var(--color-brand)]"
                  />
                  <span>
                    <span className="block text-sm font-semibold">{option.label}</span>
                    <span className="block text-xs text-[var(--color-text-muted)]">{option.description}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <FormError message={error} />
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => router.push("/studio/services")}>
                Cancel
              </Button>
              <Button loading={saving} onClick={() => void save()}>
                {service ? "Save changes" : "Create service"}
              </Button>
            </div>
          </div>
        </Card>

        {service ? (
          <VariationsCard service={service} onChanged={onVariationsChanged} />
        ) : (
          <Card title="Price options">
            <p className="text-sm text-[var(--color-text-muted)]">
              Once the service is created you can add options such as length, size or included hair, each
              adjusting the price and time.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function VariationsCard({ service, onChanged }: { service: OwnService; onChanged: () => void }) {
  const notify = useToast();
  const [type, setType] = useState<keyof typeof VARIATION_TYPES>("LENGTH");
  const [label, setLabel] = useState("");
  const [priceDelta, setPriceDelta] = useState("");
  const [durationDelta, setDurationDelta] = useState("0");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const add = async () => {
    setError(null);
    const cents = parseMoneyToCents(priceDelta.replace(/^\+/, "") || "0");
    const minutes = Number(durationDelta || "0");
    if (!label.trim()) return setError("Name the option, for example “Waist length”.");
    if (cents === null) return setError("Enter the extra price as a number.");
    if (!Number.isInteger(minutes)) return setError("Extra time must be whole minutes.");
    setPending("add");
    try {
      await studioRequest(`/api/v1/services/${service.id}/variations`, "POST", {
        variationType: type,
        label: label.trim(),
        priceDeltaCents: cents,
        durationDeltaMins: minutes,
      });
      notify({ tone: "success", title: "Option added" });
      setLabel("");
      setPriceDelta("");
      setDurationDelta("0");
      onChanged();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(null);
    }
  };

  const remove = async (variationId: string) => {
    setPending(variationId);
    setError(null);
    try {
      await studioRequest(`/api/v1/services/${service.id}/variations/${variationId}`, "DELETE");
      notify({ tone: "success", title: "Option removed" });
      onChanged();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(null);
    }
  };

  return (
    <Card title="Price options">
      {service.variations.length === 0 ? (
        <p className="mb-4 text-sm text-[var(--color-text-muted)]">No options yet. Clients book the base price.</p>
      ) : (
        <ul className="mb-4 grid gap-2">
          {service.variations.map((variation) => (
            <li key={variation.id} className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{variation.label}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {VARIATION_TYPES[variation.variationType as keyof typeof VARIATION_TYPES] ?? variation.variationType} · +
                  {formatMoney(variation.priceDeltaCents)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void remove(variation.id)}
                disabled={pending !== null}
                aria-label={`Remove ${variation.label}`}
                className="grid size-10 shrink-0 place-items-center rounded-full text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] disabled:opacity-50"
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid *:min-w-0 gap-3 border-t border-[var(--color-border)] pt-4">
        <p className="text-sm font-semibold">Add an option</p>
        <SelectField label="Type" value={type} onChange={(event) => setType(event.target.value as keyof typeof VARIATION_TYPES)}>
          {Object.entries(VARIATION_TYPES).map(([value, text]) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
        </SelectField>
        <Input label="Option name" value={label} maxLength={80} onChange={(event) => setLabel(event.target.value)} placeholder="Waist length" />
        <div className="grid *:min-w-0 gap-3 sm:grid-cols-2">
          <Input label="Extra price (USD)" inputMode="decimal" value={priceDelta} onChange={(event) => setPriceDelta(event.target.value)} placeholder="40" />
          <Input label="Extra time (min)" inputMode="numeric" value={durationDelta} onChange={(event) => setDurationDelta(event.target.value)} />
        </div>
        <FormError message={error} />
        <div className="flex justify-end">
          <Button variant="secondary" loading={pending === "add"} disabled={pending !== null} onClick={() => void add()}>
            Add option
          </Button>
        </div>
      </div>
    </Card>
  );
}
