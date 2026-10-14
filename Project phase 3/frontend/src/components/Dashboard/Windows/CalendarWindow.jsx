// A month of focus at a glance. Each day is shaded by how long you focused,
// and clicking a day shows the minutes, topics and mood for it.
import React, { useEffect, useMemo, useState } from "react";
import { getCalendar } from "../../../api/focus";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// One hue, darker to brighter as minutes go up (it sits on a dark surface).
const LEVELS = [
  { min: 1, label: "Under 25 min" },
  { min: 25, label: "25 to 59 min" },
  { min: 60, label: "1 to 2 hours" },
  { min: 120, label: "2 hours or more" },
];

function levelFor(minutes) {
  let level = 0;
  LEVELS.forEach((l, i) => {
    if (minutes >= l.min) level = i + 1;
  });
  return level;
}

function isoDay(date) {
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

function formatMinutes(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export default function CalendarWindow({ onClose }) {
  const [days, setDays] = useState(null);
  const [error, setError] = useState(null);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState(() => isoDay(new Date()));

  useEffect(() => {
    getCalendar()
      .then(setDays)
      .catch((e) => setError(e.message));
  }, []);

  const byDay = useMemo(() => {
    const map = {};
    (days || []).forEach((d) => {
      map[d.day] = d;
    });
    return map;
  }, [days]);

  const cells = useMemo(() => {
    const first = month.getDay();
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const list = Array.from({ length: first }, () => null);
    for (let d = 1; d <= count; d++) {
      list.push(new Date(month.getFullYear(), month.getMonth(), d));
    }
    return list;
  }, [month]);

  const monthDays = cells.filter(Boolean).map((d) => byDay[isoDay(d)]).filter(Boolean);
  const monthMinutes = monthDays.reduce((n, d) => n + d.total_focus_min, 0);
  const today = isoDay(new Date());
  const detail = byDay[selected];
  const monthName = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const shiftMonth = (delta) =>
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  return (
    <div className="den-window den-calendar" role="dialog" aria-labelledby="den-calendar-title">
      <div className="window-header">
        <span className="window-title" id="den-calendar-title">Focus calendar</span>
        <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
          ✖
        </button>
      </div>

      <div className="window-content">
        <div className="den-cal-nav">
          <button type="button" className="den-icon-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            ‹
          </button>
          <div className="den-cal-month">
            <strong>{monthName}</strong>
            <span className="den-muted">
              {monthDays.length
                ? `${formatMinutes(monthMinutes)} over ${monthDays.length} day${monthDays.length === 1 ? "" : "s"}`
                : "No focus sessions this month"}
            </span>
          </div>
          <button type="button" className="den-icon-btn" onClick={() => shiftMonth(1)} aria-label="Next month">
            ›
          </button>
        </div>

        {error && <p className="den-shop-message is-error">Couldn't load your calendar. {error}</p>}

        <div className="den-cal-grid" role="grid" aria-label={monthName}>
          {WEEKDAYS.map((w) => (
            <span key={w} className="den-cal-weekday" role="columnheader">
              {w}
            </span>
          ))}
          {cells.map((date, i) => {
            if (!date) return <span key={`blank-${i}`} aria-hidden="true" />;
            const key = isoDay(date);
            const info = byDay[key];
            const minutes = info?.total_focus_min || 0;
            return (
              <button
                type="button"
                key={key}
                role="gridcell"
                className={`den-cal-day level-${levelFor(minutes)} ${key === today ? "is-today" : ""} ${
                  key === selected ? "is-selected" : ""
                }`}
                onClick={() => setSelected(key)}
                title={minutes ? `${formatMinutes(minutes)} focused` : "No focus"}
                aria-label={`${date.toLocaleDateString(undefined, { month: "long", day: "numeric" })}, ${
                  minutes ? `${formatMinutes(minutes)} focused` : "no focus"
                }`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>

        <div className="den-cal-legend" aria-hidden="true">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <span key={l} className={`den-cal-swatch level-${l}`} title={l ? LEVELS[l - 1].label : "No focus"} />
          ))}
          <span>More</span>
        </div>

        <div className="den-cal-detail">
          <strong>
            {new Date(`${selected}T12:00:00`).toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </strong>
          {detail ? (
            <>
              <span>{formatMinutes(detail.total_focus_min)} focused</span>
              {detail.topics.length > 0 && <span className="den-muted">Topics: {detail.topics.join(", ")}</span>}
              {detail.mood !== "none" && <span className="den-muted">Mood: {detail.mood}</span>}
            </>
          ) : (
            <span className="den-muted">No focus sessions on this day.</span>
          )}
        </div>
      </div>
    </div>
  );
}
