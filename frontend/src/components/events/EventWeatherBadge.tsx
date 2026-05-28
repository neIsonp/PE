"use client";

import { useEffect, useState } from "react";
import { getForecast } from "@/lib/weather";
import type { CacaEvent } from "@/types/events";

type EventWeatherBadgeProps = {
  event: CacaEvent;
};

type WeatherState =
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function EventWeatherBadge({ event }: EventWeatherBadgeProps) {
  const [weather, setWeather] = useState<WeatherState>({ status: "loading" });

  useEffect(() => {
    let mounted = true;
    
    async function fetchWeather() {
      try {
        const forecast = await getForecast({
          date: event.date,
          time: event.time,
          venue: event.venue,
          latitude: event.latitude,
          longitude: event.longitude
        });

        if (mounted) {
          setWeather({
            status: "success",
            message: `${forecast.temperature}°C · ${forecast.label}`
          });
        }
      } catch (error) {
        if (mounted) {
          setWeather({
            status: "error",
            message: error instanceof Error ? error.message : "Previsão indisponível."
          });
        }
      }
    }

    void fetchWeather();

    return () => {
      mounted = false;
    };
  }, [event.date, event.time, event.venue, event.latitude, event.longitude]);

  return (
    <div className="event-weather" style={{ marginTop: "8px" }}>
      {weather.status === "loading" ? (
        <span className="event-weather__result" style={{ color: "var(--cinza-500)", fontSize: "0.85rem" }}>A consultar clima...</span>
      ) : (
        <span className={`event-weather__result event-weather__result--${weather.status}`} role="status">
          {weather.message}
        </span>
      )}
    </div>
  );
}

