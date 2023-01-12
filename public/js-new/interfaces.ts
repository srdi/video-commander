import { Feature, LineString } from 'geojson';

export interface Config {
  geo: Feature<LineString>;

  title: string;

  subtitle: string;

  date: string;

  style?: string;

  token: string;

  filename?: string;

  development?: boolean;
}
