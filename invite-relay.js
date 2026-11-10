// Private invite transport over MQTT/WebSocket. The broker sees routing tokens and
// ephemeral public guest keys. Game messages use a separate AES key per guest.
const InviteRelay = (() => {
 const broker = 'wss://broker.emqx.io:8084/mqtt';
 const encode = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
 const decode = str => Uint8Array.from(atob(str.replaceAll('-','+').replaceAll('_','/')), c => c.charCodeAt(0));
 const utf8 = new TextEncoder();
 const ec = {name:'ECDH', namedCurve:'P-256'};
 class Link {
  constructor(peer, key, sender, sendPacket, closeLink) {
   this.sender = sender; this.peer = peer; this.key = key; this.sendPacket = sendPacket; this.closeLink = closeLink;
   this.handlers = new Map(); this.open = false; this.sent = 0; this.received = 0;
   this.queue = Promise.resolve(); this.lastSeen = Date.now();
  }
  on(type, cb) { this.handlers.set(type, cb); }
  emit(type, value) { this.handlers.get(type)?.(value); }
  packet(type, data) {
   const sequence = ++this.sent;
   this.queue = this.queue.then(async () => {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({name:'AES-GCM', iv, additionalData:utf8.encode(this.sender)}, this.key,
     utf8.encode(JSON.stringify({type,data,sequence})));
    this.sendPacket({iv:encode(iv), body:encode(encrypted)});
   }).catch(() => this.closeLink());
  }
  send(data) { if (this.open) this.packet('data', data); }
  close() { this.packet('bye'); this.closeLink(); }
 }
 async function create(host, invite, incoming, onFailure) {
  const pair = await crypto.subtle.generateKey(ec, true, ['deriveBits']);
  const own = encode(await crypto.subtle.exportKey('raw', pair.publicKey));
  const [hostKey, secret] = host ? [own,encode(crypto.getRandomValues(new Uint8Array(32)))] : invite.split('.');
  if (!/^[A-Za-z0-9_-]{43}$/.test(secret)) throw Error('Invalid invitation');
  if (!/^[A-Za-z0-9_-]{87}$/.test(hostKey)) throw Error('Invalid invitation');
  const digest = encode(await crypto.subtle.digest('SHA-256', utf8.encode(hostKey)));
  const base = 'atamaochi/v1/'+digest+'/';
  const topic = base+(host?'host':own);
  const client = mqtt.connect(broker,{reconnectPeriod:0, connectTimeout:8000, keepalive:25, clean:true});
  const links = new Map();
  const retired = new Set();
  let stopped = false, subscribed = false, pending = Promise.resolve();
  const getLink = async remote => {
   if (links.has(remote)) return links.get(remote);
   const publicKey = await crypto.subtle.importKey('raw',decode(remote),ec,false,[]);
   const shared = await crypto.subtle.deriveBits({name:'ECDH',public:publicKey},pair.privateKey,256);
   const material = await crypto.subtle.importKey('raw',shared,'HKDF',false,['deriveKey']);
   const key = await crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:decode(secret),info:utf8.encode('atamaochi invite v1')},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
   const link = new Link(host ? 'relay-'+remote : 'relay-host',key, own, packet => {
    if (client.connected) client.publish(base+(host?remote:'host'),JSON.stringify({from:own,...packet}),{qos:1});
   }, () => {if (links.delete(remote)) {retired.add(remote);link.open=false;link.emit('close');}});
   links.set(remote,link);
   return link;
  };
  const heartbeat = setInterval(() => {
   for (const link of links.values()) if (link.open) {
    if (Date.now()-link.lastSeen>90000) link.close();
    else link.packet('alive');
   }
  },15000);
  function destroy() {
   if (stopped) return;
   clearInterval(heartbeat);
   for (const link of links.values()) if (link.open) link.packet('bye');
   Promise.all([...links.values()].map(link=>link.queue)).finally(()=>{client.end(false);});
   stopped=true;
  }
  const api = {invite:hostKey+"."+secret, id:'relay-'+own, destroy,
   async connect(nickname) {
    const link = await getLink(hostKey);
    link.packet('join',{nickname});
    return link;
   }};
  try {
   await new Promise((resolve,reject) => {
    const timeout=setTimeout(()=>reject(Error('Relay timeout')),10000);
    client.on('error',reject);
    client.on('close',()=>{if(!stopped){if(subscribed)onFailure();else reject(Error('Relay closed'));}});
    client.on('message',(_,payload)=>{
     if (stopped || payload.length>32000) return;
     pending=pending.then(async()=>{
      const m=JSON.parse(payload.toString());
      if (retired.has(m.from) || !/^[A-Za-z0-9_-]{87}$/.test(m.from) || m.from===own || (!host&&m.from!==hostKey)) return;
      const known=links.has(m.from);
      if (!known && links.size>=16) return;
      const link=await getLink(m.from);
      let packet;
      try {
       const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(m.iv),additionalData:utf8.encode(m.from)},link.key,decode(m.body));
       packet=JSON.parse(new TextDecoder().decode(plain));
      } catch { if(!known) links.delete(m.from);return; }
      if (stopped || packet.sequence<=link.received) return;
      link.received=packet.sequence;link.lastSeen=Date.now();
      if (host && packet.type==='join' && !link.open) {
       link.metadata=packet.data;
       incoming(link);link.open=true;link.packet('accept');link.emit('open');
      } else if (!host && packet.type==='accept' && !link.open) {
       link.open=true;link.emit('open');
      } else if (packet.type==='bye') link.closeLink();
      else if (link.open && packet.type==='data') link.emit('data',packet.data);
      else if (!link.open && !known) links.delete(m.from);
     }).catch(()=>{});
    });
    client.on('connect',()=>client.subscribe(topic,{qos:1},(error,grants)=>{
     clearTimeout(timeout);
     if (error || grants?.[0]?.qos===128) reject(Error('Relay subscription failed'));
     else {subscribed=true;resolve();}
    }));
   });
  } catch(error) { destroy();throw error; }
  return api;
 }
 return {create};
})();
