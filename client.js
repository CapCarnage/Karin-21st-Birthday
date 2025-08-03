// Pages
const page1 = document.getElementById("page1");
const page2 = document.getElementById("page2");
const page3 = document.getElementById("page3");

const blowStatus = document.getElementById("blowStatus");
const toCountdownBtn = document.getElementById("toCountdownBtn");

const countdownEl = document.getElementById("countdown");
const distanceEl = document.getElementById("distance");

// Dates
// Flight from Bratislava to Dublin landing Sept 2, 2025 01:15 Dublin local time (UTC+1 at that time)
const targetDate = new Date('2025-09-02T00:15:00Z').getTime(); // 01:15 Dublin = 00:15 UTC (Sept 2nd)
const startDate = new Date('2025-07-20T00:00:00Z').getTime(); // start a bit earlier (July 20)

// Leaflet Map Setup
const map = L.map('map').setView([51.5, -3], 5); // Center roughly between Bratislava & Dublin

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '',
  maxZoom: 18
}).addTo(map);

const bratislava = [48.1486, 17.1077];
const dublin = [53.3498, -6.2603];

// Flight path line
L.polyline([bratislava, dublin], { color: 'white', weight: 2, opacity: 0.7 }).addTo(map);

// Plane Icon
const planeIcon = L.icon({
  iconUrl: 'https://img.icons8.com/ios-filled/50/ffffff/airplane-take-off.png',
  iconSize: [30, 30]
});

const planeMarker = L.marker(bratislava, { icon: planeIcon }).addTo(map);

// Calculate distance between two coords (Haversine)
function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 0.5 - Math.cos(dLat)/2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * (1 - Math.cos(dLon))/2;
  return (R * 2 * Math.asin(Math.sqrt(a))).toFixed(1);
}

// Update countdown & animate plane
function updateCountdownAndPlane() {
  const now = Date.now();
  const distance = targetDate - now;

  if (distance <= 0) {
    countdownEl.innerHTML = "You've landed! 🎉❤️";
    distanceEl.innerHTML = "Welcome to Dublin!";
    planeMarker.setLatLng(dublin);
    return;
  }

  // Display countdown timer
  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);
  countdownEl.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;

  // Progress of flight
  const totalDuration = targetDate - startDate;
  const elapsed = now - startDate;
  const progress = Math.min(Math.max(elapsed / totalDuration, 0), 1);

  // Calculate plane position
  const lat = bratislava[0] + (dublin[0] - bratislava[0]) * progress;
  const lng = bratislava[1] + (dublin[1] - bratislava[1]) * progress;
  planeMarker.setLatLng([lat, lng]);

  // Calculate remaining distance
  const remainingDistance = calcDistance(lat, lng, dublin[0], dublin[1]);
  distanceEl.innerHTML = `Remaining: ${remainingDistance} km`;
}

// Mic blow detection logic
async function detectBlow() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(2048, 1, 1);

    source.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      let total = 0;
      for (let i = 0; i < input.length; i++) {
        total += Math.abs(input[i]);
      }
      const average = total / input.length;

      // If average sound amplitude (volume) is above threshold, assume blow
      if (average > 0.05) {
        blowStatus.textContent = "🎉 Candles blown out! 🎉";
        processor.disconnect();
        source.disconnect();
        audioContext.close();

        // Move to next page after a short delay
        setTimeout(() => {
          showPage(2);
        }, 1500);
      }
    };
  } catch (err) {
    blowStatus.textContent = "Microphone access denied or not supported.";
  }
}

// Show only one page at a time
function showPage(pageNumber) {
  page1.classList.add("hidden");
  page1.classList.remove("visible");
  page2.classList.add("hidden");
  page2.classList.remove("visible");
  page3.classList.add("hidden");
  page3.classList.remove("visible");

  if (pageNumber === 1) {
    page1.classList.remove("hidden");
    page1.classList.add("visible");
  } else if (pageNumber === 2) {
    page2.classList.remove("hidden");
    page2.classList.add("visible");
  } else if (pageNumber === 3) {
    page3.classList.remove("hidden");
    page3.classList.add("visible");
  }
}

// Button to go from card to countdown
toCountdownBtn.onclick = () => {
  showPage(3);
  updateCountdownAndPlane();
  setInterval(updateCountdownAndPlane, 1000);
};

// Start everything
showPage(1);
detectBlow();
