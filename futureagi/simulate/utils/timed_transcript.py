"""Timed voice transcript for eval judges.

``call.transcript`` renders turns as ``role: text`` with no timing, so a judge
cannot tell a barge-in from a clean hand-off. This renders the same turns with
their start/end offsets and marks a turn that begins before the other speaker
has finished. It deliberately carries no call-context header: evals that need
the agent prompt map ``call.agent_prompt`` separately.
"""

from __future__ import annotations

from collections.abc import Iterable


def _format_offset(ms: int) -> str:
    """``mm:ss.s`` from call start, ``h:mm:ss.s`` past the hour."""
    tenths = max(0, int(ms)) // 100
    seconds, tenth = divmod(tenths, 10)
    minutes, second = divmod(seconds, 60)
    hours, minute = divmod(minutes, 60)
    if hours:
        return f"{hours}:{minute:02d}:{second:02d}.{tenth}"
    return f"{minute:02d}:{second:02d}.{tenth}"


def format_timed_transcript(turns: Iterable[tuple[str, str, int, int]]) -> str:
    """Render ``(role_label, content, start_ms, end_ms)`` turns, in start order.

    ``end_ms`` at or before ``start_ms`` means the provider gave no end (the
    column defaults to 0): the line shows the start only and that turn is not
    used as an overlap reference. Overlap is checked against the latest end of
    every other speaker, not just the previous line, so a backchannel inside a
    long turn is caught too.
    """
    lines = []
    last_end_by_role: dict[str, int] = {}
    for role, content, start_ms, end_ms in turns:
        has_end = end_ms > start_ms
        span = _format_offset(start_ms)
        if has_end:
            span = f"{span}-{_format_offset(end_ms)}"
        line = f"[{span}] {role}: {content}"

        other_ends = [
            (end, other) for other, end in last_end_by_role.items() if other != role
        ]
        if other_ends:
            other_end, other_role = max(other_ends)
            if start_ms < other_end:
                # Integer half-up rounding so the FE preview mirror matches.
                tenths = (other_end - start_ms + 50) // 100
                line += (
                    f" (starts {tenths // 10}.{tenths % 10}s"
                    f" before {other_role} finished)"
                )

        if has_end:
            last_end_by_role[role] = max(end_ms, last_end_by_role.get(role, 0))
        lines.append(line)
    return "\n".join(lines)
