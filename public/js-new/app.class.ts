import * as d3 from 'd3';
import * as turf from '@turf/turf';
import * as mapboxgl from 'mapbox-gl';
import { Config } from './interfaces';
import { computeCameraPosition, sleep } from './util';
// import { Decorations } from './decorations.class';
import {
  ALTITUDE_FACTOR,
  FLY_IN_DURATION,
  SPEED_FACTOR,
  INTRO_TEXTS,
  INTRO_DURATION,
  FRAMERATE,
  STATISTICS,
  PRESENTATION,
} from './constants';
import { GeoJSONSource } from 'mapbox-gl';
import { $, toFt } from './util';
import Chart from 'chart.js/auto';

type BoxTypes = 'elevationProfile' | 'distance' | 'elevation' | 'duration';

export class App {
  private config: Config;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private map: mapboxgl.Map;
  private marker: mapboxgl.Marker;
  // private decorations: Decorations;
  private altitude: number;
  private distance: number;
  private bearing: number;
  private pitch: number;
  private chart;
  constructor(config: Config) {
    this.config = config;
    this.altitude =
      Math.max(...config.geo.geometry.coordinates.map((point) => point[2])) *
      ALTITUDE_FACTOR;
    this.pitch = 0;
    this.bearing = 0;
    this.distance = turf.lineDistance(this.config.geo);

    // this.decorations = new Decorations(config);
  }

  public init(): void {
    this.initCanvas();
    // this.getChart();
    this.initMap();
  }

  private initCanvas(): void {
    this.canvas = $('canvas') as HTMLCanvasElement;
    this.context = this.canvas.getContext('2d');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    console.log(`window ${window.innerWidth} ${window.innerHeight}`);
    console.log(`this.canvas ${this.canvas.width} ${this.canvas.height}`);
    this.context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    // this.drawIntroTexts(1);
  }

  private initMap(): void {
    const initialPosition: [number, number] = [
      this.config.geo.geometry.coordinates[0][0],
      this.config.geo.geometry.coordinates[0][1],
    ];
    console.log('-> initialPosition', initialPosition);

    this.map = new mapboxgl.Map({
      container: 'map',
      accessToken: this.config.token,
      // projection: 'globe',
      style: this.config.style || 'mapbox://styles/mapbox/satellite-v9',
      center: initialPosition,
      zoom: 12,
      pitch: this.pitch,
      bearing: this.bearing,
      interactive: false,
      preserveDrawingBuffer: true,
    });

    this.map.on('load', async () => {
      console.log('-> map loaded');
      window.dispatchEvent(new Event('mapLoaded'));

      this.setCameraPosition(0, 0, this.altitude, initialPosition);

      // await sleep(2000);

      // this.decorations.showSlide1();

      // await sleep(3000);

      // this.decorations.hideSlide1();
      //Wait for fonts to load
      // this.addLogo();
      // this.addTitle();
      // await this.prewarmFont();
      // this.drawStatistics();

      // await this.addEmptyFrames(INTRO_DURATION / 2);
      // await this.animateIntroTexts();

      this.initMarker();
      this.initLogo();

      await sleep(1000);

      this.initStartMarker();
      this.initFinishMarker();
      this.initLine();

      await this.flyInAndRotate(40);
      console.log('Rotated');
      // await this.animatePresentation();
      // await this.addEmptyFrames(2000);
      await this.animatePath();
      // await this.animateStatistics();
      //
      this.zoomOut();
      //
      // await sleep(1000);
      //
      // await this.decorations.showSlide2();
      //
      // await sleep(8000);
      //
      // this.decorations.showSlide3();
      //
      // await sleep(3000);
      //
      window.dispatchEvent(new Event('animationFinished'));
    });
  }

  private async waitOrDownloadFrame() {
    if (this.config.development) {
      await sleep(1000 / FRAMERATE);
    } else {
      await this.downloadFrame();
    }
  }

