"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { Modal } from "@/components/shared/Modal";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { browserApiFetch } from "@/lib/api/browser";
import { ApiClientError } from "@/lib/api/errors";
import {
  ADDRESS_PURPOSES,
  emptyAddressForm,
  type AddressFormValues,
  type AddressPurpose,
  type CustomerAddress,
} from "@/lib/account/types";

type AddressesResponse = { addresses: CustomerAddress[] };

function fetchAddresses(path: string): Promise<AddressesResponse> {
  return browserApiFetch<AddressesResponse>(path);
}

function buildPayload(values: AddressFormValues) {
  return {
    label: values.label.trim(),
    recipientName: values.recipientName.trim(),
    line1: values.line1.trim(),
    locality: values.locality.trim(),
    countryCode: values.countryCode.trim().toUpperCase(),
    purpose: values.purpose,
    isDefault: values.isDefault,
    ...(values.recipientPhone.trim() ? { recipientPhone: values.recipientPhone.trim() } : {}),
    ...(values.line2.trim() ? { line2: values.line2.trim() } : {}),
    ...(values.administrativeArea.trim()
      ? { administrativeArea: values.administrativeArea.trim() }
      : {}),
    ...(values.postalCode.trim() ? { postalCode: values.postalCode.trim() } : {}),
  };
}

export function AddressesManager() {
  const { data, error, isLoading, mutate } = useSWR<AddressesResponse>(
    "/api/v1/customer/addresses",
    fetchAddresses,
  );
  const addresses = data?.addresses ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressFormValues>(emptyAddressForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function openAdd() {
    setEditingId(null);
    setForm(emptyAddressForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(address: CustomerAddress) {
    setEditingId(address.id);
    setForm({
      label: address.label,
      recipientName: address.recipientName,
      recipientPhone: address.recipientPhone ?? "",
      line1: address.line1,
      line2: address.line2 ?? "",
      administrativeArea: address.administrativeArea ?? "",
      locality: address.locality,
      postalCode: address.postalCode ?? "",
      countryCode: address.countryCode,
      purpose: address.purpose,
      isDefault: address.isDefault,
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setFormError(null);
    try {
      const payload = buildPayload(form);
      if (editingId) {
        await browserApiFetch(`/api/v1/customer/addresses/${editingId}`, {
          method: "PATCH",
          body: payload,
        });
      } else {
        await browserApiFetch("/api/v1/customer/addresses", {
          method: "POST",
          body: payload,
        });
      }
      setModalOpen(false);
      await mutate();
    } catch (err) {
      setFormError(
        err instanceof ApiClientError ? err.message : "We couldn't save this address.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await browserApiFetch(`/api/v1/customer/addresses/${id}`, { method: "DELETE" });
    await mutate();
  }

  async function handleSetDefault(address: CustomerAddress) {
    await browserApiFetch(`/api/v1/customer/addresses/${address.id}`, {
      method: "PATCH",
      body: { isDefault: true },
    });
    await mutate();
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--color-brand)]">Account</p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">
            Addresses
          </h1>
        </div>
        <Button onClick={openAdd}>Add address</Button>
      </div>

      {isLoading && addresses.length === 0 ? (
        <LoadingSkeleton label="Loading addresses" lines={3} />
      ) : error && addresses.length === 0 ? (
        <ErrorState description="We couldn't load your addresses." onRetry={() => void mutate()} />
      ) : addresses.length === 0 ? (
        <EmptyState
          title="No addresses yet"
          description="Add an address to speed up booking and checkout."
          action={<Button onClick={openAdd}>Add address</Button>}
        />
      ) : (
        <ul role="list" className="grid gap-3">
          {addresses.map((address) => (
            <li key={address.id} className="surface-panel p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 font-semibold text-[var(--color-text-primary)]">
                    {address.label}
                    {address.isDefault ? (
                      <span className="rounded-full bg-[var(--color-brand-soft)] px-2 py-0.5 text-xs font-bold text-[var(--color-brand)]">
                        Default
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {address.recipientName}
                    <br />
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}
                    <br />
                    {address.locality}
                    {address.administrativeArea ? `, ${address.administrativeArea}` : ""}{" "}
                    {address.postalCode ?? ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2 text-sm">
                  <button
                    type="button"
                    className="font-semibold text-[var(--color-brand)]"
                    onClick={() => openEdit(address)}
                  >
                    Edit
                  </button>
                  {!address.isDefault ? (
                    <button
                      type="button"
                      className="text-[var(--color-text-muted)]"
                      onClick={() => void handleSetDefault(address)}
                    >
                      Set default
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="text-[var(--color-danger)]"
                    onClick={() => void handleDelete(address.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit address" : "Add address"}
      >
        <div className="grid gap-3">
          <Input
            label="Label"
            placeholder="Home, Salon, etc."
            value={form.label}
            onChange={(event) => setForm({ ...form, label: event.target.value })}
          />
          <Input
            label="Recipient name"
            value={form.recipientName}
            onChange={(event) => setForm({ ...form, recipientName: event.target.value })}
          />
          <Input
            label="Phone (optional)"
            placeholder="+15551234567"
            value={form.recipientPhone}
            onChange={(event) => setForm({ ...form, recipientPhone: event.target.value })}
          />
          <Input
            label="Address line 1"
            value={form.line1}
            onChange={(event) => setForm({ ...form, line1: event.target.value })}
          />
          <Input
            label="Address line 2 (optional)"
            value={form.line2}
            onChange={(event) => setForm({ ...form, line2: event.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              value={form.locality}
              onChange={(event) => setForm({ ...form, locality: event.target.value })}
            />
            <Input
              label="State / area (optional)"
              value={form.administrativeArea}
              onChange={(event) =>
                setForm({ ...form, administrativeArea: event.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Postal code (optional)"
              value={form.postalCode}
              onChange={(event) => setForm({ ...form, postalCode: event.target.value })}
            />
            <Input
              label="Country code"
              placeholder="US"
              maxLength={2}
              value={form.countryCode}
              onChange={(event) => setForm({ ...form, countryCode: event.target.value })}
            />
          </div>
          <label className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
            Purpose
            <select
              className="min-h-11 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm focus-ring"
              value={form.purpose}
              onChange={(event) =>
                setForm({ ...form, purpose: event.target.value as AddressPurpose })
              }
            >
              {ADDRESS_PURPOSES.map((purpose) => (
                <option key={purpose} value={purpose}>
                  {purpose.charAt(0) + purpose.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(event) => setForm({ ...form, isDefault: event.target.checked })}
            />
            Set as default
          </label>

          {formError ? (
            <p role="alert" className="text-sm text-[var(--color-danger)]">
              {formError}
            </p>
          ) : null}

          <Button loading={saving} onClick={() => void handleSave()}>
            {editingId ? "Save changes" : "Add address"}
          </Button>
        </div>
      </Modal>
    </section>
  );
}
