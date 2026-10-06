// Mirrors futureagi/simulate/utils/timed_transcript.py so the eval preview
// shows what `call.timed_transcript` resolves to at eval time. Keep the two
// in sync.

const formatOffset = (ms) => {
  const tenths = Math.floor(Math.max(0, Number(ms) || 0) / 100);
  const tenth = tenths % 10;
  const seconds = Math.floor(tenths / 10);
  const second = seconds % 60;
  const minutes = Math.floor(seconds / 60);
  const minute = minutes % 60;
  const hours = Math.floor(minutes / 60);
  const pad = (n) => String(n).padStart(2, "0");
  if (hours) return `${hours}:${pad(minute)}:${pad(second)}.${tenth}`;
  return `${pad(minute)}:${pad(second)}.${tenth}`;
};

// turns: [{ role, content, startMs, endMs }] in start order. An end at or
// before the start means the provider gave no end.
export function formatTimedTranscript(turns) {
  const lastEndByRole = {};
  return turns
    .map(({ role, content, startMs, endMs }) => {
      const start = Number(startMs) || 0;
      const end = Number(endMs) || 0;
      const hasEnd = end > start;
      const span = hasEnd
        ? `${formatOffset(start)}-${formatOffset(end)}`
        : formatOffset(start);
      let line = `[${span}] ${role}: ${content}`;

      let otherEnd = null;
      let otherRole = null;
      for (const [other, otherRoleEnd] of Object.entries(lastEndByRole)) {
        if (other === role) continue;
        if (otherEnd === null || otherRoleEnd > otherEnd) {
          otherEnd = otherRoleEnd;
          otherRole = other;
        }
      }
      if (otherEnd !== null && start < otherEnd) {
        // Integer half-up rounding, matching the backend formatter.
        const tenths = Math.floor((otherEnd - start + 50) / 100);
        line += ` (starts ${Math.floor(tenths / 10)}.${tenths % 10}s before ${otherRole} finished)`;
      }

      if (hasEnd) lastEndByRole[role] = Math.max(end, lastEndByRole[role] || 0);
      return line;
    })
    .join("\n");
}