  private async downloadFrame() {
    const canvas: HTMLCanvasElement = $('canvas') as HTMLCanvasElement;
    const mapCanvas = this.map.getCanvas();

    const mergeCanvas = document.createElement('canvas');
    mergeCanvas.width = mapCanvas.width;
    mergeCanvas.height = mapCanvas.height;

    const mergeCtx = mergeCanvas.getContext('2d');
    // const canvasDataURL = canvas.toDataURL();

    // const mapDataURL = mapCanvas.toDataURL();

    mergeCtx.drawImage(mapCanvas, 0, 0);
    mergeCtx.drawImage(canvas, 0, 0);
    const dataURL = mergeCanvas.toDataURL();
    // console.log(`Merge data ${dataURL}`);
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `frame_${Date.now()}`;
    link.click();

    await sleep(100);
  }

  private initLogo() {
    const img = $('#mainLogo') as HTMLImageElement;
    this.context.drawImage(
      img,
      window.innerWidth - img.width - 62,
      window.innerHeight - img.height - 72,
      447,
      144,
    );
  }

  private async prewarmFont(): Promise<void> {
    console.log('prewarm font');
    return new Promise(async (resolve) => {
      const frames = 10;
      let currentFrame = 0;

      // the animation frame will run as many times as necessary until the duration has been reached
      while (currentFrame < frames) {
        currentFrame++;
        this.drawIntroTexts(Math.random());
        await sleep(1000 / FRAMERATE);
      }
      this.drawIntroTexts(1);
      resolve();
    });
  }

  private async addEmptyFrames(ms: number): Promise<void> {
    console.log('startRecording');
    return new Promise(async (resolve) => {
      const frames = (ms / 1000) * FRAMERATE;
      let currentFrame = 0;

      // the animation frame will run as many times as necessary until the duration has been reached
      while (currentFrame < frames) {
        currentFrame++;
        // await sleep(16);
        await this.waitOrDownloadFrame();
      }
      resolve();
    });
  }

  private drawIntroTexts(opacity: number): void {
    this.context.clearRect(0, 0, window.innerWidth * 0.6, window.innerHeight);
    //Somehow needs reset
    // this.canvas.width = window.innerWidth;
    // this.canvas.height = window.innerHeight;

    this.context.font = '400 124px More Sugar';
    this.context.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    this.context.fillText(
      this.config.title,
      INTRO_TEXTS.title.left,
      INTRO_TEXTS.title.top,
    );
    this.context.font = '400 60px More Sugar';
    this.context.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    this.context.fillText(
      this.config.subtitle,
      INTRO_TEXTS.subtitle.left,
      INTRO_TEXTS.subtitle.top,
    );

    this.context.strokeStyle = `rgba(112, 195, 129, ${opacity})`;
    this.context.fillStyle = `rgba(112, 195, 129, ${opacity})`;
    this.context.beginPath();
    this.context.roundRect(
      INTRO_TEXTS.dateBox.left,
      INTRO_TEXTS.dateBox.top,
      INTRO_TEXTS.dateBox.width,
      INTRO_TEXTS.dateBox.height,
      INTRO_TEXTS.dateBox.radius,
    );
    this.context.stroke();
    this.context.fill();
    this.context.font = '900 40px Lato';
    this.context.fillStyle = `rgba(27, 27, 27, ${opacity})`;
    this.context.textAlign = 'center';
    this.context.textBaseline = 'middle';
    this.context.fillText(
      this.config.date,
      INTRO_TEXTS.dateBox.left + INTRO_TEXTS.dateBox.width / 2,
      INTRO_TEXTS.dateBox.top + INTRO_TEXTS.dateBox.height / 2,
    );
    this.context.textAlign = 'left';
  }

