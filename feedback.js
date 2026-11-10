let audioCtx, soundOn=true;
function unlockAudio(){try{const AC=window.AudioContext||window.webkitAudioContext;if(AC&&soundOn){audioCtx??=new AC();if(audioCtx.state!=='running')audioCtx.resume().catch(()=>{})}}catch{}}
document.addEventListener('click',unlockAudio,true);
const toggle=document.getElementById('sound');
toggle.onclick=()=>{soundOn=!soundOn;toggle.textContent='効果音 '+(soundOn?'ON':'OFF');toggle.setAttribute('aria-pressed',soundOn);if(soundOn)unlockAudio()};
const volume = document.getElementById('volume');
try { const stored = localStorage.getItem('atamaochi-volume'); if (stored !== null) volume.value = stored; } catch {}
function displayVolume() {
 document.getElementById('volumeValue').textContent = volume.value + '%';
}
displayVolume();
volume.oninput = () => {
 displayVolume();
 try { localStorage.setItem('atamaochi-volume', volume.value); } catch {}
};
volume.onchange = () => { unlockAudio(); cue('end'); };
function cue(kind) {
 const level = Number(volume.value) / 100;
 if (!level || !soundOn || audioCtx?.state !== 'running') return;
 const chords = {start:[[523],[784]], tick:[[660]], end:[[392,494,587],[523,659,784]]}[kind];
 chords.forEach((chord, index) => {
  const time = audioCtx.currentTime + index * (kind === 'end' ? 0.23 : 0.13);
  const duration = kind === 'end' ? (index ? 0.44 : 0.17) : 0.1;
  for (const hz of chord) {
   const oscillator = audioCtx.createOscillator(), gain = audioCtx.createGain();
   oscillator.type = kind === 'end' ? 'triangle' : 'sine';
   oscillator.frequency.value = hz;
   gain.gain.setValueAtTime(0.00001, time);
   gain.gain.exponentialRampToValueAtTime(0.2 * level / chord.length, time + 0.01);
   gain.gain.exponentialRampToValueAtTime(0.00001, time + duration);
   oscillator.connect(gain); gain.connect(audioCtx.destination);
   oscillator.start(time); oscillator.stop(time + duration);
  }
 });
}
function makeGauge(container,total){const bar=document.createElement('progress'),out=document.createElement('output');bar.max=total;bar.value=total;bar.setAttribute('aria-label','残り時間');out.setAttribute('aria-live','off');container.append(out,bar);let previous=total;return ms=>{const value=Math.max(0,Math.min(total,ms/1000)),sec=Math.ceil(value);bar.value=value;bar.classList.toggle('urgent',sec<=3);out.textContent='残り '+sec+' 秒';if(sec>0&&sec<=3&&sec<previous)cue('tick');previous=sec;return sec}}

function makeCountdown(container) {
 const panel = document.createElement('div');
 panel.className = 'countdown';
 panel.setAttribute('role', 'status');
 panel.textContent = 'トーク開始まで';
 container.append(panel);
 let previous;
 return milliseconds => {
  const value = Math.max(0, Math.min(3, Math.ceil(milliseconds / 1000)));
  if (value && value !== previous) {
   panel.querySelector('strong')?.remove();
   const digit = document.createElement('strong');
   digit.textContent = value;
   panel.append(digit);
   previous = value;
  }
  return value;
 };
}

// Short voiced "ha" bursts. The falling pitch and vowel resonances shape each chuckle.
let activeLaugh;
function playLaugh() {
 const level = Number(volume.value) / 100;
 if (!level || !soundOn || audioCtx?.state !== 'running') return;
 activeLaugh?.disconnect();
 const mix = audioCtx.createGain();
 activeLaugh = mix;
 mix.gain.value = level * 0.45;
 mix.connect(audioCtx.destination);
 const voice = audioCtx.createOscillator();
 voice.type = 'sawtooth';
 const envelope = audioCtx.createGain();
 envelope.gain.value = 0;
 voice.connect(envelope);
 for (const [frequency, strength] of [[780, 1], [1240, 0.75], [2550, 0.25]]) {
  const resonance = audioCtx.createBiquadFilter();
  resonance.type = 'bandpass';
  resonance.frequency.value = frequency;
  resonance.Q.value = 4;
  const gain = audioCtx.createGain();
  gain.gain.value = strength;
  envelope.connect(resonance).connect(gain).connect(mix);
 }
 const start = audioCtx.currentTime;
 const pitch = 220 + Math.random() * 60;
 [0, 0.15, 0.32, 0.51].forEach((offset, i) => {
  const t = start + offset;
  voice.frequency.setValueAtTime(pitch * (1.15 - i * 0.07), t);
  voice.frequency.exponentialRampToValueAtTime(pitch * 0.66, t + 0.12);
  envelope.gain.setValueAtTime(0, t);
  envelope.gain.linearRampToValueAtTime(0.95 - i * 0.11, t + 0.024);
  envelope.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
 });
 voice.onended = () => { mix.disconnect(); if (activeLaugh === mix) activeLaugh = null; };
 voice.start(start);
 voice.stop(start + 0.68);
}

function revealVerdict(container, success) {
 const title = container.querySelector('.verdict') || container.querySelector('h2');
 title?.classList.add('verdict');
 if (!success || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
 const layer = document.createElement('div');
 layer.className = 'confetti';
 layer.setAttribute('aria-hidden','true');
 const colors = ['#ffcc16','#ff5849','#805ce7','#27c6b5'];
 for (let i = 0; i < 36; i++) {
  const piece = document.createElement('i');
  piece.style.left = Math.random()*100+'%';
  piece.style.backgroundColor = colors[i % colors.length];
  piece.style.setProperty('--drift',(Math.random()-.5)*120+'px');
  piece.style.setProperty('--spin',(Math.random()-.5)*800+'deg');
  piece.style.animationDelay = Math.random()*.35+'s';
  layer.append(piece);
 }
 container.append(layer);
 setTimeout(()=>layer.remove(),2100);
}
