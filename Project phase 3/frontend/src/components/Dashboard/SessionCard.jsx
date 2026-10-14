// The running session, pinned near the top of the room while a timer runs.
// Countdown sessions show how much of the session is done; flowtime counts up.

function formatSeconds(total) {
  const s = Math.max(0, Math.floor(total));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`;
}

export default function SessionCard({
  timerMode,
  isBreak,
  timeLeft,
  totalSeconds,
  flowSeconds,
  breakSecondsLeft,
  breakTotalSeconds,
  onStopFlowtime,
  onGiveUp,
}) {
  const isFlow = timerMode === "flowtime" && !isBreak;
  const seconds = isBreak ? breakSecondsLeft : isFlow ? flowSeconds : timeLeft;

  let percent = null;
  if (isBreak && breakTotalSeconds > 0) {
    percent = 100 - (breakSecondsLeft / breakTotalSeconds) * 100;
  } else if (!isFlow && totalSeconds > 0) {
    percent = 100 - (timeLeft / totalSeconds) * 100;
  }

  const label = isBreak ? "Break" : isFlow ? "Flowtime" : "Focus session";
  const hint = isBreak
    ? "Stretch, drink some water, rest your eyes."
    : isFlow
    ? "Stop whenever you're ready. 30 minutes or more earns rewards."
    : "Rewards land when the timer reaches zero.";

  return (
    <section className={`den-session ${isBreak ? "is-break" : ""}`} aria-live="polite">
      <div className="den-session-top">
        <span className="den-session-label">{label}</span>
        <div className="den-session-actions">
          {isFlow && (
            <button type="button" className="den-session-stop" onClick={onStopFlowtime}>
              Finish session
            </button>
          )}
          {!isBreak && (
            <button type="button" className="den-session-giveup" onClick={onGiveUp}>
              Give up
            </button>
          )}
        </div>
      </div>

      <div className="den-session-time">{formatSeconds(seconds)}</div>

      {percent !== null && (
        <div className="den-session-track" aria-hidden="true">
          <div className="den-session-fill" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
        </div>
      )}
      <p className="den-session-hint">{hint}</p>
    </section>
  );
}
