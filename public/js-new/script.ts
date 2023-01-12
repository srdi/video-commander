import { App } from './app.class';
import { trackGeojson } from './geo';
import { Config } from './interfaces';

const app = new App({
  geo: trackGeojson,

  title: 'Hello',

  subtitle: 'World',

  date: '2022-01-12',

  //false - record frames
  development: false,

  token:
    'pk.eyJ1Ijoic3JkaWZsIiwiYSI6ImNsYndjcmJhbjA0emYzcm81eGJuYWNtY2cifQ.XkMAGdbe4bSqdkKFoIeqzw',
});

console.log(`init app`);
app.init();

// document.addEventListener('init', async (e: any) => {
//   const config: Config = await e.detail;

//   console.log(`init ${config}`);

//   const app = new App({
//     geo: config.geo || trackGeojson,

//     title: config.title || 'Hello',

//     subtitle: config.subtitle || 'World',

//     date: config.date || '2022-01-12',

//     token:
//       config.token ||
//       'pk.eyJ1Ijoic3JkaWZsIiwiYSI6ImNsYndjcmJhbjA0emYzcm81eGJuYWNtY2cifQ.XkMAGdbe4bSqdkKFoIeqzw',
//     style: config.style ? config.style : undefined,

//     filename: config.filename ? config.filename : 'mapboxGl',
//   });

//   app.init();
// });
