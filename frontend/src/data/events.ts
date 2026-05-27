import type { CacaEvent, IslandLocation } from "@/types/events";

export const islandLocations: IslandLocation[] = [
  {
    value: "Flores,PT",
    label: "Ilha das Flores",
    group: "Grupo Ocidental",
    latitude: 39.4539,
    longitude: -31.1274
  },
  {
    value: "Corvo,PT",
    label: "Ilha do Corvo",
    group: "Grupo Ocidental",
    latitude: 39.671,
    longitude: -31.112
  },
  {
    value: "Faial,PT",
    label: "Ilha do Faial",
    group: "Grupo Central",
    latitude: 38.5789,
    longitude: -28.6946
  },
  {
    value: "Pico,PT",
    label: "Ilha do Pico",
    group: "Grupo Central",
    latitude: 38.4612,
    longitude: -28.3267
  },
  {
    value: "Sao Jorge,PT",
    label: "Ilha de São Jorge",
    group: "Grupo Central",
    latitude: 38.6472,
    longitude: -28.0167
  },
  {
    value: "Terceira,PT",
    label: "Ilha Terceira",
    group: "Grupo Central",
    latitude: 38.7173,
    longitude: -27.2075
  },
  {
    value: "Graciosa,PT",
    label: "Ilha da Graciosa",
    group: "Grupo Central",
    latitude: 39.0526,
    longitude: -27.9947
  },
  {
    value: "Ponta Delgada,PT",
    label: "Ilha de São Miguel",
    group: "Grupo Oriental",
    latitude: 37.7412,
    longitude: -25.6756
  },
  {
    value: "Santa Maria,PT",
    label: "Ilha de Santa Maria",
    group: "Grupo Oriental",
    latitude: 36.9748,
    longitude: -25.0934
  }
];

export const seedEvents: CacaEvent[] = [
  {
    id: "seed-1",
    title: "Encontro CACA de Saúde Digital",
    date: "2026-06-12",
    time: "10:00",
    location: "Ponta Delgada,PT",
    description: "Sessão de partilha sobre plataformas digitais e cuidados de proximidade."
  },
  {
    id: "seed-2",
    title: "Workshop de Investigação Clínica",
    date: "2026-07-03",
    time: "14:30",
    location: "Terceira,PT",
    description: "Oficina prática para estudantes e profissionais de saúde."
  }
];

export const locationGroups = ["Grupo Ocidental", "Grupo Central", "Grupo Oriental"] as const;