  private async animateStatistics(): Promise<void> {
    console.log('animate statistics');
    const targetTop = STATISTICS.box.baseTop;
    const frames = Math.ceil((STATISTICS.animationDuration / 1000) * FRAMERATE);
    let currentFrame = 0;
    const types = ['elevationProfile', 'distance', 'elevation', 'duration'];

    return new Promise(async (resolve) => {
      console.log('in promise');
      let type = types.shift() as BoxTypes;
      const startTop = -STATISTICS.box.height * 1.1;
      let top;
      console.log(`${types.length} ${currentFrame} ${frames}`);
      while (types.length && currentFrame < frames) {
        console.log(`animation step ${currentFrame} ${type}`);
        const animationPhase = currentFrame++ / frames;

        top =
          startTop + (targetTop - startTop) * d3.easeCubicOut(animationPhase);

        this.drawBox(type, top);
        this.drawBoxContent(type, top);

        await this.waitOrDownloadFrame();

        if (currentFrame >= frames) {
          currentFrame = 0;
          type = types.shift() as BoxTypes;
          console.log(`reset frames current type ${type}`);
        }

        // repeat!
      }
      resolve();
    });
  }

  private drawStatistics() {
    this.context.clearRect(0, 0, window.innerWidth, window.innerHeight / 2);
    const types = ['elevationProfile', 'distance', 'elevation', 'duration'];
    types.forEach((type: BoxTypes) => {
      this.drawBox(type, STATISTICS.box.baseTop);
      this.drawBoxContent(type, STATISTICS.box.baseTop);
    });
  }

  private drawBox(type: BoxTypes, top: number) {
    console.log('drawBox', type, top);
    this.context.clearRect(
      STATISTICS[type].left,
      0,
      STATISTICS.box.width,
      window.innerHeight / 2,
    );
    this.context.strokeStyle = STATISTICS.box.backgroundColor;
    this.context.fillStyle = STATISTICS.box.backgroundColor;
    this.context.beginPath();
    this.context.roundRect(
      STATISTICS[type].left,
      top,
      STATISTICS.box.width,
      STATISTICS.box.height,
      STATISTICS.box.radius,
    );
    this.context.stroke();
    this.context.fill();
  }

  private drawBoxContent(type: BoxTypes, top: number) {
    console.log('drawBoxContent', type, top);
    switch (type) {
      case 'elevationProfile': {
        this.drawElevationProfile(top);
        break;
      }
      case 'distance': {
        this.drawDistance(top);
        break;
      }
      case 'elevation': {
        this.drawElevation(top);
        break;
      }
      case 'duration': {
        this.drawDuration(top);
      }
    }
  }

  private drawElevationProfile(top: number) {
    console.log('drawElevationProfile', top);
    this.context.drawImage(
      this.chart,
      STATISTICS.elevationProfile.left,
      top + STATISTICS.box.height / 2,
      STATISTICS.chart.width,
      STATISTICS.chart.height,
    );
    this.context.font = '31px Lato';
    this.context.fillStyle = STATISTICS.property.color;
    this.context.fillText(
      'Elevation profile',
      STATISTICS.elevationProfile.left + STATISTICS.property.left,
      top + STATISTICS.property.top,
    );
  }

  private drawDistance(top: number) {
    console.log('drawDistance', top);
    this.context.font = '31px Lato';
    this.context.fillStyle = STATISTICS.property.color;
    this.context.fillText(
      'Distance',
      STATISTICS.distance.left + STATISTICS.property.left,
      top + STATISTICS.property.top,
    );
    this.context.font = '55px Lato';
    this.context.fillStyle = STATISTICS.value.color;
    this.context.fillText(
      `${this.distance.toFixed()}km`,
      STATISTICS.distance.left + STATISTICS.value.left,
      top + STATISTICS.box.height - STATISTICS.value.bottom,
    );
  }

  private drawElevation(top: number) {
    console.log('drawElevation', top);
    this.context.font = '31px Lato';
    this.context.fillStyle = STATISTICS.property.color;
    this.context.fillText(
      'Elevation',
      STATISTICS.elevation.left + STATISTICS.property.left,
      top + STATISTICS.property.top,
    );
    this.context.font = '55px Lato';
    this.context.fillStyle = STATISTICS.value.color;
    this.context.fillText(
      `${toFt(this.altitude).toFixed()}ft`,
      STATISTICS.elevation.left + STATISTICS.value.left,
      top + STATISTICS.box.height - STATISTICS.value.bottom,
    );
  }

