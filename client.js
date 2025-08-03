const cakeScreen = document.getElementById('cake-screen');
const cardScreen = document.getElementById('card-screen');

let audioContext, analyser, dataArray;
let blowingDetected = false;

async function startBlowDetection() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const microphone = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    microphone.connect(analyser);
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    detectBlow();
  } catch (err) {
    console.error('Mic error:', err);
    alert('Please allow microphone access and refresh the page.');
  }
}

function detectBlow() {
  analyser.getByteFrequencyData(dataArray);
  const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

  console.log('Volume:', volume.toFixed(2));

  if (volume > 15) {  // Lowered threshold to catch breath sounds easier
    console.log('Blow detected!');
    blowingDetected = true;
    cakeScreen.classList.remove('active');
    cardScreen.classList.add('active');
    if (audioContext) audioContext.close();
    return;
  }
  if (!blowingDetected) requestAnimationFrame(detectBlow);
}

startBlowDetection();

// Add manual skip button to cakeScreen for testing
const skipBtn = document.createElement('button');
skipBtn.textContent = "I blew the candles!";
skipBtn.style.marginTop = '20px';
skipBtn.onclick = () => {
  blowingDetected = true;
  cakeScreen.classList.remove('active');
  cardScreen.classList.add('active');
  if (audioContext) audioContext.close();
};
cakeScreen.appendChild(skipBtn);
