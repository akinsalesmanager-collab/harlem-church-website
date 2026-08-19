// ---------- Event data ----------
// Recurring weekly services. weekday: 0=Sun ... 6=Sat
const RECURRING = [
  { title: "Sunday Bible Study", weekday: 0, time: "09:30", durationMin: 60,
    location: "Harlem Church of Christ", mapQuery: "Harlem Church of Christ, Harlem, NY",
    desc: "Classes for every age — digging into scripture together." },
  { title: "Sunday Worship", weekday: 0, time: "10:30", durationMin: 75,
    location: "Harlem Church of Christ", mapQuery: "Harlem Church of Christ, Harlem, NY",
    desc: "A cappella singing, the Lord's Supper, and the preached Word." },
  { title: "Wednesday Bible Study", weekday: 3, time: "19:00", durationMin: 60,
    location: "Harlem Church of Christ", mapQuery: "Harlem Church of Christ, Harlem, NY",
    desc: "Midweek fellowship and deeper study to carry you through the week." },
];

// One-off / special events — placeholders. Edit dates, titles, and locations as needed.
const SPECIAL = [
  // { title: "Gospel Meeting", date: "2026-09-13", time: "10:30", durationMin: 90,
  //   location: "Harlem Church of Christ", mapQuery: "Harlem Church of Christ, Harlem, NY",
  //   desc: "A weekend of special preaching and fellowship. All welcome." },
];

const WEEKS_AHEAD = 5; // how many weeks of recurring events to list

function pad(n) { return String(n).padStart(2, "0"); }

function nextOccurrences(item, weeksAhead) {
  const out = [];
  const now = new Date();
  const [h, m] = item.time.split(":").map(Number);
  for (let w = 0; w <= weeksAhead; w++) {
    const d = new Date(now);
    const diff = (item.weekday - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + diff + w * 7);
    d.setHours(h, m, 0, 0);
    if (d >= now || diff > 0 || w > 0) {
      if (d >= new Date(now.getTime() - 60 * 60 * 1000)) {
        out.push(buildEvent(item, d));
      }
    }
  }
  return out;
}

function buildEvent(item, startDate) {
  const end = new Date(startDate.getTime() + item.durationMin * 60000);
  return {
    title: item.title,
    start: startDate,
    end: end,
    location: item.location,
    mapQuery: item.mapQuery,
    desc: item.desc,
  };
}

function collectEvents() {
  let events = [];
  RECURRING.forEach(r => events = events.concat(nextOccurrences(r, WEEKS_AHEAD)));
  SPECIAL.forEach(s => {
    const [y, mo, da] = s.date.split("-").map(Number);
    const [h, mi] = s.time.split(":").map(Number);
    const start = new Date(y, mo - 1, da, h, mi);
    if (start >= new Date()) events.push(buildEvent(s, start));
  });
  events.sort((a, b) => a.start - b.start);
  return events;
}

// ---------- Formatting helpers ----------
function fmtICSDate(d) {
  return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "T" +
         pad(d.getHours()) + pad(d.getMinutes()) + "00";
}
function fmtGCalDate(d) {
  // Treated as UTC by Google's template endpoint when no timezone is given.
  return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "T" +
         pad(d.getHours()) + pad(d.getMinutes()) + "00Z";
}

function googleCalendarUrl(ev) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates: `${fmtGCalDate(ev.start)}/${fmtGCalDate(ev.end)}`,
    details: ev.desc,
    location: ev.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function downloadICS(ev) {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Harlem Church of Christ//Calendar//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@theharlemchurchofchrist.com`,
    `DTSTAMP:${fmtICSDate(new Date())}Z`,
    `DTSTART:${fmtICSDate(ev.start)}`,
    `DTEND:${fmtICSDate(ev.end)}`,
    `SUMMARY:${ev.title}`,
    `DESCRIPTION:${ev.desc}`,
    `LOCATION:${ev.location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ev.title.replace(/\s+/g, "-")}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function googleMapsUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
function appleMapsUrl(query) {
  return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
}

// ---------- Render ----------
const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function timeLabel(d) {
  let h = d.getHours(), m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${pad(m)} ${ampm}`;
}

function renderEvents() {
  const list = document.getElementById("event-list");
  if (!list) return;
  const events = collectEvents();

  if (!events.length) {
    list.innerHTML = '<p class="center small">No upcoming events posted right now — check back soon.</p>';
    return;
  }

  list.innerHTML = events.map((ev, i) => `
    <div class="event-card reveal" style="transition-delay:${Math.min(i,6)*40}ms">
      <div class="event-date">
        <div class="month">${MONTHS[ev.start.getMonth()]}</div>
        <div class="day">${ev.start.getDate()}</div>
        <div class="weekday">${WEEKDAYS[ev.start.getDay()]}</div>
      </div>
      <div class="event-body">
        <h3>${ev.title}</h3>
        <div class="event-meta">
          <span>🕘 ${timeLabel(ev.start)} – ${timeLabel(ev.end)}</span>
          <span>📍 ${ev.location}</span>
        </div>
        <p>${ev.desc}</p>
        <div class="event-actions">
          <a href="${googleCalendarUrl(ev)}" target="_blank" rel="noopener">+ Google Calendar</a>
          <button type="button" data-ics="${i}">+ Apple / Outlook (.ics)</button>
          <a href="${googleMapsUrl(ev.mapQuery)}" target="_blank" rel="noopener">Google Maps</a>
          <a href="${appleMapsUrl(ev.mapQuery)}" target="_blank" rel="noopener">Apple Maps</a>
        </div>
      </div>
    </div>
  `).join("");

  list.querySelectorAll("button[data-ics]").forEach(btn => {
    btn.addEventListener("click", () => downloadICS(events[Number(btn.dataset.ics)]));
  });

  // Re-run reveal observer on newly injected cards
  const items = list.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.1 });
    items.forEach(i => io.observe(i));
  } else {
    items.forEach(i => i.classList.add("in"));
  }
}

document.addEventListener("DOMContentLoaded", renderEvents);
