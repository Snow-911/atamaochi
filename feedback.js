let audioCtx, masterGain, soundOn = true;
const clips = new Map();
const playing = new Map();
const clipLevels = {start: 0.72, end: 0.82, tick: 0.42, laugh: 0.78};
function unlockAudio() {
 if (!soundOn) return;
 const AC = window.AudioContext || window.webkitAudioContext;
 if (!AC) return;
 if (!audioCtx) {
  audioCtx = new AC();
  masterGain = audioCtx.createGain();
  masterGain.connect(audioCtx.destination);
  displayVolume();
 }
 if (audioCtx.state !== 'running') audioCtx.resume().catch(() => {});
 for (const kind of Object.keys(clipLevels)) {
  if (clips.has(kind)) continue;
  clips.set(kind, fetch('./sounds/'+kind+'.wav')
   .then(response => {
    if (!response.ok) throw new Error('Audio load failed');
    return response.arrayBuffer();
   })
   .then(bytes => audioCtx.decodeAudioData(bytes))
   .catch(() => { clips.delete(kind); return null; }));
 }
}
document.addEventListener('click',unlockAudio,true);
const toggle=document.getElementById('sound');
toggle.onclick=()=>{soundOn=!soundOn;toggle.textContent='効果音 '+(soundOn?'ON':'OFF');toggle.setAttribute('aria-pressed',soundOn);displayVolume();if(soundOn)unlockAudio();else for(const source of playing.values())source.stop()};
const volume = document.getElementById('volume');
try { const stored = localStorage.getItem('atamaochi-volume'); if (stored !== null) volume.value = stored; } catch {}
function displayVolume() {
 if (masterGain) masterGain.gain.value = soundOn ? Number(volume.value)/100 : 0;
 document.getElementById('volumeValue').textContent = volume.value + '%';
}
displayVolume();
volume.oninput = () => {
 displayVolume();
 try { localStorage.setItem('atamaochi-volume', volume.value); } catch {}
};
volume.onchange = () => { unlockAudio(); cue('end'); };
async function cue(kind) {
 if (!soundOn || !Number(volume.value) || !audioCtx) return;
 const requested = performance.now();
 const buffer = await clips.get(kind);
 if (!buffer || !soundOn || audioCtx.state !== 'running' || performance.now()-requested > 400) return;
 playing.get(kind)?.stop();
 const source = audioCtx.createBufferSource();
 const gain = audioCtx.createGain();
 gain.gain.value = clipLevels[kind];
 source.buffer = buffer;
 source.connect(gain).connect(masterGain);
 playing.set(kind,source);
 source.onended = () => {
  source.disconnect(); gain.disconnect();
  if (playing.get(kind) === source) playing.delete(kind);
 };
 source.start();
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

function playLaugh() { cue('laugh'); }

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
