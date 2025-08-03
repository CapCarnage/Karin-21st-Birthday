// Dates
const startDate = new Date('2025-09-02T01:15:00Z').getTime();  // Dublin time target
const targetDate = startDate;  // Plane lands exactly at startDate

const countdownEl = document.getElementById("countdown");
const distanceEl = document.getElementById("distance");
const blowStatus = document.getElementById("blowStatus");

// Map Setup
const map = L.map('map').setView([51.5, -3], 5); // Center roughly between Bratislava and Dublin

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '',
  maxZoom: 18
}).addTo(map);

const bratislava = [48.1486, 17.1077];
const dublin = [53.3498, -6.2603];

// Flight Path Line
L.polyline([bratislava, dublin], {color: 'white', weight: 2, opacity: 0.7}).addTo(map);

// Plane Icon
const planeIcon = L.icon({
  iconUrl: 'https://img.icons8.com/ios-filled/50/ffffff/airplane-take-off.png',
  iconSize: [30, 30]
});

const planeMarker = L.marker(bratislava, {icon: planeIcon}).addTo(map);

// Haversine Distance Function
function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 0.5 - Math.cos(dLat)/2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * (1 - Math.cos(dLon))/2;
  return (R * 2 * Math.asin(Math.sqrt(a))).toFixed(1);
}

// Countdown update + animate plane towards Dublin
function update() {
  const now = Date.now();
  const distance = targetDate - now;

  if (distance <= 0) {
    countdownEl.innerHTML = "🎉 She's here in Dublin! 🎉";
    distanceEl.innerHTML = "Plane has landed!";
    planeMarker.setLatLng(dublin);
    clearInterval(updateInterval);
    return;
  }

  // Countdown timer display
  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);
  countdownEl.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;

  // Calculate progress for plane movement (reverse: starts at Bratislava, moves to Dublin)
  const totalDuration = targetDate - startDate;
  const elapsed = now - startDate;
  const progress = Math.min(Math.max(elapsed / totalDuration, 0), 1);

  // Plane position interpolation
  const lat = bratislava[0] + (dublin[0] - bratislava[0]) * progress;
  const lng = bratislava[1] + (dublin[1] - bratislava[1]) * progress;
  planeMarker.setLatLng([lat, lng]);

  // Update remaining distance
  const remainingDistance = calcDistance(lat, lng, dublin[0], dublin[1]);
  distanceEl.innerHTML = `Remaining distance: ${remainingDistance} km`;
}

const updateInterval = setInterval(update, 1000);
update();  // initial call

// --- Breath Detection for blowing candles ---
async function detectBlow() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(2048, 1, 1);

    source.connect(processor);
    processor.connect(audioContext.destination);

    let blowDetected = false;

    processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      let max = 0;
      for (let i = 0; i < input.length; i++) {
        if (Math.abs(input[i]) > max) max = Math.abs(input[i]);
      }

      // Adjust threshold if needed
      if (max > 0.1 && !blowDetected) {
        blowDetected = true;
        blowStatus.textContent = "🎉 Candles blown out! 🎉";

        // Cleanup audio processing
        processor.disconnect();
        source.disconnect();
        audioContext.close();

        // After a delay, show the birthday card (page 2)
        setTimeout(() => {
          showPage(2);
        }, 1500);
      }
    };
  } catch (err) {
    blowStatus.textContent = "Microphone access denied or not supported.";
    console.error("Mic error:", err);
  }
}

// Call detectBlow when page 1 is shown (assume you call showPage(1) on load)
document.addEventListener("DOMContentLoaded", () => {
  showPage(1);
  detectBlow();
});

// --- Page show/hide helper ---
function showPage(num) {
  const pages = document.querySelectorAll(".page");
  pages.forEach(p => p.style.display = "none");
  document.getElementById(`page${num}`).style.display = "block";
}
