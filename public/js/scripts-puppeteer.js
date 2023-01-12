import flyInAndRotate from './fly-in-and-rotate.js';
import animatePath from './animate-path.js';
import { computeCameraPosition } from './util.js';
// import refs from './app.js';
// import { start } from 'repl';

const refs = {
  distance: document.getElementById('distance'),
  elevation: document.getElementById('elevation'),
  duration: document.getElementById('duration'),
  date: document.getElementById('date'),
  title: document.getElementById('title'),
  titleHeader: document.getElementsByClassName('general-text')[0],
  subtitle: document.getElementsByClassName('sub-text')[0],
  container: document.getElementById('container'),
  presentation: document.getElementById('presentation'),
  stylesheet: document.styleSheets[2].cssRules,
};

mapboxgl.accessToken =
  'pk.eyJ1Ijoic3JkaWZsIiwiYSI6ImNsYndjcmJhbjA0emYzcm81eGJuYWNtY2cifQ.XkMAGdbe4bSqdkKFoIeqzw';

let trackGeojson;

// // getting max heigth from coordinates
const getMaxHeigth = (coordinates) => {
  const ft = 3.2808;
  const heigths = coordinates.geometry.coordinates.map((i) => i[2]);
  return (Math.max(...heigths) * ft).toFixed();
};

// get time for traveling with speed 4,5km/h
const speed = 4.5;
const getTime = (pathDistance, speed) => {
  const hour = (pathDistance / speed).toString().split('.');
  return {
    hrs: hour[0],
    mins: (hour[1] * 60).toString().substring(0, 2),
  };
};

const initRefs = (options) => {
  console.log(`init refs ${JSON.stringify(options)}`);
  const altitudes = trackGeojson.geometry.coordinates.map((i) => i[2]);
  refs.elevation.textContent = `${getMaxHeigth(trackGeojson)}ft`;
  // get path distance all route
  const pathDistance = turf.lineDistance(trackGeojson).toFixed();
  refs.distance.textContent = `${pathDistance}km`;
  const time = getTime(pathDistance, speed);
  refs.duration.textContent = `${time.hrs}hrs ${time.mins}mins`;

  refs.titleHeader.textContent = options.title
    ? options.title
    : refs.titleHeader.textContent;
  refs.subtitle.textContent = options.subtitle
    ? options.subtitle
    : refs.subtitle.textContent;

  // get current time
  if (options.date) {
    refs.date.textContent = options.date;
  } else {
    const dateTime = new Date();
    const year = dateTime.getFullYear();
    const dayNumber = dateTime.getDate();
    const monthName = dateTime.toLocaleDateString('en-us', { month: 'long' });

    refs.date.textContent = `${dayNumber}th ${monthName} ${year}`;
  }

  new Chart(document.getElementById('line-chart'), {
    type: 'line',
    data: {
      labels: altitudes,
      datasets: [
        {
          data: altitudes,
          label: 'Altitude',
          borderColor: '#FFFFFF',
          fill: true,
          backgroundColor: 'rgba(217, 217, 217)',
          pointRadius: 0,
          tension: 0.4,
        },
      ],
    },
    options: {
      scales: {
        y: {
          display: false,
        },
        x: {
          display: false,
        },
      },
      plugins: {
        legend: false,
      },
    },
  });
};

const initMap = ({ data, options = {} }) => {
  console.log(`init map`);
  trackGeojson = data;

  initRefs(options);

  const map = new mapboxgl.Map({
    container: 'map',
    projection: 'globe',
    style: 'mapbox://styles/mapbox/satellite-v9',
    center: [
      trackGeojson.geometry.coordinates[0][0],
      trackGeojson.geometry.coordinates[0][1],
    ],
    zoom: 12,
    altitude: 12000,
    pitch: 0,
    bearing: 0,
    interactive: false,
    performanceMetricsCollection: false,
  });

  const marker = document.createElement('div');
  marker.className = 'marker';
  const markerRound = new mapboxgl.Marker(marker);

  window.map = map;

  map.on('load', async () => {
    window.dispatchEvent(new Event('mapLoaded'));
    // add round marker when map is render
    const roundMarker = trackGeojson.geometry.coordinates[0];

    markerRound.setLngLat(roundMarker);
    markerRound.addTo(map);

    var targetLngLat = {
      lng: trackGeojson.geometry.coordinates[0][0],
      lat: trackGeojson.geometry.coordinates[0][1],
    };

    var initialCameraPosition = computeCameraPosition(
      0,
      0,
      targetLngLat,
      12000,
    );

    // set the pitch and bearing of the camera
    const camera = map.getFreeCameraOptions();
    camera.setPitchBearing(0, 0);

    // set the position and altitude of the camera
    camera.position = mapboxgl.MercatorCoordinate.fromLngLat(
      initialCameraPosition,
      12000,
    );

    map.setFreeCameraOptions(camera);

    // animate title and logo
    const title = [...refs.stylesheet].find((r) => r.selectorText === '.title');
    const logo = [...refs.stylesheet].find((r) => r.selectorText === '.logo');

    title.style.setProperty('opacity', 1);
    title.style.setProperty('animation', 'fadeIn 1s ease-in');
    logo.style.setProperty('opacity', 1);
    logo.style.setProperty('animation', 'fadeIn 1s ease-in');

    // kick off the animations
    setTimeout(async () => {
      refs.title.setAttribute('class', 'is-hidden');
      await playAnimations(trackGeojson, markerRound);
    }, 4000);
  });
};

