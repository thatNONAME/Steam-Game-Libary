const ROLE_STYLES = {
  Creator: "bg-purple-900/40 text-purple-300 border-purple-700/50",
  Admin: "bg-red-900/40 text-red-300 border-red-700/50",
  Moderator: "bg-yellow-900/40 text-yellow-300 border-yellow-700/50",
  Tester: "bg-green-900/40 text-green-300 border-green-700/50",
};

const ROLE_DOT_COLORS = {
  Creator: "bg-purple-400",
  Admin: "bg-red-400",
  Moderator: "bg-yellow-400",
  Tester: "bg-green-400",
};

export default function RoleBadge({ role, size = "sm" }) {
  const style = ROLE_STYLES[role];
  const dotColor = ROLE_DOT_COLORS[role];
  if (!style) return null;

  return (
    <span
      data-testid={`role-badge-${role.toLowerCase()}`}
      className={`inline-flex items-center gap-1.5 border rounded-full font-medium ${style} ${
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {role}
    </span>
  );
}

export function RoleBadges({ roles = [], size = "sm" }) {
  if (!roles || roles.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1" data-testid="role-badges">
      {roles.map((r) => <RoleBadge key={r} role={r} size={size} />)}
    </div>
  );
}
