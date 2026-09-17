"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { StudioDialog } from "@/features/studio/components/ui/StudioDialog";
import { FormError, SelectField, TextAreaField } from "@/features/studio/components/ui/primitives";
import { useToast } from "@/features/studio/components/ui/Toaster";
import { errorMessage, studioRequest } from "@/features/studio/lib/api";
import { useStudio } from "@/features/studio/lib/context";
import { dateKeyIn, zonedTimeToUtc } from "@/features/studio/lib/format";
import type { BlockType, CalendarBlockedPeriod } from "@/features/studio/lib/types";

export const BLOCK_TYPE_LABEL: Record<BlockType, string> = {
  PERSONAL: "Personal time",
  VACATION: "Vacation",
  HOLIDAY: "Holiday",
  MAINTENANCE: "Studio maintenance",
  MANUAL_APPOINTMENT: "Walk-in / off-platform appointment",
};

function timeIn(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

/**
 * Takes a slot off the calendar so clients cannot book it, and edits or
 * removes one that is already there. A walk-in is recorded the same way
 * (MANUAL_APPOINTMENT) - it occupies time without a platform booking or
 * payment behind it.
 */
export function BlockTimeDialog({
  open,
  onClose,
  initialType = "PERSONAL",
  initialDate,
  block,
  canEdit = true,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  initialType?: BlockType;
  initialDate?: string;
  /** An existing block to change. Omitted when adding a new one. */
  block?: CalendarBlockedPeriod | null;
  canEdit?: boolean;
  onDeleted?: () => void;
}) {
  const { timezone } = useStudio();
  const notify = useToast();
  const { mutate } = useSWRConfig();
  const editing = Boolean(block);
  const [date, setDate] = useState(() =>
    block ? dateKeyIn(new Date(block.startAt), timezone) : (initialDate ?? dateKeyIn(new Date(), timezone)),
  );
  const [startTime, setStartTime] = useState(() => (block ? timeIn(block.startAt, timezone) : "12:00"));
  const [endTime, setEndTime] = useState(() => (block ? timeIn(block.endAt, timezone) : "13:00"));
  const [blockType, setBlockType] = useState<BlockType>(block?.blockType ?? initialType);
  const [reason, setReason] = useState(block?.reason ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const refreshCalendar = () =>
    mutate((key) => typeof key === "string" && key.startsWith("/api/v1/business/calendar"));

  async function save() {
    setError(null);
    if (!date || !startTime || !endTime) {
      setError("Choose a date, a start time and an end time.");
      return;
    }
    if (endTime <= startTime) {
      setError("The end time must be after the start time.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        startAt: zonedTimeToUtc(date, startTime, timezone).toISOString(),
        endAt: zonedTimeToUtc(date, endTime, timezone).toISOString(),
        blockType,
        reason: reason.trim() || null,
      };
      if (block) {
        await studioRequest(`/api/v1/availability/blocked-periods/${block.id}`, "PATCH", body);
      } else {
        await studioRequest("/api/v1/availability/blocked-periods", "POST", {
          ...body,
          ...(body.reason === null ? { reason: undefined } : {}),
        });
      }
      await refreshCalendar();
      notify({
        tone: "success",
        title: editing
          ? "Blocked time updated"
          : blockType === "MANUAL_APPOINTMENT"
            ? "Walk-in recorded"
            : "Time blocked",
        description: editing
          ? "Your calendar and what clients can book are up to date."
          : "Clients can no longer book that time.",
      });
      onClose();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!block) return;
    setDeleting(true);
    setError(null);
    try {
      await studioRequest(`/api/v1/availability/blocked-periods/${block.id}`, "DELETE");
      await refreshCalendar();
      notify({ tone: "success", title: "Time unblocked", description: "Clients can book it again." });
      (onDeleted ?? onClose)();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <StudioDialog
      open={open}
      onClose={onClose}
      title={
        editing
          ? canEdit
            ? "Edit blocked time"
            : BLOCK_TYPE_LABEL[blockType]
          : blockType === "MANUAL_APPOINTMENT"
            ? "Record a walk-in"
            : "Block time"
      }
      description={`Times are in ${timezone}.`}
      footer={
        <>
          {editing && canEdit ? (
            <Button variant="danger" loading={deleting} onClick={() => void remove()}>
              Remove block
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onClose}>
            {canEdit ? "Cancel" : "Close"}
          </Button>
          {canEdit ? (
            <Button onClick={() => void save()} loading={saving}>
              {editing ? "Save changes" : "Save"}
            </Button>
          ) : null}
        </>
      }
    >
      <div className="grid gap-4 *:min-w-0">
        <SelectField
          label="What is this time for?"
          value={blockType}
          disabled={!canEdit}
          onChange={(event) => setBlockType(event.target.value as BlockType)}
        >
          {(Object.keys(BLOCK_TYPE_LABEL) as BlockType[]).map((type) => (
            <option key={type} value={type}>
              {BLOCK_TYPE_LABEL[type]}
            </option>
          ))}
        </SelectField>
        <Input
          label="Date"
          type="date"
          value={date}
          disabled={!canEdit}
          onChange={(event) => setDate(event.target.value)}
          required
        />
        <div className="grid gap-4 *:min-w-0 sm:grid-cols-2">
          <Input
            label="Starts"
            type="time"
            value={startTime}
            disabled={!canEdit}
            onChange={(event) => setStartTime(event.target.value)}
            required
          />
          <Input
            label="Ends"
            type="time"
            value={endTime}
            disabled={!canEdit}
            onChange={(event) => setEndTime(event.target.value)}
            required
          />
        </div>
        <TextAreaField
          label="Private note (optional)"
          hint="Only your business can see this."
          value={reason}
          maxLength={500}
          disabled={!canEdit}
          onChange={(event) => setReason(event.target.value)}
        />
        <FormError message={error} />
      </div>
    </StudioDialog>
  );
}
