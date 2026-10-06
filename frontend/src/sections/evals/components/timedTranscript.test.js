import { describe, it, expect } from "vitest";

import { formatTimedTranscript } from "./timedTranscript";

// Same cases as futureagi/simulate/tests/test_timed_transcript.py, so the
// eval preview and the backend resolver render identically.

const turn = (role, content, startMs, endMs) => ({
  role,
  content,
  startMs,
  endMs,
});

describe("formatTimedTranscript", () => {
  it("renders a clean hand-off with no overlap note", () => {
    expect(
      formatTimedTranscript([
        turn("agent", "Hello", 0, 1000),
        turn("customer", "Hi", 1000, 1800),
      ]),
    ).toBe("[00:00.0-00:01.0] agent: Hello\n[00:01.0-00:01.8] customer: Hi");
  });

  it("marks a turn that starts before the other speaker finished", () => {
    expect(
      formatTimedTranscript([
        turn("agent", "Long answer", 0, 5000),
        turn("customer", "Stop", 4250, 4800),
      ]),
    ).toMatch(/customer: Stop \(starts 0\.8s before agent finished\)$/);
  });

  it("rounds half tenths up, matching the backend", () => {
    expect(
      formatTimedTranscript([
        turn("agent", "Answer", 0, 2000),
        turn("customer", "But", 1750, 2400),
      ]),
    ).toMatch(/\(starts 0\.3s before agent finished\)$/);
  });

  it("does not treat a same-speaker continuation as an overlap", () => {
    expect(
      formatTimedTranscript([
        turn("agent", "First part", 0, 3000),
        turn("agent", "second part", 2500, 4000),
      ]),
    ).not.toMatch(/before/);
  });

  it("shows only the start when the end is unknown", () => {
    expect(
      formatTimedTranscript([
        turn("agent", "Hello", 0, 0),
        turn("customer", "Hi there", 1500, 2600),
        turn("agent", "Welcome back", 2000, 0),
      ]),
    ).toBe(
      "[00:00.0] agent: Hello\n" +
        "[00:01.5-00:02.6] customer: Hi there\n" +
        "[00:02.0] agent: Welcome back (starts 0.6s before customer finished)",
    );
  });

  it("includes hours past the hour mark", () => {
    expect(
      formatTimedTranscript([turn("agent", "Still here", 3725400, 3726000)]),
    ).toBe("[1:02:05.4-1:02:06.0] agent: Still here");
  });
});
