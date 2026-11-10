'use strict';
(()=>{
const codeBox=$('roomCode'),notice=$('roomNotice'),prefix='atamaochi-v7-';
let session;
function addInviteLink(code) {
 const url = new URL('https://snow-911.github.io/atamaochi/');
 url.searchParams.set('room', code);
 const copy = document.createElement('button');
 copy.textContent = '招待リンクをコピー';
 copy.disabled = !!session?.relayPending;
 const status = document.createElement('span');
 status.setAttribute('role', 'status');
 copy.onclick = async () => {
  if (session?.relay) url.hash = 'invite=' + session.relay.invite;
  try {
   await navigator.clipboard.writeText(url.href);
   status.textContent = ' コピーしました';
  } catch {
   status.replaceChildren();
   const label = document.createElement('label');
   label.textContent = ' リンクを選択してコピーしてください ';
   const field = document.createElement('input');
   field.readOnly = true;
   field.value = url.href;
   label.append(field);
   status.append(label);
   field.focus();
   field.select();
  }
 };
 if (session && !session.relay && !session.relayPending) status.textContent=' 中継サービスに接続できないため、このリンクは直接接続を使用します。';
 stage.append(copy, status);
}
function leave(reason=''){const r=session;if(!r)return;session=null;$('roster').hidden=true;clearInterval(r.clock);clearTimeout(r.timeout);r.relay?.destroy();r.peer?.destroy?.();setup.hidden=false;stage.hidden=true;notice.textContent=reason}
function kick(r, id) {
 const s = r.state, index = s.ids.indexOf(id);
 if (!r.host || !s.names[id] || id === r.id || !confirm(s.names[id] + 'さんを退出させますか？')) return;
 const connection = r.links.get(id);
 r.links.delete(id);
 if (connection?.open) {
  connection.send({type:'reject', reason:'ホストによって退出しました。'});
  setTimeout(() => connection.close(), 300);
 }
 delete s.names[id];
 if (index < 0) {
  s.spectators = s.spectators.filter(member => member !== id);
  if (s.phase === 'judge') return settleVotes(r);
  return publish(r);
 }
 removeTurn(r, index);
}
function removeTurn(r, index) {
 const s = r.state;
 const current = index === s.turn;
 s.ids.splice(index, 1);
 if (index < s.results.length) s.results.splice(index, 1);
 if (index < s.turn) s.turn--;
 if (!s.ids.length) {
  s.turn = 0;
  s.results = [];
  r.deck = [];
  return advance(r,'lobby');
 }
 if (s.mode === 'team' && s.phase !== 'lobby') {
  s.turn = Math.min(s.turn,s.ids.length - 1);
  if (s.phase === 'judge') return settleVotes(r);
  if (current && s.phase !== 'finished') return advance(r,'ready');
  return publish(r);
 }
 if (s.phase !== 'lobby') {
  if (s.results.length === s.ids.length) return advance(r, 'finished');
  if (current) return advance(r, 'ready');
  if (s.phase === 'judge') return settleVotes(r);
 }
 publish(r);
}
function setSpectating(r, id, watch) {
 const s = r.state;
 if (!s.names[id] || typeof watch !== 'boolean' || s.phase === 'finished') return;
 const index = s.ids.indexOf(id);
 if (watch && index >= 0) {
  s.spectators.push(id);
  removeTurn(r,index);
 } else if (!watch && index < 0 && s.phase === 'lobby' && s.ids.length < (s.capacity || 8)) {
  s.spectators = s.spectators.filter(member => member !== id);
  s.ids.push(id);
  publish(r);
 }
}
function showRoster(r) {
 const s = r.state, roster = $('roster');
 roster.hidden = false;
 roster.replaceChildren();
 const heading = document.createElement('h2');
 heading.textContent = 'トーク順';
 roster.append(heading);
 const editable = r.host && s.phase === 'lobby';
 const reorder = ids => { s.ids = ids; publish(r); };
 s.ids.forEach((id, index) => {
  const row = document.createElement('div'), label = document.createElement('span');
  const active = s.phase !== 'lobby' && s.phase !== 'finished' && index === s.turn;
  row.className = active ? 'order-row active' : 'order-row';
  label.textContent = (index + 1) + '. ' + s.names[id] + (active ? '（このターン）' : '');
  row.append(label);
  row.dataset.member = id;
  if (editable) {
   label.classList.add('drag-name');
   label.textContent = '⠿ ' + label.textContent;
   label.title = 'ドラッグして順番を変更';
   let target;
   label.onpointerdown = event => {
    if (!event.isPrimary || event.button !== 0) return;
    label.setPointerCapture(event.pointerId);
    target = row;
    row.classList.add('dragging');
   };
   label.onpointermove = event => {
    if (!label.hasPointerCapture(event.pointerId)) return;
    const over = document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-member]');
    target?.classList.remove('drop-target');
    target = roster.contains(over) ? over : null;
    target?.classList.add('drop-target');
   };
   label.onpointerup = event => {
    if (!label.hasPointerCapture(event.pointerId)) return;
    const destination = s.ids.indexOf(target?.dataset.member);
    if (destination < 0 || destination === index) return;
    const next = s.ids.slice();
    next.splice(index,1);
    next.splice(destination,0,id);
    reorder(next);
   };
   label.onlostpointercapture = () => {
    row.classList.remove('dragging');
    target?.classList.remove('drop-target');
    target=null;
   };
   addOrderControls(row, index, s.ids, s.names[id], reorder);
  }
  if (r.host && id !== r.id && s.phase !== 'finished')
   row.append(orderButton('キック', s.names[id]+'をキック', false, () => kick(r,id)));
  roster.append(row);
 });
 if (editable) roster.append(shuffleButton(s.ids, reorder));
 if (s.spectators.length) {
  const heading = document.createElement('h3');
  heading.textContent = '観戦中';
  roster.append(heading);
  for (const id of s.spectators) {
   const row = document.createElement('div');
   row.className = 'order-row';
   const name = document.createElement('span');
   name.textContent = s.names[id];
   row.append(name);
   if (r.host && id !== r.id && s.phase !== 'finished')
    row.append(orderButton('キック',s.names[id]+'をキック',false,()=>kick(r,id)));
   roster.append(row);
  }
 }
}
function relayLaugh(r, sender, turn) {
 const s = r.state;
 if (s.phase !== 'play' || turn !== s.serial || !s.ids.includes(sender) || sender === s.ids[s.turn]) return;
 const event = {type:'laugh', turn};
 for (const link of r.links.values()) if (link.open) link.send(event);
 playLaugh();
}
function eligibleVoters(s) {
 const players = s.mode === 'team' ? s.ids : s.ids.filter(id => id !== s.ids[s.turn]);
 return [...players, ...s.spectators];
}
function settleVotes(r) {
 const s = r.state;
 const voters = eligibleVoters(s);
 s.voted = voters.filter(id => r.ballots.has(id));
 if (s.voted.length < voters.length) return publish(r);
 const yes = voters.filter(id => r.ballots.get(id) === true).length;
 s.results.push({yes, no:voters.length - yes});
 advance(r, s.mode === 'team' || s.results.length === s.ids.length ? 'finished' : 'result');
}
function vote(r, id, serial, choice) {
 const s = r.state;
 if (s.phase !== 'judge' || s.serial !== serial || typeof choice !== 'boolean' ||
     !eligibleVoters(s).includes(id) || r.ballots.has(id)) return;
 r.ballots.set(id,choice);
 settleVotes(r);
}
function resultText(result) {
 if (!result.yes && !result.no) return '判定なし';
 return result.yes > result.no ? 'オチた！ 成功' : 'オチなかった… 失敗';
}
function showBallot(container, {yes,no}) {
 const card = document.createElement('div');
 card.className = 'ballot';
 for (const [label,count] of [['オチた',yes],['オチなかった',no]]) {
  const cell = document.createElement('div');
  cell.append(label+' ');
  const value = document.createElement('strong');
  value.textContent = count+'票';
  cell.append(value);
  card.append(cell);
 }
 const bar = document.createElement('div');
 bar.className = 'ballot-bar';
 const fill = document.createElement('i');
 fill.style.width = (yes+no ? 100*yes/(yes+no) : 0)+'%';
 bar.append(fill);
 card.append(bar);
 container.append(card);
}
function mayAdvance(r, id) {
 const s = r.state;
 return !!s.ids[s.turn+1] && [r.hostId, s.ids[s.turn], s.ids[s.turn+1]].includes(id);
}
function finishTurn(r) {
 const s = r.state;
 if (s.mode === 'team' && s.turn + 1 < s.ids.length) {
  s.turn++;
  return advance(r,'ready');
 }
 advance(r,'judge');
}
function turnAction(r, type, ok, sender = r.id) {
 const s = r.state;
 if (!r.host) {
  if (r.uplink?.open) r.uplink.send({type, turn:s.serial, ok});
  return;
 }
 if (type === 'nextTalk' && s.phase === 'result' && mayAdvance(r,sender)) {
  s.turn++;
  advance(r,'ready');
 } else if (type === 'startTalk' && s.phase === 'ready' && sender === s.ids[s.turn]) {
  s.startAt = Date.now() + 3000;
  s.end = s.startAt + s.seconds * 1000;
  advance(r, 'countdown');
 } else if (type === 'finishTalk' && s.phase === 'play' && (sender === s.ids[s.turn] || sender === r.hostId)) {
  finishTurn(r);

 }
}
function show(r){if(session!==r)return;const s=r.state;stage.replaceChildren();showRoster(r);
 const line=(tag,str)=>{const el=document.createElement(tag);el.textContent=str;stage.append(el);return el};
 const action = (label, fn, enabled = true) => {
  const b = line('button',label);
  b.className = 'primary turn-control';
  b.disabled = !enabled;
  if (enabled) b.onclick = fn;
 };

 const n=s.ids.length, speaker=s.names[s.ids[s.turn % n]];
 const watching = s.spectators.includes(r.id);
 if (watching) line('p', 'あなたは観戦中です');
 if(s.phase==='lobby'){
 line('h2','参加者を待っています');line('p',n+' / '+(s.capacity || 8)+'人参加中 ｜ '+modes[s.mode || 'normal'][0]);
 const codeToggle = line('button', r.showCode ? 'コードを非表示' : 'コードを表示');
 const codeText = line('span', '');
 function renderCode() {
  codeToggle.textContent = r.showCode ? 'コードを非表示' : 'コードを表示';
  codeToggle.setAttribute('aria-expanded', String(Boolean(r.showCode)));
  codeText.textContent = r.showCode ? ' ルームコード ' + r.code + ' ' : '';
 }
 codeToggle.onclick = () => { r.showCode = !r.showCode; renderCode(); };
 renderCode();
 addInviteLink(r.code);
 if(r.host){
 line('h3','ルーム設定');
 const modeLabel = line('label','モード ');
 const modeSelect = document.createElement('select');
 fillModes(modeSelect,s.mode || 'normal');
 modeLabel.append(modeSelect);
 modeSelect.onchange = () => { s.mode = modeSelect.value; publish(r); };
 line('p',modes[s.mode || 'normal'][1]);
 const capacityLabel = line('label','プレイヤーの上限（観戦者を除く） ');
 const capacitySelect = document.createElement('select');
 for (let limit = Math.max(2,n); limit <= 8; limit++) capacitySelect.add(new Option(limit+'人',limit));
 capacitySelect.value = s.capacity || 8;
 capacityLabel.append(capacitySelect);
 capacitySelect.onchange = () => { s.capacity = Number(capacitySelect.value); publish(r); };
 line('p','お題のジャンル（1つ以上）');const grid=line('div','');grid.className='grid';
 for(const g of Object.keys(bank)){const label=document.createElement('label'),input=document.createElement('input');label.className='tile';input.type='checkbox';input.checked=s.genres.includes(g);input.disabled=input.checked&&s.genres.length===1;input.onchange=()=>{s.genres=Object.keys(bank).filter(x=>x===g?input.checked:s.genres.includes(x));publish(r);stage.querySelectorAll('.tile input')[Object.keys(bank).indexOf(g)]?.focus()};label.append(input,document.createTextNode(g));grid.append(label)}
 line('h3','制限時間');const step=line('div','');step.className='stepper';for(const delta of [-10,10]){if(delta>0){const value=document.createElement('span');value.textContent=s.seconds+'秒';step.append(value)}const control=document.createElement('button');control.textContent=delta<0?'−':'＋';control.setAttribute('aria-label',delta<0?'10秒減らす':'10秒増やす');control.disabled=delta<0?s.seconds<=10:s.seconds>=600;control.onclick=()=>{s.seconds=Math.max(10,Math.min(600,s.seconds+delta));publish(r);stage.querySelectorAll('.stepper button')[delta<0?0:1]?.focus()};step.append(control)}
 line('p','開始すると設定が確定します。');action('全員そろったら開始',()=>advance(r,'ready'),n>=2)
 }else{line('p','制限時間：'+s.seconds+'秒');line('p','ジャンル：'+s.genres.join('・'));line('p','ホストが設定を変更すると、この画面にも反映されます。')}} else{if(s.phase!=='finished')line('p',modes[s.mode || 'normal'][0]+' ｜ '+modes[s.mode || 'normal'][1]);if(s.phase!=='finished')line('p',s.mode==='team'?(s.turn+1)+' / '+n+'人目 ／ '+speaker+' の番（'+(s.turn===n-1?'オチをつける':s.turn===0?'話を始める':'話をつなぐ')+'）':'トーク '+(s.turn+1)+' ／ '+speaker+' の番');
 const canAct = !watching && (r.host || s.ids[s.turn] === r.id);
 if (['ready','countdown','play','judge'].includes(s.phase)) {
  line('p', s.prompt[0]);
  line('h2', '「'+s.prompt[1]+'」');
 }
 if (s.phase === 'ready') {
  if (r.id !== s.ids[s.turn]) line('p', speaker+'さんの開始を待っています。');
 }
 if (s.phase === 'countdown') {
  r.countdown = makeCountdown(stage);
  tick(r);
 }
 if (s.phase === 'play') {
  if (r.lastCue !== 'start'+s.serial) { cue('start'); r.lastCue = 'start'+s.serial; }
  r.gauge = makeGauge(stage,s.seconds);
  if (s.mode !== 'team' && !watching && r.id !== s.ids[s.turn]) {
   action('ガヤボタン（笑い声）', () => {
    if (r.host) relayLaugh(r, r.id, s.serial);
    else if (r.uplink?.open) r.uplink.send({type:'laugh', turn:s.serial});
   });
  }

  tick(r);
 }
 if (s.phase === 'judge') {
  if (r.lastCue !== 'end'+s.serial) { cue('end'); r.lastCue = 'end'+s.serial; }
  const voted = s.voted.includes(r.id);
  const voters = eligibleVoters(s);
  const eligible = voters.includes(r.id);
  line('p','投票済み '+s.voted.length+' / '+voters.length+'人');
  if (eligible && !voted) {
   line('p','オチはついた？ 同票の場合は「オチなかった」です。');
   const cast = choice => {
    if (r.host) vote(r,r.id,s.serial,choice);
    else if (r.uplink?.open) r.uplink.send({type:'vote',turn:s.serial,choice});
   };
   action('オチた',()=>cast(true));
   action('オチなかった',()=>cast(false));
  } else {
   if (voted) { action('オチた',null,false); action('オチなかった',null,false); }
   line('p', voted ? '投票しました。開票をお待ちください。' : '聞き手が投票しています。');
  }
 }
 if (s.phase === 'result') {
  const result = s.results.at(-1);
  showBallot(stage,result);
  line('h2',resultText(result)).className='verdict';
  line('p','次は '+s.names[s.ids[s.turn+1]]+' の番です');

 }
 const beforeVote = ['ready','countdown','play'].includes(s.phase);
 if (s.phase !== 'finished' && !watching && (s.phase === 'ready' || s.ids.indexOf(r.id) > s.turn || (beforeVote && r.id === s.ids[s.turn]))) {
  action('トーク開始', () => turnAction(r,'startTalk'), s.phase==='ready' && r.id===s.ids[s.turn]);
 }
 if (beforeVote && canAct) {
  action(s.mode==='team' && s.turn+1<n ? '話をつないだ！ 次の人へ' : 'オチを言い終えた', () => turnAction(r,'finishTalk'), s.phase==='play');
 }
 if (beforeVote && (s.mode!=='team' || s.turn+1===n) && eligibleVoters(s).includes(r.id)) {
  action('オチた',null,false);
  action('オチなかった',null,false);
 }
 if (s.mode!=='team' && s.phase!=='finished' && s.ids[s.turn+1] && (!watching || r.host)) {
  action('次の人へ', () => turnAction(r,'nextTalk'), s.phase==='result' && mayAdvance(r,r.id));
 }
 if (s.phase === 'finished') {
  line('h2','最終結果');
  for (const [index,result] of s.results.entries()) {
   line('h3',s.mode === 'team' ? 'チーム全員' : s.names[s.ids[index]]);
   showBallot(stage,result);
   line('p',resultText(result)).className='result-line';
  }
  line('p','6秒後にロビーへ戻ります。');
 }
 }
 if (['result','finished'].includes(s.phase) && r.reveal !== s.serial) {
  r.reveal = s.serial;
  const tally = s.results.at(-1);
  revealVerdict(stage,tally.yes > tally.no);
 }
 line('hr','');
 if (s.phase !== 'finished' && (!watching || (s.phase==='lobby' && n<(s.capacity || 8)))) {
  const role = line('button', watching ? 'プレイヤーとして参加' : '観戦する');
  role.onclick = () => {
   if (!watching && s.phase!=='lobby' && !confirm('今回のトーク順から外れて観戦しますか？')) return;
   if (r.host) setSpectating(r,r.id,!watching);
   else if (r.uplink?.open) r.uplink.send({type:'spectating',watch:!watching});
  };
 }
 const b=line('button',r.host?'ルームを閉じる':'退出する');b.onclick=()=>{if(confirm(r.host?'全員のルームを終了しますか？':'ルームを退出しますか？'))leave()};
}
function tick(r){const s=r.state;if(s?.phase==='countdown'){if(!r.countdown(s.startAt-Date.now()-r.offset)&&r.host)advance(r,'play');return}if(s?.phase!=='play')return;const left=r.gauge(s.end-Date.now()-r.offset);if(!left&&r.host)finishTurn(r)}
function publish(r){r.state.revision=(r.state.revision || 0)+1;for(const c of r.links.values())if(c.open)c.send({type:'state',s:r.state,now:Date.now()});show(r)}
function advance(r,phase){const s=r.state;if(phase==='ready'){s.serial=(s.serial||0)+1;if(s.mode !== 'team' || !s.prompt || s.phase === 'lobby'){if(!r.deck.length)r.deck=s.genres.flatMap(g=>bank[g].map(t=>[g,t]));s.prompt=r.deck.splice(Math.floor(Math.random()*r.deck.length),1)[0]}}s.phase=phase;
 if (phase === 'judge') {
  r.ballots = new Map();
  return settleVotes(r);
 }
 if (phase === 'finished') {
  clearTimeout(r.returnTimer);
  r.returnTimer=setTimeout(() => {
   if (session !== r || s.phase !== 'finished') return;
   s.ids = s.ids.filter(id => id === r.id || r.links.has(id));
   s.spectators = s.spectators.filter(id => id === r.id || r.links.has(id));
   for (const id of Object.keys(s.names)) {
    if (!s.ids.includes(id) && !s.spectators.includes(id)) delete s.names[id];
   }
   r.deck = [];
   s.results = [];
   s.turn = 0;
   s.prompt = null;
   s.end = 0;
   s.startAt = 0;
   advance(r, 'lobby');
  }, 6000);
 }
 publish(r)}
function begin(host){if(session)return;const code=host?String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,'0'):codeBox.value.trim();
 if(!/^\d{6}$/.test(code)){notice.textContent='6桁のコードを入力してください。';return}
 if(host&&!chosen().length){notice.textContent='ジャンルを選んでください。';return}
 const nickname = $('nickname').value.trim();
 if (!nickname) {
  notice.textContent = 'ニックネームを入力してください。';
  $('nickname').focus();
  return;
 }
 const r=session={host,code,hostId:prefix+code,links:new Map(),deck:[],offset:0};
 setup.hidden=true;
 stage.hidden=false;
 screen('<h2>オンラインに接続しています</h2><p role="status" id="connectionStatus"></p>');
 button('キャンセル',()=>leave());
 const fail = msg => {
  if(session!==r) return;
  const joining = !r.state;
  leave(msg);
  if (joining) {
   const retry = document.createElement('button');
   retry.textContent = 'もう一度接続する';
   retry.onclick = () => begin(host);
   notice.append(document.createElement('br'), retry);
   retry.focus();
  }
 };
 function waiting(description, failure, seconds) {
  const status = $('connectionStatus');
  if (status) status.textContent = description;
  clearTimeout(r.timeout);
  r.timeout = setTimeout(() => fail(failure), seconds * 1000);
 }
 waiting('接続サービスにアクセス中…','接続サービスに到達できませんでした。通信環境を確認して再試行してください。',15);
 function wireGuest(c) {
 c.on('data',m=>{if(session!==r)return;if(m.type==='reject'){fail(m.reason);return}if(m.type==='laugh'){if(r.state?.phase==='play' && r.state.serial===m.turn)playLaugh();return}if(m.type==='pong'){r.offset=m.now-(Date.now()+m.sent)/2;return}if(m.type!=='state' || (r.state?.revision ?? -1) > (m.s.revision ?? 0))return;clearTimeout(r.timeout);if(!r.state)r.offset=m.now-Date.now();r.state=m.s;show(r)});c.on('open',()=>{
  if(!r.state) waiting('入室情報を受信中…','ホストから入室情報が届きませんでした。ホストの画面を開いて再試行してください。',10);
  c.send({type:'ping',sent:Date.now(),initial:!r.state});
 });c.on('close',()=>{if(r.state?.phase!=='finished')fail('ホストとの接続が終了しました。')});c.on('error',()=>fail('ホストとの通信が切れました。'));r.uplink=c;
 }
 function openLobby() {
  if (r.state || session !== r) return;
  clearTimeout(r.timeout);
  r.id = prefix+code;
  r.state = {phase:'lobby',mode:$('mode').value,capacity:8,seconds:duration,genres:chosen(),ids:[r.id],spectators:[],names:{[r.id]:nickname},turn:0,results:[]};
  startClock();
  show(r);
 }
 function startClock() {
  if (r.clock) return;
  let beats=0;r.clock=setInterval(()=>{if(session!==r)return;tick(r);if(++beats%40===0&&r.uplink?.open)r.uplink.send({type:'ping',sent:Date.now(),revision:r.state?.revision})},125)
 }
 function incoming(c) {if(!host){c.close();return}c.on('open',()=>{if(session!==r)return;const s=r.state;if(!s||Object.keys(s.names).length>=16){c.send({type:'reject',reason:'ルームが満員です。'});setTimeout(()=>c.close(),500);return}
 const requested = c.metadata?.nickname;
 const name = typeof requested === 'string' ? requested.trim() : '';
 if (!name || name.length > 20 || Object.values(s.names).includes(name)) {
  c.send({type:'reject', reason:'1〜20文字で、参加者と異なるニックネームを入力してください。'});
  setTimeout(() => c.close(), 500);
  return;
 }
 s.names[c.peer] = name;
 r.links.set(c.peer,c);
 const group = s.phase==='lobby' && s.ids.length<(s.capacity || 8) ? s.ids : s.spectators;
 group.push(c.peer);publish(r)});
 c.on('data',m=>{
  if (session !== r || r.links.get(c.peer) !== c) return;
  const state = r.state;
  if (m?.type === 'vote') { vote(r,c.peer,m.turn,m.choice); return; }
  if (m?.type === 'spectating') {
   setSpectating(r,c.peer,m.watch);
   return;
  }
  if (m?.type === 'laugh') {
   relayLaugh(r, c.peer, m.turn);
   return;
  }
  if (m && m.turn === state.serial && ['startTalk','finishTalk','nextTalk'].includes(m.type)) {
   turnAction(r, m.type, m.ok, c.peer);
  }
  if(c.open && m?.type==='ping' && Number.isFinite(m.sent)) {
   c.send({type:'pong',sent:m.sent,now:Date.now()});
   if(m.initial || m.revision !== r.state.revision) c.send({type:'state',s:r.state,now:Date.now()});
  }});
 const lost=()=>{if(session!==r||!r.links.delete(c.peer))return;if(r.state.spectators.includes(c.peer)){r.state.spectators=r.state.spectators.filter(id=>id!==c.peer);delete r.state.names[c.peer];if(r.state.phase==='judge')settleVotes(r);else publish(r);return}if(r.state.phase==='finished')return;delete r.state.names[c.peer];const index=r.state.ids.indexOf(c.peer);if(index>=0)removeTurn(r,index)};c.on('close',lost);c.on('error',lost)}
 const invitation = new URLSearchParams(location.hash.slice(1)).get('invite');
 if (!host && invitation && code === invitedRoom) {
  waiting('招待リンクの中継サービスに接続中…','中継サービスに接続できませんでした。ホストのロビーを開いたまま再試行してください。',25);
  InviteRelay.create(false,invitation,()=>{},()=>fail('中継サービスとの接続が切れました。'))
   .then(async relay => {
    if(session!==r){relay.destroy();return;}
    r.relay=relay;
    r.id=relay.id;
    const link=await relay.connect(nickname);
    wireGuest(link);
    startClock();
   }).catch(()=>fail('招待リンクの中継サービスに接続できませんでした。新しいリンクで再試行してください。'));
  return;
 }
 if (host) {
  r.relayPending=true;
  InviteRelay.create(true,null,incoming,()=>{
   if(session!==r)return;
   for(const c of [...r.links.values()]) if(c.peer.startsWith('relay-')) c.closeLink();
   r.relay?.destroy();r.relay=null;
   if(session===r && r.state?.phase==='lobby')show(r);
  }).then(relay=>{
   if(session!==r){relay.destroy();return;}
   r.relay=relay;
   openLobby();
  }).catch(()=>{}).finally(()=>{
   r.relayPending=false;
   if(session===r && r.state?.phase==='lobby')show(r);
  });
 }
 const options = {config:{iceServers:[
  {urls:['stun:stun.l.google.com:19302','stun:stun.cloudflare.com:3478']},
  {urls:['turn:eu-0.turn.peerjs.com:3478','turn:us-0.turn.peerjs.com:3478'],username:'peerjs',credential:'peerjsp'}
 ]}};
 try { r.peer=host ? new Peer(prefix+code,options) : new Peer(options); }
 catch { if(!host)fail('通信機能を起動できませんでした。'); return; }
 r.peer.on('error', e => {
  if (host && (r.relayPending || r.relay) && e.type !== 'unavailable-id') return;
  if (r.host && r.state && ['peer-unavailable','network'].includes(e.type)) return;
  const messages = {
   'unavailable-id':'ルームコードが重なりました。もう一度作成してください。',
   'peer-unavailable':'ルームが見つかりません。ホストがロビーを開いているか、最新の招待リンクかを確認してください。',
   'network':'接続サービスとの通信に失敗しました。通信環境を確認して再試行してください。'
  };
  fail(messages[e.type] || 'オンライン接続に失敗しました。通信環境を確認して再試行してください。');
 });
 r.peer.on('disconnected', () => {
  if (session === r && r.host && r.state && !r.peer.destroyed) {
   setTimeout(() => {
    if (session === r && r.peer.disconnected && !r.peer.destroyed) r.peer.reconnect();
   }, 1200);
  }
 });
 r.peer.on('open',()=>{if(session!==r)return;
 if(host){openLobby();return;}
 else{
 r.id=r.peer.id;
 waiting('ホストに接続中…','ホストとの通信経路を確立できませんでした。ホストのロビーを開いたまま、Wi-Fiとモバイル通信を切り替えて再試行してください。',18);
 wireGuest(r.peer.connect(prefix+code,{reliable:true,metadata:{nickname}}));}
 startClock();});
 r.peer.on('connection',incoming);
}
const invitedRoom = new URLSearchParams(location.search).get('room');
if (invitedRoom !== null) {
 if (/^\d{6}$/.test(invitedRoom)) {
  document.body.classList.add('invite-mode');
  document.querySelector('#online h2').textContent = '招待されたルームに参加';
  const homeLink = document.createElement('a');
  homeLink.href = location.pathname;
  homeLink.textContent = 'トップに戻る';
  $('online').append(homeLink);
  codeBox.value = invitedRoom;
  notice.textContent = 'ルーム ' + invitedRoom + ' への招待です。ニックネームを入力して「参加する」を押してください。';
  $('nickname').focus();
 } else {
  notice.textContent = '招待リンクのコードが正しくありません。6桁のルームコードを入力してください。';
  codeBox.focus();
 }
}
$('createRoom').onclick=()=>begin(true);$('joinRoom').onclick=()=>begin(false);
})();






