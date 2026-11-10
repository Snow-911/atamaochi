const bank={
学校: [
  "卒業式の日、私の机にだけ箱があって、",
  "授業中に先生のスマホが鳴ったんだけど、",
  "給食のおかわりに並んだら、",
  "朝の放送で急に名前を呼ばれて、",
  "文化祭で誰もやりたがらない係を引き受けたんだけど、",
  "席替えの日、隣の席の子が小声で、",
  "修学旅行で朝いちばんに目を覚ましたら、",
  "テストの裏に落書きしたのをすっかり忘れてて、",
  "放課後、忘れ物を取りに教室へ戻ったら、",
  "同窓会で昔のあだ名を呼んだら、"
],
仕事: [
  "初出勤で案内された席が、",
  "会議で画面を共有した瞬間、",
  "上司に『ちょっと貸して』って言われて、",
  "名刺交換した相手の肩書きが、",
  "新人さんに仕事のコツを教えてたんだけど、",
  "お昼にいつもの定食を頼もうとしたら、隣の席に、",
  "出張の荷造りは完璧だったはずなのに、",
  "退勤ぎりぎりに一本だけ電話を取ったら、",
  "休憩室の冷蔵庫に名前を書いてプリンを入れたんだけど、",
  "送別会でひと言お願いされて、立ち上がったら、"
],
恋人: [
  "初デートの待ち合わせ場所に着いたら、",
  "記念日に同じサイズの包みを渡し合って、",
  "寝言で知らない名前を呼ばれて、",
  "恋人が『目を閉じて』と言うから、",
  "二人で初めて料理を作ったときの話なんだけど、",
  "相手の実家にあいさつに行く途中で、",
  "けんかの仲直りに短い手紙を書いたんだけど、",
  "デートの予定を丸一日任せてって言われて、",
  "昔の写真を一緒に見てたら、一枚だけ、",
  "おそろいの物を買おうって店に入ったんだけど、"
],
スポーツ: [
  "バトンを受け取るはずの手に、",
  "始球式に呼ばれたのに、",
  "監督が最後に出したサインが、",
  "借り物競走で引いた紙には、",
  "初めてジムに行って、隣の人のまねをしたら、",
  "草野球で急に代打を頼まれて、",
  "マラソンの途中で沿道から自分の名前が聞こえて、",
  "勝った瞬間のポーズを前の日から練習してたんだけど、",
  "試合の応援に行ったら、隣の席の人が、",
  "久しぶりに泳ごうと思ってプールに行ったら、"
],
ゲーム: [
  "ラスボスの部屋に入ったら、",
  "ボイスチャットを切ったつもりで、",
  "ガチャの演出がいつもと違って、",
  "村人全員に話しかけたら最後の一人が、",
  "キャラの名前を適当につけたまま進めたら、",
  "友達にコントローラーを渡して一分だけ席を外したら、",
  "チュートリアルを飛ばしたツケが回ってきたのが、",
  "ゲームで道に迷って、地図に自分で印をつけたんだけど、",
  "最後まで使わずに取っておいたアイテムがあって、",
  "家族にルールを教えながら対戦してたら、"
],
友達: [
  "久しぶりに会った友達が開口一番、",
  "友達に留守番を頼んで帰ってきたら、",
  "グループ写真を拡大したら、",
  "親友が『絶対に笑わないで』って、",
  "待ち合わせに遅れそうで『もうすぐ着く』って送ったら、",
  "友達の引っ越しを手伝ってたら、懐かしい物が出てきて、",
  "ノープランで日帰り旅行に出たんだけど、",
  "誕生日のサプライズで私が任されたのが、",
  "友達に貸した本が久しぶりに戻ってきて、開いたら、",
  "『いつもの店で』って約束して、先に着いたつもりが、"
],
R18: [
  "大人のお店でポイントカードを出したら、",
  "今夜は勝負だと思って着替えたら、",
  "ちょっと際どいメッセージの宛先が、",
  "秘密の引き出しを開けた瞬間、",
  "この前ホテル行ったときの話なんだけど、",
  "いい雰囲気になって照明を暗くしようとしたら、",
  "勝負下着を洗濯した日に限って、",
  "二人きりで見る映画をタイトルだけで選んだら、",
  "耳元で甘いことを言おうとしたんだけど、",
  "お泊まりの翌朝、相手がベッドの下をのぞいてて、"
],
政治: [
  "もし一日だけ市長になれたらって聞かれて、",
  "街頭演説でマイクを握った瞬間、",
  "架空の党の公約を考えていたら、",
  "町内の選挙で一票差をつけたのが、",
  "家族で選挙の話をしてたら、おばあちゃんが突然、",
  "投票所で初めて受付を手伝ったんだけど、",
  "駅前で候補者と握手したあと、ふと自分の手を見たら、",
  "市議会の傍聴に誘われて、軽い気持ちで行ったら、",
  "町の予算の使い道を一つ提案していいって言われて、",
  "選挙ポスターを見てた子どもに聞かれたのが、"
]};
const $=id=>document.getElementById(id);const setup=$('setup'),stage=$('stage'),start=$('start');
Object.keys(bank).forEach((g,i)=>$('genres').insertAdjacentHTML('beforeend','<label class="tile"><input type="checkbox" value="'+g+'" '+(i<6?'checked':'')+'>'+g+'</label>'));
for (const [genre, prompts] of Object.entries(bank)) {
 const heading = document.createElement('h3');
 heading.textContent = genre;
 const list = document.createElement('ul');
 for (const prompt of prompts) {
  const item = document.createElement('li');
  item.textContent = prompt;
  list.append(item);
 }
 $('topics').append(heading, list);
}
function orderButton(text, description, disabled, click) {
 const button = document.createElement('button');
 button.type = 'button';
 button.textContent = text;
 button.setAttribute('aria-label', description);
 button.disabled = disabled;
 button.onclick = click;
 return button;
}
function addOrderControls(row, index, order, label, update) {
 for (const offset of [-1, 1]) {
  const destination = index + offset;
  const earlier = offset < 0;
  row.append(orderButton(earlier ? '↑' : '↓', label + (earlier ? 'を前へ' : 'を後ろへ'),
   destination < 0 || destination >= order.length, () => {
    const next = order.slice();
    [next[index], next[destination]] = [next[destination], next[index]];
    update(next);
   }));
 }
}
function shuffleButton(order, update) {
 return orderButton('シャッフル', 'トーク順をシャッフル', order.length < 2, () => {
  const next = order.slice();
  do {
   for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
   }
  } while (next.every((value, i) => value === order[i]));
  update(next);
 });
}
const localNames = [];
function renderLocalNames() {
 const count = Number($('players').value);
 const fields = $('localNames');
 fields.replaceChildren();
 if (count === 1) return;
 const order = Array.from({length: count}, (_, index) => index);
 function reorder(indices) {
  const values = indices.map(index => localNames[index]);
  localNames.splice(0, count, ...values);
  renderLocalNames();
 }
 for (let i = 0; i < count; i++) {
  const row = document.createElement('div');
  row.className = 'order-row';
  const label = document.createElement('label');
  label.textContent = (i + 1) + '人目のニックネーム ';
  const input = document.createElement('input');
  input.maxLength = 20;
  input.required = true;
  input.value = localNames[i] || '';
  input.oninput = () => { localNames[i] = input.value.trim(); };
  label.append(input);
  row.append(label);
  addOrderControls(row, i, order, (i + 1) + '人目', reorder);
  fields.append(row);
 }
 fields.append(shuffleButton(order, reorder));
}
$('players').addEventListener('change', renderLocalNames);
function localName(number) {
 return count === 1 ? 'プレイヤー 1' : localNames[number - 1];
}
function escapedName(number) {
 const node = document.createElement('span');
 node.textContent = localName(number);
 return node.innerHTML;
}
let duration=60;
function adjust(n){duration=Math.max(10,Math.min(600,duration+n));$('sec').textContent=duration+'秒';$('less').disabled=duration===10;$('more').disabled=duration===600}
$('less').onclick=()=>adjust(-10);$('more').onclick=()=>adjust(10);
for(let n=1;n<=8;n++)$('players').add(new Option(n+'人',n));
const chosen=()=>Array.from(document.querySelectorAll('#genres input:checked'),e=>e.value);
$('genres').onchange=()=>{start.disabled=!chosen().length;start.textContent=start.disabled?'ジャンルを1つ以上選んでください':'ゲーム開始 ▶'};
let pool,deck,last,log,count,secs,timer;
function screen(html){stage.innerHTML=html;stage.focus()}
function button(label,fn,primary=true){const b=document.createElement('button');b.textContent=label;if(primary)b.className='primary';(stage.querySelector('.actions')||stage).append(b);b.onclick=fn}
start.onclick=()=>{
 for (const field of $('localNames').querySelectorAll('input')) {
  field.setCustomValidity(field.value.trim() ? '' : 'ニックネームを入力してください。');
  if (!field.reportValidity()) return;
 }
 pool=chosen().flatMap(g=>bank[g].map(t=>({g,t})));deck=[];log=[];last=null;count=+$('players').value;secs=duration;setup.hidden=true;stage.hidden=false;ready()};
