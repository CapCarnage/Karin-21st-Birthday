// Elements
const cakeScreen = document.getElementById('cake-screen');
const cardScreen = document.getElementById('card-screen');
const countdownScreen = document.getElementById('countdown-screen');
const countdownEl = document.getElementById("countdown");
const distanceEl = document.getElementById("distance");

// Dates for countdown and plane animation
const startDate = new Date('2025-09-02T01:15:00+01:00').getTime(); // Dublin time (BST +1)
const targetDate = new Date('2025-09-02T01:15:00+01:00').getTime(); // same landing time

// Plane path: Bratislava -> Dublin
const bratislava = [48.1486, 17.1077];
const dublin = [53.3498, -6.2603];

// Leaflet map setup
const map = L.map('map').setView([51, 6], 5);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '',
  maxZoom: 18
}).addTo(map);
L.polyline([bratislava, dublin], {color: 'white', weight: 2, opacity: 0.7}).addTo(map);

const planeIcon = L.icon({
  iconUrl: 'https://img.icons8.com/ios-filled/50/ffffff/airplane-take-off.png',
  iconSize: [30, 30]
});
const planeMarker = L.marker(bratislava, {icon: planeIcon}).addTo(map);

// Calculate Haversine distance
function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 0.5 - Math.cos(dLat)/2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * (1 - Math.cos(dLon))/2;
  return (R * 2 * Math.asin(Math.sqrt(a))).toFixed(1);
}

// Update countdown and plane position
function updateCountdown() {
  const now = Date.now();
  const distance = targetDate - now;

  if (distance <= 0) {
    countdownEl.innerHTML = "Plane has landed! 🎉";
    distanceEl.innerHTML = "Welcome to Dublin!";
    planeMarker.setLatLng(dublin);
    return;
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);
  countdownEl.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;

  const totalDuration = targetDate - startDate;
  const elapsed = now - startDate;
  const progress = Math.min(Math.max(elapsed / totalDuration, 0), 1);

  const lat = bratislava[0] + (dublin[0] - bratislava[0]) * progress;
  const lng = bratislava[1] + (dublin[1] - bratislava[1]) * progress;
  planeMarker.setLatLng([lat, lng]);

  const remainingDistance = calcDistance(lat, lng, dublin[0], dublin[1]);
  distanceEl.innerHTML = `Remaining: ${remainingDistance} km`;
}

// --- Blow detection ---
let audioContext, microphone, analyser, dataArray;
let blowingDetected = false;

async function startBlowDetection() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    microphone = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    microphone.connect(analyser);
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    detectBlow();
  } catch (e) {
    alert('Microphone access is required to blow out the candles!');
  }
}

function detectBlow() {
  analyser.getByteFrequencyData(dataArray);
  const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

  // console.log('Volume:', volume); // Uncomment for debugging

  if (volume > 50) {
    blowingDetected = true;
    cakeScreen.classList.remove('active');
    cardScreen.classList.add('active');
    stopBlowDetection();
    return;
  }

  if (!blowingDetected) {
    requestAnimationFrame(detectBlow);
  }
}

function stopBlowDetection() {
  if (microphone) microphone.disconnect();
  if (analyser) analyser.disconnect();
  if (audioContext) audioContext.close();
}

// Start blow detection on page load
startBlowDetection();

// Start countdown update every second
setInterval(updateCountdown, 1000);
updateCountdown();
