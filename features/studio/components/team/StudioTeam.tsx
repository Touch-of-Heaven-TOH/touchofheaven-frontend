"use client";

import { Crown, UserPlus, UsersRound } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/shared/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import { Input } from "@/components/shared/Input";
import { StudioDialog } from "@/features/studio/components/ui/StudioDialog";
import {
  Avatar,
  Card,
  EmptyPanel,
  FormError,
  PageHeader,
  Pill,
  SelectField,
  SkeletonRows,
} from "@/features/studio/components/ui/primitives";
import { useToast } from "@/features/studio/components/ui/Toaster";
import { errorMessage, studioFetcher, studioRequest } from "@/features/studio/lib/api";
import type {
  AccessLevel,
  BusinessModule,
  TeamMember,
  TeamResponse,
  TeamRole,
} from "@/features/studio/lib/types";

type AssignableRole = Exclude<TeamRole, "OWNER">;

const MODULE_LABEL: Record<BusinessModule, string> = {
  overview: "Home",
  calendar: "Calendar",
  appointments: "Appointments",
  clients: "Clients",
  services: "Services",
  availability: "Availability",
  waitlist: "Waitlist",
  team: "Team",
  earnings: "Earnings",
  analytics: "Analytics",
  portfolio: "Portfolio",
};

const ROLE_HELP: Record<AssignableRole, string> = {
  MANAGER: "Runs the business day to day. Can see earnings but not change the team.",
  RECEPTIONIST: "Front desk: calendar, check-ins, clients and the waitlist. No money or team access.",
  STAFF: "A stylist. Sees and works only the appointments assigned to them.",
};

const STATUS_PILL = {
  INVITED: { label: "Invited", tone: "warning" },
  ACTIVE: { label: "Active", tone: "success" },
  SUSPENDED: { label: "Suspended", tone: "danger" },
  REMOVED: { label: "Removed", tone: "neutral" },
} as const;