const who=()=>log.length%count+1, info=()=>'トーク '+(log.length+1);
function ready(){if(!deck.length){deck=[...pool];for(let i=deck.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]}if(deck.at(-1)===last)deck.reverse()}last=deck.pop();screen('<p>'+info()+' ／ '+escapedName(who())+' ／ '+last.g+'</p><h2>「'+last.t+'」</h2><p>お題を確認したら、トークを始めましょう。</p>');button('トーク開始',startCountdown)}
function startCountdown() {
 screen('<h2>「'+last.t+'」</h2>');
 const startAt = Date.now() + 3000;
 const display = makeCountdown(stage);
 function update() {
  if (!display(startAt - Date.now())) {
   clearInterval(timer);
   play(startAt);
  }
 }
 timer = setInterval(update, 50);
 update();
}
function play(startAt) {
 cue('start');
 screen('<p>'+info()+' ／ '+escapedName(who())+' ／ '+last.g+'</p><h2>「'+last.t+'」</h2>');
 const gauge = makeGauge(stage, secs);
 const deadline = startAt + secs * 1000;
 let finished = false;
 function finishTalk() {
  if (finished) return;
  finished = true;
  clearInterval(timer);
  cue('end');
  screen('<p>トーク終了 ／ '+escapedName(who())+'</p><h2>オチはついた？</h2><p>「'+last.t+'」</p><div class="actions"></div>');
  button('オチた', () => score(true));
  button('オチなかった', () => score(false), false);
 }
 button('オチを言い終えた', finishTalk);
 function tick() { if (!gauge(deadline - Date.now())) finishTalk(); }
 timer = setInterval(tick, 150);
 tick();
}
function score(ok){log.push({p:who(),ok});if(count>1&&log.length===count){finish();return}screen('<h2>'+(ok?'オチた！ 成功':'オチなかった… 失敗')+'</h2><div class="actions"></div>');button('次へ：'+localName(who()),ready);if(count===1)button('ゲーム終了',finish,false)}
function finish(){screen('<h2>ゲーム結果</h2><p>最後のトーク：'+(log.at(-1).ok?'成功':'失敗')+'</p><ul>'+Array.from({length:count},(_,i)=>{const turns=log.filter(x=>x.p===i+1),wins=turns.filter(x=>x.ok).length;return '<li>'+escapedName(i+1)+'：成功 '+wins+' 回 ／ 失敗 '+(turns.length-wins)+' 回</li>'}).join('')+'</ul>');button('設定に戻る',()=>{stage.hidden=true;setup.hidden=false;start.focus()})}


