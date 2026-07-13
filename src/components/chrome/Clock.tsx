"use client";

import { useEffect, useState } from "react";

// Header clock. Time = local device time HH:MM (24h), updated every 60s.
// "GMT+8 CN" is a hardcoded label (matches production). Temperature from /api/weather.
function localTime(): string {
  const d = new Date();
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function Clock() {
  const [time, setTime] = useState<string>("--:--");
  const [temp, setTemp] = useState<number | null>(null);

  useEffect(() => {
    setTime(localTime());
    const id = setInterval(() => setTime(localTime()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let alive = true;
    // QWeather, fetched client-side (as the original site did). The key shipped
    // publicly in the production bundle, so this exposes nothing new — and it keeps
    // the static GitHub Pages build (no server / API routes) working.
    const key = "c6e1eaf8bbac4c9f91b50e630e9ad750";
    fetch(`https://devapi.qweather.com/v7/weather/now?location=101020100&key=${key}`)
      .then((r) => r.json())
      .then((d) => {
        const t = d?.now?.temp;
        if (alive && t != null) setTemp(Math.round(Number(t)));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const tempStr = temp != null ? ` ${temp}°C` : "";

  return (
    <>
      <span className="lg:hidden p-2 uppercase transition-colors duration-300 ease-out motion-reduce:transition-none">
        <span>
          {time}
          {tempStr}
        </span>
      </span>
      <span className="hidden lg:inline p-2 uppercase">
        <span>
          GMT+8 CN {time}
          {tempStr}
        </span>
      </span>
    </>
  );
}
