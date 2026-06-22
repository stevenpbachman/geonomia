// Registry of country backends. Each country = its own Datasette / HF Space.
// To add a new country, append an entry here and a matching dev proxy in vite.config.ts.

export const COUNTRIES = {
  BR: {
    label: "Brazil",
    host: "https://nickynicolson-geonomia-br.hf.space",
    db: "geonomia",
    devProxy: "/datasette-br",
  },
  MY: {
    label: "Malaysia",
    host: "https://nickynicolson-geonomia-my.hf.space",
    db: "geonomia",
    devProxy: "/datasette-my",
  },
} as const;

export type CountryCode = keyof typeof COUNTRIES;

export const DEFAULT_COUNTRY: CountryCode = "BR";

export function getDatasetteBase(country: CountryCode): string {
  const cfg = COUNTRIES[country];
  return import.meta.env.DEV ? cfg.devProxy : cfg.host;
}

export function getDatasetteDb(country: CountryCode): string {
  return COUNTRIES[country].db;
}
