'use strict';
(()=>{
const codeBox=$('roomCode'),notice=$('roomNotice'),prefix='atamaochi-v6-';
let session;
function addInviteLink(code) {
 const url = new URL('https://snow-911.github.io/atamaochi/');
 url.searchParams.set('room', code);
 const copy = document.createElement('button');
 copy.textContent = '招待リンクをコピー';
 const status = document.createElement('span');
 status.setAttribute('role', 'status');
 copy.onclick = async () => {
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
 stage.append(copy, status);
}
function leave(reason=''){const r=session;if(!r)return;session=null;$('roster').hidden=true;clearInterval(r.clock);clearTimeout(r.timeout);r.peer?.destroy();setup.hidden=false;stage.hidden=true;notice.textContent=reason}
function kick(r, id) {
 const s = r.state, index = s.ids.indexOf(id);
 if (!r.host || index < 0 || id === r.peer.id || !confirm(s.names[id] + 'さんを退出させますか？')) return;
 const connection = r.links.get(id);
 r.links.delete(id);
 if (connection?.open) {
  connection.send({type:'reject', reason:'ホストによって退出しました。'});
  setTimeout(() => connection.close(), 300);
 }
 const current = index === s.turn;
 s.ids.splice(index, 1);
 delete s.names[id];
 if (index < s.results.length) s.results.splice(index, 1);
 if (index < s.turn) s.turn--;
 if (s.phase !== 'lobby') {
  if (s.results.length === s.ids.length) return advance(r, 'finished');
  if (current) return advance(r, 'ready');
 }
 publish(r);
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
  if (editable) addOrderControls(row, index, s.ids, s.names[id], reorder);
  if (r.host && id !== r.peer.id && s.phase !== 'finished')
   row.append(orderButton('キック', s.names[id]+'をキック', false, () => kick(r,id)));
  roster.append(row);
 });
 if (editable) roster.append(shuffleButton(s.ids, reorder));
}
function turnAction(r, type, ok) {
 const s = r.state;
 if (!r.host) {
  if (r.uplink?.open) r.uplink.send({type, turn:s.serial, ok});
  return;
 }
 if (type === 'startTalk' && s.phase === 'ready') {
  s.startAt = Date.now() + 3000;
  s.end = s.startAt + s.seconds * 1000;
  advance(r, 'countdown');
 } else if (type === 'finishTalk' && s.phase === 'play') {
  advance(r, 'judge');
 } else if (type === 'judgeTalk' && s.phase === 'judge' && typeof ok === 'boolean') {
  s.results.push(ok);
  advance(r, s.results.length === s.ids.length ? 'finished' : 'result');
 }
}
function show(r){if(session!==r)return;const s=r.state;stage.replaceChildren();showRoster(r);
 const line=(tag,str)=>{const el=document.createElement(tag);el.textContent=str;stage.append(el);return el};
 const action=(label,fn)=>{const b=line('button',label);b.className='primary';b.onclick=fn};

 const n=s.ids.length, speaker=s.names[s.ids[s.turn % n]];
 if(s.phase==='lobby'){
 line('h2','参加者を待っています');line('p',n+' / 8人参加中 ｜ 1人1トーク');
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
 line('h3','ルーム設定');line('p','お題のジャンル（1つ以上）');const grid=line('div','');grid.className='grid';
 for(const g of Object.keys(bank)){const label=document.createElement('label'),input=document.createElement('input');label.className='tile';input.type='checkbox';input.checked=s.genres.includes(g);input.disabled=input.checked&&s.genres.length===1;input.onchange=()=>{s.genres=Object.keys(bank).filter(x=>x===g?input.checked:s.genres.includes(x));publish(r);stage.querySelectorAll('.tile input')[Object.keys(bank).indexOf(g)]?.focus()};label.append(input,document.createTextNode(g));grid.append(label)}
 line('h3','制限時間');const step=line('div','');step.className='stepper';for(const delta of [-10,10]){if(delta>0){const value=document.createElement('span');value.textContent=s.seconds+'秒';step.append(value)}const control=document.createElement('button');control.textContent=delta<0?'−':'＋';control.setAttribute('aria-label',delta<0?'10秒減らす':'10秒増やす');control.disabled=delta<0?s.seconds<=10:s.seconds>=600;control.onclick=()=>{s.seconds=Math.max(10,Math.min(600,s.seconds+delta));publish(r);stage.querySelectorAll('.stepper button')[delta<0?0:1]?.focus()};step.append(control)}
 line('p','開始すると設定が確定します。');if(n>=2)action('全員そろったら開始',()=>advance(r,'ready'))
 }else{line('p','制限時間：'+s.seconds+'秒');line('p','ジャンル：'+s.genres.join('・'));line('p','ホストが設定を変更すると、この画面にも反映されます。')}} else{if(s.phase!=='finished')line('p','トーク '+(s.turn+1)+' ／ '+speaker+' の番');
 const canAct = r.host || s.ids[s.turn] === r.peer.id;
 if (['ready','countdown','play','judge'].includes(s.phase)) {
  line('p', s.prompt[0]);
  line('h2', '「'+s.prompt[1]+'」');
 }
 if (s.phase === 'ready') {
  if (canAct) action('トーク開始', () => turnAction(r,'startTalk'));
  else line('p', speaker+'さんの開始を待っています。');
 }
 if (s.phase === 'countdown') {
  r.countdown = makeCountdown(stage);
  tick(r);
 }
 if (s.phase === 'play') {
  if (r.lastCue !== 'start'+s.serial) { cue('start'); r.lastCue = 'start'+s.serial; }
  r.gauge = makeGauge(stage,s.seconds);
  if (canAct) action('オチを言い終えた', () => turnAction(r,'finishTalk'));
  tick(r);
 }
 if (s.phase === 'judge') {
  if (r.lastCue !== 'end'+s.serial) { cue('end'); r.lastCue = 'end'+s.serial; }
  if (canAct) {
   line('p','トーク終了！ 判定してください。');
   action('オチた', () => turnAction(r,'judgeTalk',true));
   action('オチなかった', () => turnAction(r,'judgeTalk',false));
  } else line('p','トーク終了！ 判定を待っています。');
 }
 if(s.phase==='result'){line('h2',s.results.at(-1)?'オチた！ 成功':'オチなかった… 失敗');line('p','次は '+s.names[s.ids[(s.turn+1)%n]]+' の番です');if(r.host){action('次の人へ',()=>{s.turn++;advance(r,'ready')})}}
 if(s.phase==='finished'){line('h2','最終結果');line('p','6秒後にロビーへ戻ります。');line('p','最後のトーク：'+(s.results.at(-1)?'オチた！ 成功':'オチなかった… 失敗'));s.ids.forEach((_,i)=>{const turns=s.results.filter((v,j)=>j%n===i),wins=turns.filter(Boolean).length;line('p',s.names[s.ids[i]]+'：成功 '+wins+' 回 ／ 失敗 '+(turns.length-wins)+' 回')})}} line('hr','');const b=line('button',r.host?'ルームを閉じる':'退出する');b.onclick=()=>{if(confirm(r.host?'全員のルームを終了しますか？':'ルームを退出しますか？'))leave()};
}
function tick(r){const s=r.state;if(s?.phase==='countdown'){if(!r.countdown(s.startAt-Date.now()-r.offset)&&r.host)advance(r,'play');return}if(s?.phase!=='play')return;const left=r.gauge(s.end-Date.now()-r.offset);if(!left&&r.host)advance(r,'judge')}
function publish(r){for(const c of r.links.values())if(c.open)c.send({type:'state',s:r.state,now:Date.now()});show(r)}
function advance(r,phase){const s=r.state;if(phase==='ready'){s.serial=(s.serial||0)+1;if(!r.deck.length)r.deck=s.genres.flatMap(g=>bank[g].map(t=>[g,t]));s.prompt=r.deck.splice(Math.floor(Math.random()*r.deck.length),1)[0]}s.phase=phase;
 if (phase === 'finished') {
  setTimeout(() => {
   if (session !== r || s.phase !== 'finished') return;
   s.ids = s.ids.filter(id => id === r.peer.id || r.links.has(id));
   for (const id of Object.keys(s.names)) {
    if (!s.ids.includes(id)) delete s.names[id];
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
 const r=session={host,code,links:new Map(),deck:[],offset:0};setup.hidden=true;stage.hidden=false;screen('<h2>ルームに接続中…</h2>');button('キャンセル',()=>leave());
 const fail=msg=>{if(session===r)leave(msg)};
 r.timeout=setTimeout(()=>fail('接続できませんでした。コードと通信環境を確認してください。'),20000);
 try{r.peer=host?new Peer(prefix+code):new Peer()}catch{fail('通信機能を起動できませんでした。');return}
 r.peer.on('error',e=>fail(e.type==='unavailable-id'?'コードが重なりました。もう一度作成してください。':'接続できませんでした。ホストの画面とルームコードを確認してください。'));
 r.peer.on('open',()=>{if(session!==r)return;
 if(host){clearTimeout(r.timeout);r.state={phase:'lobby',seconds:duration,genres:chosen(),ids:[r.peer.id],names:{[r.peer.id]:nickname},turn:0,results:[]};show(r)}
 else{const c=r.peer.connect(prefix+code,{reliable:true,metadata:{nickname}});c.on('data',m=>{if(session!==r)return;if(m.type==='reject'){fail(m.reason);return}if(m.type==='pong'){r.offset=m.now-(Date.now()+m.sent)/2;return}if(m.type!=='state')return;clearTimeout(r.timeout);if(!r.state)r.offset=m.now-Date.now();r.state=m.s;show(r)});c.on('open',()=>c.send({type:'ping',sent:Date.now()}));c.on('close',()=>{if(r.state?.phase!=='finished')fail('ホストとの接続が終了しました。')});c.on('error',()=>fail('ホストとの通信が切れました。'));r.uplink=c}
 let beats=0;r.clock=setInterval(()=>{if(session!==r)return;tick(r);if(++beats%40===0&&r.uplink?.open)r.uplink.send({type:'ping',sent:Date.now()})},125)});
 r.peer.on('connection',c=>{if(!host){c.close();return}c.on('open',()=>{if(session!==r)return;const s=r.state;if(!s||s.phase!=='lobby'||s.ids.length>=8){c.send({type:'reject',reason:'満員またはゲーム開始後のため参加できません。'});setTimeout(()=>c.close(),500);return}
 const requested = c.metadata?.nickname;
 const name = typeof requested === 'string' ? requested.trim() : '';
 if (!name || name.length > 20 || s.ids.some(id => s.names[id] === name)) {
  c.send({type:'reject', reason:'1〜20文字で、参加者と異なるニックネームを入力してください。'});
  setTimeout(() => c.close(), 500);
  return;
 }
 s.names[c.peer] = name;
 r.links.set(c.peer,c);s.ids.push(c.peer);publish(r)});
 c.on('data',m=>{
  if (session !== r || r.links.get(c.peer) !== c) return;
  const state = r.state;
  if (m && m.turn === state.serial && c.peer === state.ids[state.turn]) {
   turnAction(r, m.type, m.ok);
  }
  if(c.open&&r.links.has(c.peer)&&m?.type==='ping'&&Number.isFinite(m.sent))c.send({type:'pong',sent:m.sent,now:Date.now()})});
 const lost=()=>{if(session!==r||!r.links.delete(c.peer))return;if(r.state.phase==='finished')return;if(r.state.phase!=='lobby'){fail('参加者が退出したため、ルームを終了しました。');return}delete r.state.names[c.peer];r.state.ids=r.state.ids.filter(id=>id!==c.peer);publish(r)};c.on('close',lost);c.on('error',lost)});
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






