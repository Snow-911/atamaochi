'use strict';
(()=>{
const codeBox=$('roomCode'),notice=$('roomNotice'),prefix='atamaochi-v5-';
let session;
function leave(reason=''){const r=session;if(!r)return;session=null;clearInterval(r.clock);clearTimeout(r.timeout);r.peer?.destroy();setup.hidden=false;stage.hidden=true;notice.textContent=reason}
function show(r){if(session!==r)return;const s=r.state;stage.replaceChildren();
 const line=(tag,str)=>{const el=document.createElement(tag);el.textContent=str;stage.append(el);return el};
 const action=(label,fn)=>{const b=line('button',label);b.className='primary';b.onclick=fn};
 line('p','ルーム '+r.code+' ／ '+(r.host?'ホスト：':'あなた：')+s.names[r.peer.id]);
 const n=s.ids.length, speaker=s.names[s.ids[s.turn % n]];
 if(s.phase==='lobby'){
 line('h2','参加者を待っています');line('p',n+' / 8人参加中 ｜ 1人1トーク');
 line('p', 'トーク順：' + s.ids.map(id => s.names[id]).join(' → '));
 if(r.host){
 line('h3','ルーム設定');line('p','お題のジャンル（1つ以上）');const grid=line('div','');grid.className='grid';
 for(const g of Object.keys(bank)){const label=document.createElement('label'),input=document.createElement('input');label.className='tile';input.type='checkbox';input.checked=s.genres.includes(g);input.disabled=input.checked&&s.genres.length===1;input.onchange=()=>{s.genres=Object.keys(bank).filter(x=>x===g?input.checked:s.genres.includes(x));publish(r);stage.querySelectorAll('.tile input')[Object.keys(bank).indexOf(g)]?.focus()};label.append(input,document.createTextNode(g));grid.append(label)}
 line('h3','制限時間');const step=line('div','');step.className='stepper';for(const delta of [-10,10]){if(delta>0){const value=document.createElement('span');value.textContent=s.seconds+'秒';step.append(value)}const control=document.createElement('button');control.textContent=delta<0?'−':'＋';control.setAttribute('aria-label',delta<0?'10秒減らす':'10秒増やす');control.disabled=delta<0?s.seconds<=10:s.seconds>=600;control.onclick=()=>{s.seconds=Math.max(10,Math.min(600,s.seconds+delta));publish(r);stage.querySelectorAll('.stepper button')[delta<0?0:1]?.focus()};step.append(control)}
 line('p','開始すると設定が確定します。');if(n>=2)action('全員そろったら開始',()=>advance(r,'ready'))
 }else{line('p','制限時間：'+s.seconds+'秒');line('p','ジャンル：'+s.genres.join('・'));line('p','ホストが設定を変更すると、この画面にも反映されます。')}} else{if(s.phase!=='finished')line('p','トーク '+(s.turn+1)+' ／ '+speaker+' の番');
 if(s.phase==='ready'){line('p',s.prompt[0]);line('h2','「'+s.prompt[1]+'」');line('p',r.host?'お題を確認したら、トークを始めましょう。':'ホストがトークを開始するまでお待ちください。');if(r.host)action('トーク開始',()=>{s.end=Date.now()+s.seconds*1000;advance(r,'play')})}
 if(['play','judge'].includes(s.phase)){line('p',s.prompt[0]);line('h2','「'+s.prompt[1]+'」');if(s.phase==='play'){cue('start');r.gauge=makeGauge(stage,s.seconds);tick(r)}else{cue('end');line('p',r.host?'時間終了！ 判定してください。':'時間終了！ ホストが判定中です。');if(r.host)for(const [label,ok] of [['オチた',true],['オチなかった',false]])action(label,()=>{s.results.push(ok);advance(r,s.results.length===n?'finished':'result')})}}
 if(s.phase==='result'){line('h2',s.results.at(-1)?'オチた！ 成功':'オチなかった… 失敗');line('p','次は '+s.names[s.ids[(s.turn+1)%n]]+' の番です');if(r.host){action('次の人へ',()=>{s.turn++;advance(r,'ready')})}}
 if(s.phase==='finished'){line('h2','最終結果');line('p','最後のトーク：'+(s.results.at(-1)?'オチた！ 成功':'オチなかった… 失敗'));s.ids.forEach((_,i)=>{const turns=s.results.filter((v,j)=>j%n===i),wins=turns.filter(Boolean).length;line('p',s.names[s.ids[i]]+'：成功 '+wins+' 回 ／ 失敗 '+(turns.length-wins)+' 回')})}} line('hr','');const b=line('button',r.host?'ルームを閉じる':'退出する');b.onclick=()=>{if(confirm(r.host?'全員のルームを終了しますか？':'ルームを退出しますか？'))leave()};
}
function tick(r){const s=r.state;if(s?.phase!=='play')return;const left=r.gauge(s.end-Date.now()-r.offset);if(!left&&r.host)advance(r,'judge')}
function publish(r){for(const c of r.links.values())if(c.open)c.send({type:'state',s:r.state,now:Date.now()});show(r)}
function advance(r,phase){const s=r.state;if(phase==='ready'){if(!r.deck.length)r.deck=s.genres.flatMap(g=>bank[g].map(t=>[g,t]));s.prompt=r.deck.splice(Math.floor(Math.random()*r.deck.length),1)[0]}s.phase=phase;publish(r)}
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
 c.on('data',m=>{if(c.open&&r.links.has(c.peer)&&m?.type==='ping'&&Number.isFinite(m.sent))c.send({type:'pong',sent:m.sent,now:Date.now()})});
 const lost=()=>{if(session!==r||!r.links.delete(c.peer))return;if(r.state.phase==='finished')return;if(r.state.phase!=='lobby'){fail('参加者が退出したため、ルームを終了しました。');return}delete r.state.names[c.peer];r.state.ids=r.state.ids.filter(id=>id!==c.peer);publish(r)};c.on('close',lost);c.on('error',lost)});
}
$('createRoom').onclick=()=>begin(true);$('joinRoom').onclick=()=>begin(false);
})();





