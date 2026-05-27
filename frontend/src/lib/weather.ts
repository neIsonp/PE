import { islandLocations } from "@/data/events";

type OpenMeteoResponse = {
  hourly?: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
  };
};

const weatherLabels: Record<number, string> = {
  0: "céu limpo",
  1: "maioritariamente limpo",
  2: "parcialmente nublado",
  3: "nublado",
  45: "nevoeiro",
  48: "nevoeiro com gelo",
  51: "chuvisco ligeiro",
  53: "chuvisco moderado",
  55: "chuvisco intenso",
  61: "chuva ligeira",
  63: "chuva moderada",
  65: "chuva forte",
  80: "aguaceiros ligeiros",
  81: "aguaceiros moderados",
  82: "aguaceiros fortes",
  95: "trovoada"
};

export async function getForecast(locationValue: string, date: string, time: string) {
  const location = islandLocations.find((item) => item.value === locationValue);

  if (!location) {
    throw new Error("Localização inválida.");
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set("hourly", "temperature_2m,weather_code");
  url.searchParams.set("timezone", "Atlantic/Azores");
  url.searchParams.set("forecast_days", "16");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Não foi possível obter a previsão meteorológica.");
  }

  const data = (await response.json()) as OpenMeteoResponse;
  const target = `${date}T${time.slice(0, 2)}:00`;
  const index = data.hourly?.time.findIndex((entry) => entry === target) ?? -1;

  if (index < 0 || !data.hourly) {
    throw new Error("A previsão só está disponível para os próximos dias.");
  }

  const temperature = Math.round(data.hourly.temperature_2m[index]);
  const code = data.hourly.weather_code[index];

  return {
    temperature,
    label: weatherLabels[code] ?? "condições variáveis",
    locationLabel: location.label
  };
}