const startAnimation = () => {
  console.log('start animation');
};
document.addEventListener('init', async (e) => {
  let data = await e.detail;
  initMap(data);
});

document.addEventListener('animate', () => {
  startAnimation();
});

const playAnimations = async (trackGeojson, marker) => {
  return new Promise(async (resolve) => {
    // add a geojson source and layer for the linestring to the map
    addPathSourceAndLayer(trackGeojson);

    // get the start of the linestring, to be used for animating a zoom-in from high altitude
    var targetLngLat = {
      lng: trackGeojson.geometry.coordinates[0][0],
      lat: trackGeojson.geometry.coordinates[0][1],
    };

    // animate zooming in to the start point, get the final bearing and altitude for use in the next animation
    const { bearing, altitude } = await flyInAndRotate({
      map,
      targetLngLat,
      //5000 base
      duration: 15000,
      startAltitude: 12000,
      endAltitude: 7000,
      startBearing: 0,
      endBearing: 0,
      startPitch: 0,
      endPitch: 40,
    });

    // follow the path while slowly rotating the camera, passing in the camera bearing and altitude from the previous animation
    await animatePath({
      map,
      //20000 base
      duration: 60000,
      path: trackGeojson,
      startBearing: bearing,
      startAltitude: altitude,
      pitch: 40,
      marker,
    });

    // get the bounds of the linestring, use fitBounds() to animate to a final view
    const bounds = turf.bbox(trackGeojson);
    map.fitBounds(bounds, {
      //5000 base
      duration: 15000,
      pitch: 50,
      bearing: 170,
      padding: 50,
    });

    setTimeout(() => {
      refs.container.setAttribute('class', 'container');
      resolve();
    }, 5000);

    const elevationProfile = [...refs.stylesheet].find(
      (r) => r.selectorText === '.elevation-profile',
    );
    const elevation = [...refs.stylesheet].find(
      (r) => r.selectorText === '.elevation',
    );
    const duration = [...refs.stylesheet].find(
      (r) => r.selectorText === '.duration',
    );
    const distance = [...refs.stylesheet].find(
      (r) => r.selectorText === '.distance',
    );
    setTimeout(() => {
      elevationProfile.style.setProperty('transform', 'translateY(0%)');
      elevationProfile.style.setProperty('animation', 'popIn 1s ease-in');
    }, 5500);
    setTimeout(() => {
      distance.style.setProperty('transform', 'translateY(0%)');
      distance.style.setProperty('animation', 'popIn 1s ease-in');
    }, 6500);
    setTimeout(() => {
      elevation.style.setProperty('transform', 'translateY(0%)');
      elevation.style.setProperty('animation', 'popIn 1s ease-in');
    }, 7500);
    setTimeout(() => {
      duration.style.setProperty('transform', 'translateY(0%)');
      duration.style.setProperty('animation', 'popIn 1s ease-in');
    }, 8500);

    setTimeout(() => {
      refs.container.setAttribute('class', 'is-hidden');
      refs.presentation.setAttribute('class', 'presentation');
      const text = [...refs.stylesheet].find(
        (r) => r.selectorText === '.presentation-text',
      );
      const icons = [...refs.stylesheet].find(
        (r) => r.selectorText === '.icons',
      );
      const phone = [...refs.stylesheet].find(
        (r) => r.selectorText === '.phone',
      );

      text.style.setProperty('opacity', 1);
      text.style.setProperty('animation', 'fadeIn 1.5s ease-in');
      icons.style.setProperty('opacity', 1);
      icons.style.setProperty('animation', 'fadeIn 1.5s ease-in');
      phone.style.setProperty('transform', 'translateX(0%)');
      phone.style.setProperty('animation', 'rigthIn 1.3s ease-in');
      setTimeout(() => {
        window.dispatchEvent(new Event('animationFinished'));
      }, 3000);
    }, 17000);
  });
};

const addPathSourceAndLayer = (trackGeojson) => {
  // Add a line feature and layer. This feature will get updated as we progress the animation
  map.addSource('line', {
    type: 'geojson',
    // Line metrics is required to use the 'line-progress' property
    lineMetrics: true,
    data: trackGeojson,
  });
  map.addLayer({
    id: 'line-layer',
    type: 'line',
    source: 'line',
    paint: {
      'line-color': 'rgba(0,0,0,0)',
      'line-width': 11,
      'line-opacity': 0.9,
    },
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
  });

  map.loadImage('./images/startMarker.png', (error, image) => {
    if (error) throw error;
    if (!map.hasImage('start-marker'))
      map.addImage('start-marker', image, { pixelRatio: 3 });
  });

  map.addSource('start', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: trackGeojson.geometry.coordinates[0],
          },
        },
      ],
    },
  });
  map.addLayer({
    id: 'layer-with-start-marker',
    type: 'symbol',
    source: 'start',
    layout: {
      'icon-image': 'start-marker',
      'icon-anchor': 'bottom',
    },
  });

  map.loadImage('./images/finishMarker_2.png', (error, image) => {
    if (error) throw error;
    if (!map.hasImage('finish-marker'))
      map.addImage('finish-marker', image, { pixelRatio: 3 });
  });

  map.addSource('finish', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates:
              trackGeojson.geometry.coordinates[
                trackGeojson.geometry.coordinates.length - 1
              ],
          },
        },
      ],
    },
  });
  map.addLayer({
    id: 'layer-with-finish-marker',
    type: 'symbol',
    source: 'finish',
    layout: {
      'icon-image': 'finish-marker',
      'icon-anchor': 'bottom',
    },
  });
};

export default trackGeojson;
