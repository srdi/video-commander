import { Config } from './interfaces';
import { $, sleep, toFt } from './util';
import * as turf from '@turf/turf';
import Chart from 'chart.js/auto';

export class Decorations {
  private config: Config;
  private slide1: any;
  private slide2: any;
  private slide3: any;
  constructor(config: Config) {
    this.config = config;

    this.slide1 = {
      container: $('.slide1'),
      title: $('.slide1__title'),
      subtitle: $('.slide1__subtitle'),
      date: $('.slide1__date'),
    };

    this.slide2 = {
      container: $('.slide2'),
      distanceBox: $('.distance'),
      distance: $('#distance'),
      elevationBox: $('.elevation'),
      elevation: $('#elevation'),
      elevationChartBox: $('.elevation-profile'),
      elevationChart: $('#line-chart'),
      durationBox: $('.duration'),
      duration: $('#duration'),
    };

    this.slide3 = {
      container: $('.slide3'),
      text: $('.presentation-text'),
      icons: $('.icons'),
      phone: $('.phone'),
      logo: $('.logo-footer'),
    };

    this.initSlide1();
    this.initSlide2();
  }

  initSlide1() {
    this.slide1.title.innerText = this.config.title || '';
    this.slide1.subtitle.innerText = this.config.subtitle || '';
    this.slide1.date.innerText = this.config.date || '';
  }

  initSlide2() {
    const altitudes = this.config.geo.geometry.coordinates.map(
      (point) => point[2],
    );
    const maxAltitude = Math.max(...altitudes);
    const distance = turf.lineDistance(this.config.geo);

    this.slide2.elevation.innerText = toFt(maxAltitude).toFixed() + 'ft';
    this.slide2.distance.innerText = distance.toFixed() + 'km';

    //TODO: add time

    new Chart(this.slide2.elevationChart, {
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
          legend: { display: false },
        },
      },
    });
  }

  showSlide1() {
    this.slide1.container.style.opacity = '1';
  }

  hideSlide1() {
    this.slide1.container.style.opacity = '0';
  }

  async showSlide2() {
    console.log('slide2', this.slide2);
    this.slide2.container.classList.remove('is-hidden');

    this.slide2.elevationChartBox.style.animation =
      'slideDown 1s ease-in forwards';

    await sleep(1000);

    this.slide2.distanceBox.style.animation = 'slideDown 1s ease-in forwards';

    await sleep(1000);

    this.slide2.elevationBox.style.animation = 'slideDown 1s ease-in forwards';

    await sleep(1000);

    this.slide2.durationBox.style.animation = 'slideDown 1s ease-in forwards';
  }

  hideSlide2() {
    this.slide2.container.style.animation = 'slideUp 1s ease-in';
  }

  showSlide3() {
    this.slide3.container.classList.remove('is-hidden');

    this.slide3.text.style.setProperty('opacity', 1);
    this.slide3.text.style.setProperty('animation', 'fadeIn 1.5s ease-in');
    this.slide3.icons.style.setProperty('opacity', 1);
    this.slide3.icons.style.setProperty('animation', 'fadeIn 1.5s ease-in');
    this.slide3.logo.style.setProperty('opacity', 1);
    this.slide3.logo.style.setProperty('animation', 'fadeIn 1.5s ease-in');
    this.slide3.phone.style.setProperty('transform', 'translateX(0%)');
    this.slide3.phone.style.setProperty('animation', 'rigthIn 1.3s ease-in');
  }
}
