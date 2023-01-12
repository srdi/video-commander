import { Position } from 'geojson';

// given a bearing, pitch, altitude, and a targetPosition on the ground to look at,
// calculate the camera's targetPosition as lngLat
let previousCameraPosition;

export const $ = (selector: string) => document.querySelector(selector);

export const $$ = (selector: string) => document.querySelectorAll(selector);

export const toRadian = (value: number) => value / 57.29;
export const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

export const computeCameraPosition = (
  pitch: number,
  bearing: number,
  targetPosition: Position,
  altitude: number,
  smooth = false,
) => {
  const bearingInRadian = toRadian(bearing);
  const pitchInRadian = toRadian(90 - pitch);

  const lngDiff =
    ((altitude / Math.tan(pitchInRadian)) * Math.sin(-bearingInRadian)) / 70000; // ~70km/degree longitude
  const latDiff =
    ((altitude / Math.tan(pitchInRadian)) * Math.cos(-bearingInRadian)) /
    110000; // 110km/degree latitude

  const correctedLng = targetPosition[0] + lngDiff;
  const correctedLat = targetPosition[1] - latDiff;

  const newCameraPosition = {
    lng: correctedLng,
    lat: correctedLat,
  };

  if (smooth) {
    if (previousCameraPosition) {
      const SMOOTH_FACTOR = 0.95;
      newCameraPosition.lng = lerp(
        newCameraPosition.lng,
        previousCameraPosition.lng,
        SMOOTH_FACTOR,
      );
      newCameraPosition.lat = lerp(
        newCameraPosition.lat,
        previousCameraPosition.lat,
        SMOOTH_FACTOR,
      );
    }
  }

  previousCameraPosition = newCameraPosition;

  return newCameraPosition;
};

export const toFt = (value) => 3.2808 * value;

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
