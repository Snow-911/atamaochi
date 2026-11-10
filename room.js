'use strict';
(()=>{
const codeBox=$('roomCode'),notice=$('roomNotice'),prefix='atamaochi-v2-';
let session;
function leave(reason=''){const r=session;if(!r)return;session=null;clearInterval(r.clock);clearTimeout(r.timeout);r.peer?.destroy();setup.hidden=false;stage.hidden=true;notice.textContent=reason}
function show(r){if(session!==r)return;const s=r.state;stage.replaceChildren();
 const line=(tag,str)=>{const el=document.createElement(tag);el.textContent=str;stage.append(el);return el};
 const action=(label,fn)=>{const b=line('button',label);b.className='primary';b.onclick=fn};
 line('p','ルーム '+r.code+' ／ '+(r.host?'ホスト':'プレイヤー '+(s.ids.indexOf(r.peer.id)+1)));
 const n=s.ids.length, speaker=s.turn%n+1;
 if(s.phase==='lobby'){line('h2','参加者を待っています');line('p',n+' / 8人参加中 ｜ '+s.seconds+'秒 × '+s.rounds+'ラウンド');line('p',s.genres.join('・'));if(r.host&&n>=2)action('全員そろったら開始',()=>advance(r,'ready'))}
 else{line('p','ラウンド '+(Math.floor(s.turn/n)+1)+' / '+s.rounds+' ／ プレイヤー '+speaker+' の番');
 if(s.phase==='ready'){line('p',s.prompt[0]);line('h2','「'+s.prompt[1]+'」');line('p',r.host?'お題を確認したら、トークを始めましょう。':'ホストがトークを開始するまでお待ちください。');if(r.host)action('トーク開始',()=>{s.end=Date.now()+s.seconds*1000;advance(r,'play')})}
 if(['play','judge'].includes(s.phase)){line('p',s.prompt[0]);line('h2','「'+s.prompt[1]+'」');if(s.phase==='play'){cue('start');r.gauge=makeGauge(stage,s.seconds);tick(r)}else{cue('end');line('p',r.host?'時間終了！ 判定してください。':'時間終了！ ホストが判定中です。');if(r.host)for(const [label,ok] of [['オチた',true],['オチなかった',false]])action(label,()=>{s.results.push(ok);advance(r,'result')})}}
 if(s.phase==='result'){line('h2',s.results.at(-1)?'オチた！ 成功':'オチなかった… 失敗');if(s.turn+1===n*s.rounds){line('h3','最終結果');s.ids.forEach((_,i)=>line('p','プレイヤー '+(i+1)+'：成功 '+s.results.filter((v,j)=>v&&j%n===i).length+' / '+s.rounds+'回'))}else if(r.host)action('次の番へ',()=>{s.turn++;advance(r,'ready')})}}
 line('hr','');const b=line('button',r.host?'ルームを閉じる':'退出する');b.onclick=()=>{if(confirm(r.host?'全員のルームを終了しますか？':'ルームを退出しますか？'))leave()};
}
function tick(r){const s=r.state;if(s?.phase!=='play')return;const left=r.gauge(s.end-Date.now()-r.offset);if(!left&&r.host)advance(r,'judge')}
function publish(r){for(const c of r.links.values())if(c.open)c.send({type:'state',s:r.state,now:Date.now()});show(r)}
function advance(r,phase){const s=r.state;if(phase==='ready'){if(!r.deck.length)r.deck=s.genres.flatMap(g=>bank[g].map(t=>[g,t]));s.prompt=r.deck.splice(Math.floor(Math.random()*r.deck.length),1)[0]}s.phase=phase;publish(r)}
function begin(host){if(session)return;const code=host?String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,'0'):codeBox.value.trim();
 if(!/^\d{6}$/.test(code)){notice.textContent='6桁のコードを入力してください。';return}
 if(host&&!chosen().length){notice.textContent='ジャンルを選んでください。';return}
 const r=session={host,code,links:new Map(),deck:[],offset:0};setup.hidden=true;stage.hidden=false;screen('<h2>ルームに接続中…</h2>');button('キャンセル',()=>leave());
 const fail=msg=>{if(session===r)leave(msg)};
 r.timeout=setTimeout(()=>fail('接続できませんでした。コードと通信環境を確認してください。'),20000);
 try{r.peer=host?new Peer(prefix+code):new Peer()}catch{fail('通信機能を起動できませんでした。');return}
 r.peer.on('error',e=>fail(e.type==='unavailable-id'?'コードが重なりました。もう一度作成してください。':'接続できませんでした。ホストの画面とルームコードを確認してください。'));
 r.peer.on('open',()=>{if(session!==r)return;
 if(host){clearTimeout(r.timeout);r.state={phase:'lobby',seconds:+$('sec').value,rounds:+$('round').value,genres:chosen(),ids:[r.peer.id],turn:0,results:[]};show(r)}
 else{const c=r.peer.connect(prefix+code,{reliable:true});c.on('data',m=>{if(session!==r)return;if(m.type==='reject'){fail(m.reason);return}if(m.type==='pong'){r.offset=m.now-(Date.now()+m.sent)/2;return}if(m.type!=='state')return;clearTimeout(r.timeout);if(!r.state)r.offset=m.now-Date.now();r.state=m.s;show(r)});c.on('open',()=>c.send({type:'ping',sent:Date.now()}));c.on('close',()=>fail('ホストとの接続が終了しました。'));c.on('error',()=>fail('ホストとの通信が切れました。'));r.uplink=c}
 let beats=0;r.clock=setInterval(()=>{if(session!==r)return;tick(r);if(++beats%40===0&&r.uplink?.open)r.uplink.send({type:'ping',sent:Date.now()})},125)});
 r.peer.on('connection',c=>{if(!host){c.close();return}c.on('open',()=>{if(session!==r)return;const s=r.state;if(!s||s.phase!=='lobby'||s.ids.length>=8){c.send({type:'reject',reason:'満員またはゲーム開始後のため参加できません。'});setTimeout(()=>c.close(),500);return}r.links.set(c.peer,c);s.ids.push(c.peer);publish(r)});
 c.on('data',m=>{if(c.open&&r.links.has(c.peer)&&m?.type==='ping'&&Number.isFinite(m.sent))c.send({type:'pong',sent:m.sent,now:Date.now()})});
 const lost=()=>{if(session!==r||!r.links.delete(c.peer))return;if(r.state.phase!=='lobby'){fail('参加者が退出したため、ルームを終了しました。');return}r.state.ids=r.state.ids.filter(id=>id!==c.peer);publish(r)};c.on('close',lost);c.on('error',lost)});
}
$('createRoom').onclick=()=>begin(true);$('joinRoom').onclick=()=>begin(false);
})();