  private drawDuration(top: number) {
    console.log('drawDuration', top);
    this.context.font = '31px Lato';
    this.context.fillStyle = STATISTICS.property.color;
    this.context.fillText(
      'Duration',
      STATISTICS.duration.left + STATISTICS.property.left,
      top + STATISTICS.property.top,
    );
  }

  private getChart() {
    const chartCanvas = $('#line-chart') as HTMLCanvasElement;
    const altitudes = this.config.geo.geometry.coordinates.map(
      (point) => point[2],
    );
    new Chart(chartCanvas, {
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
        animation: {
          onComplete: (e) => {
            const chartImg = document.createElement('img');
            chartImg.src = e.chart.toBase64Image();
            this.chart = chartImg;
          },
        },
        scales: {
          y: {
            display: false,
          },
          x: {
            display: false,
          },
        },
        plugins: {
          legend: { display: false },
        },
      },
    });
  }

  private async animateIntroTexts(): Promise<void> {
    console.log('animateIntroTexts');
    return new Promise(async (resolve) => {
      let opacity = 1;

      const frames = (INTRO_TEXTS.duration / 1000) * FRAMERATE;
      let currentFrame = 0;
      const step = 1 / frames;

      // the animation frame will run as many times as necessary until the duration has been reached
      while (currentFrame < frames) {
        // const animationPhase = currentFrame++ / frames;
        currentFrame++;
        opacity -= step;
        this.drawIntroTexts(opacity);

        await this.waitOrDownloadFrame();
      }
      resolve();
    });
  }

  private async animatePresentation(): Promise<void> {
    console.log('animatePresentation');
    const targetLeft =
      window.innerWidth - PRESENTATION.phone.width - PRESENTATION.phone.right;
    const startLeft = window.innerWidth + STATISTICS.box.width * 1.1;

    return new Promise(async (resolve) => {
      const frames = Math.ceil(PRESENTATION.duration / 1000) * FRAMERATE;
      let currentFrame = 0;
      const step = 1 / frames;
      let opacity = 0;
      let left;
      while (currentFrame < frames) {
        const animationPhase = currentFrame++ / frames;

        opacity += step;
        left =
          startLeft +
          (targetLeft - startLeft) * d3.easeCubicOut(animationPhase);

        this.drawPresentation(opacity);
        this.drawPhone(left);

        await this.waitOrDownloadFrame();
      }

      resolve();
    });
  }

  private drawPresentation(opacity: number) {
    this.context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    this.context.fillStyle = 'rgb(27, 27, 27)';
    this.context.fillRect(0, 0, window.innerWidth, window.innerHeight);
    this.context.globalAlpha = opacity;
    const logo = $('.logo-footer') as HTMLImageElement;
    this.context.drawImage(
      logo,
      PRESENTATION.logoHeader.left,
      PRESENTATION.logoHeader.top,
      PRESENTATION.logoHeader.width,
      PRESENTATION.logoHeader.height,
    );

    const text = $('#presentationText') as HTMLImageElement;
    this.context.drawImage(
      text,
      PRESENTATION.text.left,
      PRESENTATION.text.top,
      PRESENTATION.text.width,
      PRESENTATION.text.height,
    );

    const google = $('.google') as HTMLImageElement;
    this.context.drawImage(
      google,
      PRESENTATION.google.left,
      PRESENTATION.google.top,
      PRESENTATION.google.width,
      PRESENTATION.google.height,
    );

    const ios = $('.ios') as HTMLImageElement;
    this.context.drawImage(
      ios,
      PRESENTATION.ios.left,
      PRESENTATION.ios.top,
      PRESENTATION.ios.width,
      PRESENTATION.ios.height,
    );
    this.context.globalAlpha = 1;
  }

  private drawPhone(left: number) {
    const phone = $('.phone') as HTMLImageElement;
    this.context.drawImage(
      phone,
      left,
      window.innerHeight -
        PRESENTATION.phone.height -
        PRESENTATION.phone.bottom,
      PRESENTATION.phone.width,
      PRESENTATION.phone.height,
    );
  }

  private initMarker(): void {
    const $marker = document.createElement('div');
    $marker.className = 'marker';

    this.marker = new mapboxgl.Marker($marker);

    this.marker.setLngLat([
      this.config.geo.geometry.coordinates[0][0],
      this.config.geo.geometry.coordinates[0][1],
    ]);

    this.marker.addTo(this.map);
  }

  private async initStartMarker() {
    this.map.loadImage('./images/startMarker.png', (error, image) => {
      if (error) throw error;
      if (!this.map.hasImage('start-marker'))
        this.map.addImage('start-marker', image, { pixelRatio: 3 });

      this.map.addSource('start-marker', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: [
                  this.map.getCenter().lng,
                  this.map.getCenter().lat,
                ],
              },
            },
          ],
        },
      });

      this.map.addLayer({
        id: 'layer-with-start-marker',
        type: 'symbol',
        source: 'start-marker',
        // paint: {
        //   'icon-translate': [0, -pixels.y.toFixed()],
        //   'icon-translate-transition': {
        //     duration: 1200,
        //   },
        // },
        layout: {
          'icon-image': 'start-marker',
          'icon-anchor': 'bottom',
          'icon-allow-overlap': true,
        },
      });

      // setTimeout(() => {
      //   this.map.setPaintProperty(
      //     'layer-with-start-marker',
      //     'icon-translate',
      //     [0, 0],
      //   );
      // }, 1000);
    });
  }

  private addTitle(): void {
    this.map.addSource('title', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: this.config.geo.geometry.coordinates[15],
            },
          },
        ],
      },
    });

    this.map.addLayer({
      id: 'layer-with-title',
      type: 'symbol',
      source: 'title',
      // paint: {
      //   'icon-translate': [0, -pixels.y.toFixed()],
      //   'icon-translate-transition': {
      //     duration: 2400,
      //   },
      // },
      layout: {
        'text-field': `${this.config.title}`,
      },
      paint: {
        'text-color': '#FFFFFF',
      },
    });
  }

  private async addLogo() {
    this.map.loadImage('./images/Logo2.png', (error, image) => {
      if (error) throw error;
      if (!this.map.hasImage('logo-add'))
        this.map.addImage('logo-add', image, { pixelRatio: 5 });
    });

    this.map.addSource('logo', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: [this.map.getCenter().lng, this.map.getCenter().lat],
            },
          },
        ],
      },
    });

    this.map.addLayer({
      id: 'layer-with-logo-add',
      type: 'symbol',
      source: 'logo',
      layout: {
        'icon-image': 'logo-add',
        'icon-anchor': 'bottom-right',
        'icon-size': 3,
      },
      paint: {
        'icon-translate': [
          window.innerWidth / 2 - 72,
          window.innerHeight / 2 - 62,
        ],
      },
    });
  }

  private initFinishMarker() {
    this.map.loadImage('./images/finishMarker_2.png', (error, image) => {
      if (error) throw error;
      if (!this.map.hasImage('finish-marker'))
        this.map.addImage('finish-marker', image, { pixelRatio: 3 });

      this.map.addSource('finish', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates:
                  this.config.geo.geometry.coordinates[
                    this.config.geo.geometry.coordinates.length - 1
                  ],
              },
            },
          ],
        },
      });

      this.map.addLayer({
        id: 'layer-with-finish-marker',
        type: 'symbol',
        source: 'finish',
        // paint: {
        //   'icon-translate': [0, -pixels.y.toFixed()],
        //   'icon-translate-transition': {
        //     duration: 1200,
        //   },
        // },
        layout: {
          'icon-image': 'finish-marker',
          'icon-anchor': 'bottom',
        },
      });
      //
      // setTimeout(() => {
      //   this.map.setPaintProperty(
      //     'layer-with-finish-marker',
      //     'icon-translate',
      //     [0, 0],
      //   );
      // }, 1000);
    });
  }

  private initLine() {
    this.map.addSource('line', {
      type: 'geojson',
      // Line metrics is required to use the 'line-progress' property
      lineMetrics: true,
      data: this.config.geo,
    });
    this.map.addLayer({
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
  }

  flyInAndRotate(endPitch: number): Promise<void> {
    console.log('FlyInAndRotate');
    return new Promise(async (resolve) => {
      const startPitch = this.pitch;
      const targetPosition: [number, number] = [
        this.config.geo.geometry.coordinates[0][0],
        this.config.geo.geometry.coordinates[0][1],
      ];

      const frames = (FLY_IN_DURATION / 1000) * FRAMERATE;
      console.log(`frames to get ${frames}`);
      let currentFrame = 0;

      // the animation frame will run as many times as necessary until the duration has been reached
      while (currentFrame < frames) {
        const animationPhase = currentFrame++ / frames;

        this.pitch =
          startPitch +
          (endPitch - startPitch) * d3.easeCubicOut(animationPhase);

        this.setCameraPosition(
          this.pitch,
          this.bearing,
          this.altitude,
          targetPosition,
        );

        await this.waitOrDownloadFrame();
      }
      resolve();
    });
  }

  animatePath(): Promise<void> {
    const distance = turf.lineDistance(this.config.geo);
    console.log('-> distance', distance);
    const duration = distance * SPEED_FACTOR * 1000;
    // const duration = 2000;
    console.log('-> duration', duration);
    const startBearing = this.bearing;

    const frames = Math.ceil((duration / 1000) * FRAMERATE);
    let currentFrame = 0;

    return new Promise(async (resolve) => {
      while (currentFrame < frames) {
        // if (!startTime) startTime = currentTime;
        const animationPhase = currentFrame++ / frames;

        // calculate the distance along the path based on the animationPhase
        const alongPath = turf.along(this.config.geo, distance * animationPhase)
          .geometry.coordinates;
        // console.log('-> alongPath', alongPath);

        this.marker.setLngLat({
          lng: alongPath[0],
          lat: alongPath[1],
        });

        // Reduce the visible length of the line by using a line-gradient to cutoff the line
        // animationPhase is a value between 0 and 1 that reprents the progress of the animation
        this.map.setPaintProperty('line-layer', 'line-gradient', [
          'step',
          ['line-progress'],
          '#DB2B35',
          animationPhase,
          'rgba(0, 0, 0, 0)',
        ]);

        // slowly rotate the map at a constant rate
        this.bearing = startBearing - animationPhase * 200.0;

        this.setCameraPosition(
          this.pitch,
          this.bearing,
          this.altitude,
          alongPath,
        );

        await this.waitOrDownloadFrame();

        // repeat!
      }
      resolve();
    });
  }

  zoomOut() {
    const bounds = turf.bbox(this.config.geo);
    console.log(`ZoomOut base bounds ${JSON.stringify(this.map.getBounds())}`);
    this.map.fitBounds([bounds[0], bounds[1], bounds[2], bounds[3]], {
      duration: 15000,
      pitch: 50,
      bearing: 170,
      padding: 50,
    });
  }

  private setCameraPosition(
    pitch: number,
    bearing: number,
    altitude,
    coordinates,
  ): void {
    const camera = this.map.getFreeCameraOptions();
    camera.setPitchBearing(pitch, bearing);

    const position = computeCameraPosition(
      pitch,
      bearing,
      coordinates,
      altitude,
    );

    // set the position and altitude of the camera
    camera.position = mapboxgl.MercatorCoordinate.fromLngLat(
      position,
      altitude,
    );

    this.map.setFreeCameraOptions(camera);
  }
}
