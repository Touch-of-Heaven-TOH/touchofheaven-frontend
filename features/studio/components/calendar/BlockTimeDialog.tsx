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
import type { BlockType } from "@/features/studio/lib/types";

export const BLOCK_TYPE_LABEL: Record<BlockType, string> = {
  PERSONAL: "Personal time",
  VACATION: "Vacation",
  HOLIDAY: "Holiday",
  MAINTENANCE: "Studio maintenance",
  MANUAL_APPOINTMENT: "Walk-in / off-platform appointment",
};

/**
 * Takes a slot off the calendar so clients cannot book it. A walk-in is
 * recorded the same way (MANUAL_APPOINTMENT) - it occupies time without a
 * platform booking or payment behind it.
 */
export function BlockTimeDialog({
  open,
  onClose,
  initialType = "PERSONAL",
  initialDate,
}: {
  open: boolean;
  onClose: () => void;
  initialType?: BlockType;
  initialDate?: string;
}) {
  const { timezone } = useStudio();
  const notify = useToast();
  const { mutate } = useSWRConfig();
  const [date, setDate] = useState(() => initialDate ?? dateKeyIn(new Date(), timezone));
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");
  const [blockType, setBlockType] = useState<BlockType>(initialType);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      await studioRequest("/api/v1/availability/blocked-periods", "POST", {
        startAt: zonedTimeToUtc(date, startTime, timezone).toISOString(),
        endAt: zonedTimeToUtc(date, endTime, timezone).toISOString(),
        blockType,
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      });
      await mutate(
        (key) => typeof key === "string" && key.startsWith("/api/v1/business/calendar"),
      );
      notify({
        tone: "success",
        title: blockType === "MANUAL_APPOINTMENT" ? "Walk-in recorded" : "Time blocked",
        description: "Clients can no longer book that time.",
      });
      onClose();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <StudioDialog
      open={open}
      onClose={onClose}
      title={blockType === "MANUAL_APPOINTMENT" ? "Record a walk-in" : "Block time"}
      description={`Times are in ${timezone}.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void save()} loading={saving}>
            Save
          </Button>
        </>
      }
    >
      <div className="grid *:min-w-0 gap-4">
        <SelectField
          label="What is this time for?"
          value={blockType}
          onChange={(event) => setBlockType(event.target.value as BlockType)}
        >
          {(Object.keys(BLOCK_TYPE_LABEL) as BlockType[]).map((type) => (
            <option key={type} value={type}>
              {BLOCK_TYPE_LABEL[type]}
            </option>
          ))}
        </SelectField>
        <Input label="Date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        <div className="grid *:min-w-0 gap-4 sm:grid-cols-2">
          <Input
            label="Starts"
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            required
          />
          <Input
            label="Ends"
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            required
          />
        </div>
        <TextAreaField
          label="Private note (optional)"
          hint="Only your business can see this."
          value={reason}
          maxLength={500}
          onChange={(event) => setReason(event.target.value)}
        />
        <FormError message={error} />
      </div>
    </StudioDialog>
  );
}
