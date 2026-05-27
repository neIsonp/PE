export type IslandLocation = {
  value: string;
  label: string;
  group: "Grupo Ocidental" | "Grupo Central" | "Grupo Oriental";
  latitude: number;
  longitude: number;
};

export type CacaEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string | null;
  createdById?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