export function StudioTeam() {
  const searchParams = useSearchParams();
  const { data, error, isLoading, mutate } = useSWR<TeamResponse>("/api/v1/business/team", studioFetcher);
  const [inviting, setInviting] = useState(() => searchParams.get("invite") === "1");
  const [editing, setEditing] = useState<TeamMember | null>(null);

  return (
    <div className="grid *:min-w-0 gap-5">
      <PageHeader
        title="Team"
        description="Give the people you work with their own sign-in and exactly the access they need."
        actions={
          data?.canManage ? (
            <Button leadingIcon={<UserPlus aria-hidden="true" className="size-4" />} onClick={() => setInviting(true)}>
              Invite
            </Button>
          ) : null
        }
      />

      {isLoading && !data ? (
        <SkeletonRows label="Loading team" rows={3} />
      ) : error && !data ? (
        <ErrorState description={errorMessage(error)} onRetry={() => void mutate()} />
      ) : data ? (
        <>
          {data.owner ? (
            <Card>
              <div className="flex items-center gap-3">
                <Avatar name={data.owner.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[var(--color-text-primary)]">{data.owner.name}</p>
                  <p className="truncate text-sm text-[var(--color-text-muted)]">{data.owner.email}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--color-gold-light)] px-2.5 py-1 text-xs font-bold text-[#6b4a12]">
                  <Crown aria-hidden="true" className="size-3.5" />
                  Owner
                </span>
              </div>
            </Card>
          ) : null}

          {data.members.length === 0 ? (
            <EmptyPanel
              icon={<UsersRound aria-hidden="true" className="size-6" />}
              title="It's just you for now"
              description="Invite a stylist, receptionist or manager. They sign in with their own account, and you choose what they can see and do."
              action={
                data.canManage ? (
                  <Button onClick={() => setInviting(true)}>Invite your first team member</Button>
                ) : null
              }
            />
          ) : (
            <ul className="grid *:min-w-0 gap-3 md:grid-cols-2">
              {data.members.map((member) => (
                <li key={member.id}>
                  <article className="flex h-full flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-subtle)]">
                    <div className="flex items-start gap-3">
                      <Avatar name={member.displayName} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-[var(--color-text-primary)]">{member.displayName}</p>
                        <p className="truncate text-sm text-[var(--color-text-muted)]">
                          {member.jobTitle ? `${member.jobTitle} · ` : ""}
                          {member.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="brand">{member.roleLabel}</Pill>
                      <Pill tone={STATUS_PILL[member.status].tone}>{STATUS_PILL[member.status].label}</Pill>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {member.upcomingAppointments} upcoming
                      </span>
                    </div>
                    {member.status === "INVITED" ? (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {member.hasAccount
                          ? "They have been emailed and will see the invitation when they sign in."
                          : "They need to create a Touch of Heaven account with this email to accept."}
                      </p>
                    ) : null}
                    {data.canManage ? (
                      <div className="mt-auto flex justify-end">
                        <Button variant="secondary" onClick={() => setEditing(member)}>
                          Manage access
                        </Button>
                      </div>
                    ) : null}
                  </article>
                </li>
              ))}
            </ul>
          )}

          {inviting ? (
            <InviteDialog team={data} onClose={() => setInviting(false)} onSaved={() => void mutate()} />
          ) : null}
          {editing ? (
            <EditDialog team={data} member={editing} onClose={() => setEditing(null)} onSaved={() => void mutate()} />
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function PermissionMatrix({
  modules,
  value,
  onChange,
}: {
  modules: BusinessModule[];
  value: Record<BusinessModule, AccessLevel>;
  onChange: (next: Record<BusinessModule, AccessLevel>) => void;
}) {
  return (
    <div className="grid *:min-w-0 gap-2">
      {modules.map((module) => (
        <div key={module} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">{MODULE_LABEL[module]}</span>
          <div role="radiogroup" aria-label={`${MODULE_LABEL[module]} access`} className="inline-flex rounded-full bg-[var(--color-surface-strong)] p-0.5">
            {(["none", "view", "manage"] as AccessLevel[]).map((level) => {
              const selected = value[module] === level;
              return (
                <button
                  key={level}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange({ ...value, [module]: level })}
                  className={`min-h-8 rounded-full px-3 text-xs font-semibold capitalize ${
                    selected ? "bg-[var(--color-brand)] text-white" : "text-[var(--color-text-muted)] hover:text-[var(--color-brand)]"
                  }`}
                >
                  {level === "none" ? "No access" : level}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function overridesFor(
  team: TeamResponse,
  role: AssignableRole,
  permissions: Record<BusinessModule, AccessLevel>,
) {
  const defaults = team.roleDefaults[role];
  return Object.fromEntries(
    team.modules.filter((module) => permissions[module] !== defaults[module]).map((module) => [module, permissions[module]]),
  ) as Partial<Record<BusinessModule, AccessLevel>>;
}

function InviteDialog({ team, onClose, onSaved }: { team: TeamResponse; onClose: () => void; onSaved: () => void }) {
  const notify = useToast();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [role, setRole] = useState<AssignableRole>("STAFF");
  const [customize, setCustomize] = useState(false);
  const [permissions, setPermissions] = useState(team.roleDefaults.STAFF);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeRole = (next: AssignableRole) => {
    setRole(next);
    setPermissions(team.roleDefaults[next]);
  };

  const submit = async () => {
    setError(null);
    if (!displayName.trim() || !email.trim()) {
      setError("Enter their name and email address.");
      return;
    }
    setSaving(true);
    try {
      await studioRequest("/api/v1/business/team", "POST", {
        displayName: displayName.trim(),
        email: email.trim(),
        role,
        ...(jobTitle.trim() ? { jobTitle: jobTitle.trim() } : {}),
        ...(customize ? { permissions: overridesFor(team, role, permissions) } : {}),
      });
      notify({ tone: "success", title: "Invitation sent", description: `${displayName.trim()} can accept it when they sign in.` });
      onSaved();
      onClose();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  return (
    <StudioDialog
      open
      onClose={onClose}
      title="Invite a team member"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={() => void submit()}>
            Send invitation
          </Button>
        </>
      }
    >
      <div className="grid *:min-w-0 gap-4">
        <div className="grid *:min-w-0 gap-4 sm:grid-cols-2">
          <Input label="Name" value={displayName} maxLength={120} onChange={(event) => setDisplayName(event.target.value)} required />
          <Input label="Email" type="email" value={email} maxLength={320} onChange={(event) => setEmail(event.target.value)} required />
        </div>
        <div className="grid *:min-w-0 gap-4 sm:grid-cols-2">
          <Input
            label="Job title (optional)"
            value={jobTitle}
            maxLength={80}
            onChange={(event) => setJobTitle(event.target.value)}
            placeholder="Senior braider"
          />
          <SelectField
            label="Role"
            value={role}
            onChange={(event) => changeRole(event.target.value as AssignableRole)}
            hint={ROLE_HELP[role]}
          >
            <option value="STAFF">Staff member</option>
            <option value="RECEPTIONIST">Receptionist</option>
            <option value="MANAGER">Manager</option>
          </SelectField>
        </div>
        <label className="flex items-center gap-3 text-sm font-semibold text-[var(--color-text-primary)]">
          <input
            type="checkbox"
            checked={customize}
            onChange={(event) => setCustomize(event.target.checked)}
            className="size-4 accent-[var(--color-brand)]"
          />
          Customise what they can access
        </label>
        {customize ? <PermissionMatrix modules={team.modules} value={permissions} onChange={setPermissions} /> : null}
        <FormError message={error} />
      </div>
    </StudioDialog>
  );
}

function EditDialog({
  team,
  member,
  onClose,
  onSaved,
}: {
  team: TeamResponse;
  member: TeamMember;
  onClose: () => void;
  onSaved: () => void;
}) {
  const notify = useToast();
  const initialRole = (member.role === "OWNER" ? "MANAGER" : member.role) as AssignableRole;
  const [displayName, setDisplayName] = useState(member.displayName);
  const [jobTitle, setJobTitle] = useState(member.jobTitle ?? "");
  const [role, setRole] = useState<AssignableRole>(initialRole);
  const [permissions, setPermissions] = useState(member.permissions);
  const [status, setStatus] = useState<"ACTIVE" | "SUSPENDED" | null>(
    member.status === "ACTIVE" || member.status === "SUSPENDED" ? member.status : null,
  );
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [pending, setPending] = useState<"save" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setPending("save");
    setError(null);
    try {
      await studioRequest(`/api/v1/business/team/${member.id}`, "PATCH", {
        displayName: displayName.trim(),
        jobTitle: jobTitle.trim() || null,
        role,
        permissions: overridesFor(team, role, permissions),
        ...(status ? { status } : {}),
      });
      notify({ tone: "success", title: "Access updated" });
      onSaved();
      onClose();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(null);
    }
  };

  const remove = async () => {
    setPending("remove");
    setError(null);
    try {
      const result = await studioRequest<{ unassignedAppointments: number }>(`/api/v1/business/team/${member.id}`, "DELETE");
      notify({
        tone: "success",
        title: `${member.displayName} removed`,
        description:
          result.unassignedAppointments > 0
            ? `${result.unassignedAppointments} upcoming appointment(s) are now unassigned.`
            : "They no longer have access to your business.",
      });
      onSaved();
      onClose();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(null);
    }
  };

  return (
    <StudioDialog
      open
      onClose={onClose}
      title={`Manage ${member.displayName}`}
      description={member.email}
      size="lg"
      footer={
        confirmRemove ? (
          <>
            <span className="mr-auto text-sm font-semibold text-[var(--color-danger)]">Remove their access?</span>
            <Button variant="secondary" onClick={() => setConfirmRemove(false)}>
              Keep
            </Button>
            <Button variant="danger" loading={pending === "remove"} onClick={() => void remove()}>
              Remove
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" className="mr-auto !text-[var(--color-danger)]" onClick={() => setConfirmRemove(true)}>
              Remove from team
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button loading={pending === "save"} onClick={() => void save()}>
              Save
            </Button>
          </>
        )
      }
    >
      <div className="grid *:min-w-0 gap-4">
        <div className="grid *:min-w-0 gap-4 sm:grid-cols-2">
          <Input label="Name" value={displayName} maxLength={120} onChange={(event) => setDisplayName(event.target.value)} />
          <Input label="Job title" value={jobTitle} maxLength={80} onChange={(event) => setJobTitle(event.target.value)} />
        </div>
        <div className="grid *:min-w-0 gap-4 sm:grid-cols-2">
          <SelectField
            label="Role"
            value={role}
            onChange={(event) => {
              const next = event.target.value as AssignableRole;
              setRole(next);
              setPermissions(team.roleDefaults[next]);
            }}
            hint={ROLE_HELP[role]}
          >
            <option value="STAFF">Staff member</option>
            <option value="RECEPTIONIST">Receptionist</option>
            <option value="MANAGER">Manager</option>
          </SelectField>
          {status ? (
            <SelectField
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value as "ACTIVE" | "SUSPENDED")}
              hint={status === "SUSPENDED" ? "Suspended members cannot open the Studio." : undefined}
            >
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </SelectField>
          ) : (
            <p className="self-end text-sm text-[var(--color-text-muted)]">Invitation not accepted yet.</p>
          )}
        </div>
        <div className="grid *:min-w-0 gap-2">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Access</p>
          <PermissionMatrix modules={team.modules} value={permissions} onChange={setPermissions} />
        </div>
        <FormError message={error} />
      </div>
    </StudioDialog>
  );
}
