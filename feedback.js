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
