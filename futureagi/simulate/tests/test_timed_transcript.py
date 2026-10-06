import pytest

from simulate.utils.timed_transcript import format_timed_transcript


@pytest.mark.unit
class TestFormatTimedTranscript:
    def test_clean_hand_off_has_no_overlap_note(self):
        assert format_timed_transcript(
            [("agent", "Hello", 0, 1000), ("customer", "Hi", 1000, 1800)]
        ) == ("[00:00.0-00:01.0] agent: Hello\n[00:01.0-00:01.8] customer: Hi")

    def test_overlap_is_measured_against_the_other_speaker(self):
        out = format_timed_transcript(
            [("agent", "Long answer", 0, 5000), ("customer", "Stop", 4250, 4800)]
        )
        assert out.endswith("customer: Stop (starts 0.8s before agent finished)")

    def test_half_tenths_round_up_like_the_frontend_mirror(self):
        out = format_timed_transcript(
            [("agent", "Answer", 0, 2000), ("customer", "But", 1750, 2400)]
        )
        assert out.endswith("(starts 0.3s before agent finished)")

    def test_same_speaker_continuation_is_not_an_overlap(self):
        out = format_timed_transcript(
            [("agent", "First part", 0, 3000), ("agent", "second part", 2500, 4000)]
        )
        assert "before" not in out

    def test_offsets_past_an_hour_include_hours(self):
        out = format_timed_transcript([("agent", "Still here", 3_725_400, 3_726_000)])
        assert out == "[1:02:05.4-1:02:06.0] agent: Still here"

    def test_no_turns_is_empty(self):
        assert format_timed_transcript([]) == ""
