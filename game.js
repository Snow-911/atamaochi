const bank={
学校:["卒業式の日、私の机にだけ箱があって、","授業中に先生のスマホが鳴ったんだけど、","給食のおかわりに並んだら、","朝の放送で急に名前を呼ばれて、"],
仕事:["初出勤で案内された席が、","会議で画面を共有した瞬間、","上司に『ちょっと貸して』って言われて、","名刺交換した相手の肩書きが、"],
恋人:["初デートの待ち合わせ場所に着いたら、","記念日に同じサイズの包みを渡し合って、","寝言で知らない名前を呼ばれて、","恋人が『目を閉じて』と言うから、"],
スポーツ:["バトンを受け取るはずの手に、","始球式に呼ばれたのに、","監督が最後に出したサインが、","借り物競走で引いた紙には、"],
ゲーム:["ラスボスの部屋に入ったら、","ボイスチャットを切ったつもりで、","ガチャの演出がいつもと違って、","村人全員に話しかけたら最後の一人が、"],
友達:["久しぶりに会った友達が開口一番、","友達に留守番を頼んで帰ってきたら、","グループ写真を拡大したら、","親友が『絶対に笑わないで』って、"],
R18:["大人のお店でポイントカードを出したら、","今夜は勝負だと思って着替えたら、","ちょっと際どいメッセージの宛先が、","秘密の引き出しを開けた瞬間、"],
政治:["もし一日だけ市長になれたらって聞かれて、","街頭演説でマイクを握った瞬間、","架空の党の公約を考えていたら、","町内の選挙で一票差をつけたのが、"]};
const $=id=>document.getElementById(id);const setup=$('setup'),stage=$('stage'),start=$('start');
Object.keys(bank).forEach((g,i)=>$('genres').insertAdjacentHTML('beforeend','<label class="tile"><input type="checkbox" value="'+g+'" '+(i<6?'checked':'')+'>'+g+'</label>'));
for(const [id,values,suffix,def] of [['sec',[15,30,60,90,120],'秒',60],['round',[1,2,3,5,10],'回',3],['players',[1,2,3,4,5,6,7,8],'人',1]])for(const n of values)$(id).add(new Option(n+suffix,n,false,n===def));
const chosen=()=>Array.from(document.querySelectorAll('input:checked'),e=>e.value);
$('genres').onchange=()=>{start.disabled=!chosen().length;start.textContent=start.disabled?'ジャンルを1つ以上選んでください':'ゲーム開始 ▶'};
let pool,deck,last,log,count,rounds,secs,timer;
function screen(html){stage.innerHTML=html;stage.focus()}
function button(label,fn,primary=true){const b=document.createElement('button');b.textContent=label;if(primary)b.className='primary';(stage.querySelector('.actions')||stage).append(b);b.onclick=fn}
start.onclick=()=>{pool=chosen().flatMap(g=>bank[g].map(t=>({g,t})));deck=[];log=[];last=null;count=+$('players').value;rounds=+$('round').value;secs=+$('sec').value;setup.hidden=true;stage.hidden=false;ready()};
const who=()=>log.length%count+1, info=()=>'ラウンド '+(1+Math.floor(log.length/count))+' / '+rounds;
function ready(){if(!deck.length){deck=[...pool];for(let i=deck.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]}if(deck.at(-1)===last)deck.reverse()}last=deck.pop();screen('<p>'+info()+' ／ プレイヤー '+who()+' ／ '+last.g+'</p><h2>「'+last.t+'」</h2><p>お題を確認したら、トークを始めましょう。</p>');button('トーク開始',play)}
function play(){cue('start');screen('<p>'+info()+' ／ プレイヤー '+who()+' ／ '+last.g+'</p><h2>「'+last.t+'」</h2>');const gauge=makeGauge(stage,secs),end=Date.now()+secs*1000;function tick(){const left=gauge(end-Date.now());if(!left){clearInterval(timer);cue('end');screen('<p>時間終了 ／ プレイヤー '+who()+'</p><h2>オチはついた？</h2><p>「'+last.t+'」</p><div class="actions"></div>');button('オチた',()=>score(true));button('オチなかった',()=>score(false),false)}}timer=setInterval(tick,150);tick()}
function score(ok){log.push({p:who(),ok});if(log.length<count*rounds){screen('<h2>'+(ok?'成功！':'失敗！')+'</h2>');button('次の番へ',ready);return}screen('<p>全ラウンド終了</p><h2>ゲーム結果</h2><p>最後のトーク：'+(ok?'成功':'失敗')+'</p><ul>'+Array.from({length:count},(_,i)=>{const wins=log.filter(x=>x.p===i+1&&x.ok).length;return '<li>プレイヤー '+(i+1)+'：成功 '+wins+' 回 ／ 失敗 '+(rounds-wins)+' 回</li>'}).join('')+'</ul>');button('設定に戻る',()=>{stage.hidden=true;setup.hidden=false;start.focus()})}

