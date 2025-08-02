const cakeScreen = document.getElementById("cakeScreen");
const cardScreen = document.getElementById("cardScreen");
const countdownScreen = document.getElementById("countdownScreen");
const showButton = document.getElementById("showCountdown");

const countdownEl = document.getElementById("countdown");
const distanceEl = document.getElementById("distance");

// 🕓 Times
const startDate = new Date('2025-08-01T00:00:00Z').getTime(); // arbitrary start
const targetDate = new Date('2025-09-02T00:15:00+01:00').getTime(); // Dublin time 01:15am

// 🛫 Coordinates
const bratislava = [48.1486, 17.1077];
const dublin = [53.3498, -6.2603];

// 🎤 Microphone blow detection
let blown = false;
navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const mic = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  mic.connect(analyser);
  const data = new Uint8Array(analyser.frequencyBinCount);

  function detect() {
    analyser.getByteFrequencyData(data);
    const volume = data.reduce((a, b) => a + b) / data.length;
    if (volume > 60 && !blown) {
      blown = true;
      cakeScreen.classList.add("hidden");
      cardScreen.classList.remove("hidden");
    }
    requestAnimationFrame(detect);
  }

  detect();
});

// ✉️ Show countdown on button click
showButton.addEventListener("click", () => {
  cardScreen.classList.add("hidden");
  countdownScreen.classList.remove("hidden");
  initMap();
});

// 🗺️ Leaflet Map + Countdown
function initMap() {
  const map = L.map('map').setView([50, 10], 5);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 18
  }).addTo(map);

  const planeIcon = L.icon({
    iconUrl: 'https://img.icons8.com/ios-filled/50/ffffff/airplane-take-off.png',
    iconSize: [30, 30]
  });

  const marker = L.marker(bratislava, { icon: planeIcon }).addTo(map);
  L.polyline([bratislava, dublin], { color: 'white', weight: 2, opacity: 0.7 }).addTo(map);

  function calcDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 0.5 - Math.cos(dLat) / 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      (1 - Math.cos(dLon)) / 2;
    return (R * 2 * Math.asin(Math.sqrt(a))).toFixed(1);
  }

  function updateCountdown() {
    const now = Date.now();
    const distance = targetDate - now;

    if (distance <= 0) {
      countdownEl.innerHTML = "You're here! ❤️";
      distanceEl.innerHTML = "You're here!";
      marker.setLatLng(dublin);
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    countdownEl.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    const elapsed = now - startDate;
    const total = targetDate - startDate;
    const progress = Math.min(Math.max(elapsed / total, 0), 1);
    const lat = bratislava[0] + (dublin[0] - bratislava[0]) * progress;
    const lng = bratislava[1] + (dublin[1] - bratislava[1]) * progress;
    marker.setLatLng([lat, lng]);

    const dist = calcDistance(lat, lng, dublin[0], dublin[1]);
    distanceEl.innerHTML = `Remaining: ${dist} km`;
  }

  setInterval(updateCountdown, 1000);
  updateCountdown();
}
