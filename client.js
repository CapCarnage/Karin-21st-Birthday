const bratislava = [48.1486, 17.1077];
const dublin = [53.3498, -6.2603];

const targetDate = new Date('2025-09-02T00:15:00Z').getTime(); // 01:15 AM Dublin time
const startDate = Date.now();

const introEl = document.getElementById('intro');
const contentEl = document.getElementById('content');
const countdownEl = document.getElementById('countdown');
const distanceEl = document.getElementById('distance');

let map, planeMarker, micStarted = false;

function listenForBlow() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    const context = new AudioContext();
    const mic = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    mic.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    function detect() {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b) / data.length;
      if (avg > 20 && !micStarted) {
        micStarted = true;
        startCard();
      } else {
        requestAnimationFrame(detect);
      }
    }

    detect();
  }).catch(err => alert("Microphone needed to continue."));
}

function startCard() {
  introEl.style.display = 'none';
  contentEl.style.display = 'block';

  map = L.map('map').setView([50.5, 8], 5);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 18
  }).addTo(map);

  L.polyline([bratislava, dublin], { color: 'white', weight: 2, opacity: 0.7 }).addTo(map);

  const planeIcon = L.icon({
    iconUrl: 'https://img.icons8.com/ios-filled/50/ffffff/airplane-take-off.png',
    iconSize: [30, 30]
  });

  planeMarker = L.marker(bratislava, { icon: planeIcon }).addTo(map);

  update();
  setInterval(update, 1000);
}

function update() {
  const now = Date.now();
  const remaining = targetDate - now;

  if (remaining <= 0) {
    countdownEl.textContent = "She's landed ❤️";
    distanceEl.textContent = "You're together now 🥹";
    planeMarker.setLatLng(dublin);
    return;
  }

  const d = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const h = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((remaining % (1000 * 60)) / 1000);
  countdownEl.textContent = `${d}d ${h}h ${m}m ${s}s`;

  const totalDuration = targetDate - startDate;
  const elapsed = now - startDate;
  const progress = Math.min(Math.max(elapsed / totalDuration, 0), 1);

  const lat = bratislava[0] + (dublin[0] - bratislava[0]) * progress;
  const lng = bratislava[1] + (dublin[1] - bratislava[1]) * progress;
  planeMarker.setLatLng([lat, lng]);

  const dist = calcDistance(lat, lng, dublin[0], dublin[1]);
  distanceEl.textContent = `Remaining: ${dist} km`;
}

function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 0.5 - Math.cos(dLat)/2 +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
    (1 - Math.cos(dLon))/2;
  return (R * 2 * Math.asin(Math.sqrt(a))).toFixed(1);
}

// Start mic listener
listenForBlow();
