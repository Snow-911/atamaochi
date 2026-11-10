let audioCtx, soundOn=true;
function unlockAudio(){try{const AC=window.AudioContext||window.webkitAudioContext;if(AC&&soundOn){audioCtx??=new AC();if(audioCtx.state!=='running')audioCtx.resume().catch(()=>{})}}catch{}}
document.addEventListener('click',unlockAudio,true);
const toggle=document.getElementById('sound');
toggle.onclick=()=>{soundOn=!soundOn;toggle.textContent='効果音 '+(soundOn?'ON':'OFF');toggle.setAttribute('aria-pressed',soundOn);if(soundOn)unlockAudio()};
function cue(kind){if(!soundOn||audioCtx?.state!=='running')return;
 const notes={start:[523,784],tick:[660],end:[523,330,220]}[kind];
 notes.forEach((hz,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime+i*.13,d=kind==='end'?.21:.1;
 o.frequency.value=hz;g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(.14,t+.012);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+d+.01)});
}
function makeGauge(container,total){const bar=document.createElement('progress'),out=document.createElement('output');bar.max=total;bar.value=total;bar.setAttribute('aria-label','残り時間');out.setAttribute('aria-live','off');container.append(out,bar);let previous=total;return ms=>{const value=Math.max(0,Math.min(total,ms/1000)),sec=Math.ceil(value);bar.value=value;bar.classList.toggle('urgent',sec<=3);out.textContent='残り '+sec+' 秒';if(sec>0&&sec<=3&&sec<previous)cue('tick');previous=sec;return sec}}
