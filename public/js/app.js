// import trackGeojson from './scripts.js';
// console.log('-> trackGeojson', trackGeojson);

// const altitudes = trackGeojson.geometry.coordinates.map((i) => i[2]);

export const refs = {
  distance: document.getElementById('distance'),
  elevation: document.getElementById('elevation'),
  duration: document.getElementById('duration'),
  date: document.getElementById('date'),
  title: document.getElementById('title'),
  container: document.getElementById('container'),
  presentation: document.getElementById('presentation'),
  stylesheet: document.styleSheets[2].cssRules,
};

// // getting max heigth from coordinates
const getMaxHeigth = (coordinates) => {
  const ft = 3.2808;
  const heigths = coordinates.geometry.coordinates.map((i) => i[2]);
  return (Math.max(...heigths) * ft).toFixed();
};
refs.elevation.textContent = `${getMaxHeigth(trackGeojson)}ft`;

// get path distance all route
const pathDistance = turf.lineDistance(trackGeojson).toFixed();
refs.distance.textContent = `${pathDistance}km`;

// get time for traveling with speed 4,5km/h
const speed = 4.5;
const getTime = (pathDistance, speed) => {
  const hour = (pathDistance / speed).toString().split('.');
  return {
    hrs: hour[0],
    mins: (hour[1] * 60).toString().substring(0, 2),
  };
};
const time = getTime(pathDistance, speed);
refs.duration.textContent = `${time.hrs}hrs ${time.mins}mins`;

// get current time
const dateTime = new Date();
const year = dateTime.getFullYear();
const dayNumber = dateTime.getDate();
const monthName = dateTime.toLocaleDateString('en-us', { month: 'long' });

refs.date.textContent = `${dayNumber}th ${monthName} ${year}`;

//added elavation-profile / setting for canvas

// new Chart(document.getElementById('line-chart'), {
//   type: 'line',
//   data: {
//     labels: altitudes,
//     datasets: [
//       {
//         data: altitudes,
//         label: 'Altitude',
//         borderColor: '#FFFFFF',
//         fill: true,
//         backgroundColor: 'rgba(217, 217, 217)',
//         pointRadius: 0,
//         tension: 0.4,
//       },
//     ],
//   },
//   options: {
//     scales: {
//       y: {
//         display: false,
//       },
//       x: {
//         display: false,
//       },
//     },
//     plugins: {
//       legend: false,
//     },
//   },
// });

export default refs;
