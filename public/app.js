const socket=io();
let state={objects:[],scores:{RED:0,BLUE:0},players:{}}, team=null, name=null, map, me, markers=[];
const $=x=>document.getElementById(x);
function init(){map=L.map("map").setView([39.7436,-8.8071],16);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:20,attribution:"© OpenStreetMap"}).addTo(map)}
function visible(){
 if(team==="GM")return state.objects;
 const seq=state.objects.filter(o=>o.team===team).sort((a,b)=>a.order-b.order);
 const current=seq.find(o=>!o.captured); return current?[current]:[];
}
function render(){
 $("who").textContent=(team==="GM"?"👑 GM":(team==="RED"?"🔴 ":"🔵 ")+name);
 $("score").textContent=team==="GM"?`🔴 ${state.scores.RED} | 🔵 ${state.scores.BLUE}`:`${state.scores[team]} pts`;
 markers.forEach(m=>map.removeLayer(m));markers=[];
 visible().forEach(o=>{if(o.lat==null)return;let m=L.marker([o.lat,o.lon]).addTo(map).bindPopup(`<b>${o.name}</b><br>${o.desc||""}<br>${o.captured?"✓ CAPTURADO":"○ ATIVO"}`);markers.push(m)});
 const cur=visible().find(o=>!o.captured);
 $("next").innerHTML=team==="GM"?"<b>PAINEL GM</b><br>Todos os objetivos visíveis.":cur?`<b>PRÓXIMO:</b> ${cur.name}<br>${cur.desc||""}<br><small>${cur.points} pontos • raio ${cur.radius}m</small>`:"<b>🏁 OBJETIVOS CONCLUÍDOS</b>";
 if(team==="GM"){$("gm").classList.remove("hidden");$("gm").innerHTML=state.objects.map(o=>`<div class=gmrow><b>${o.name}</b> — ${o.team} — ${o.captured?"✓ CAPTURADO":"ativo"} — QR ${o.qr}</div>`).join("")}
}
socket.on("connect",()=>{$("conn").textContent="● ONLINE";$("conn").className="ok"});
socket.on("disconnect",()=>{$("conn").textContent="● SEM LIGAÇÃO"});
socket.on("state",s=>{state=s;render()});
socket.on("player_gps",p=>{state.players[p.id]=p});
$("joinBtn").onclick=()=>{name=$("name").value.trim()||"Jogador";team=$("team").value;socket.emit("join",{name,team});$("join").classList.add("hidden");$("app").classList.remove("hidden");if(!map)init();setTimeout(()=>map.invalidateSize(),300);render()};
$("gps").onclick=()=>{navigator.geolocation.getCurrentPosition(p=>{let q=p.coords;socket.emit("gps",{lat:q.latitude,lon:q.longitude});map.setView([q.latitude,q.longitude],17);if(me)map.removeLayer(me);me=L.marker([q.latitude,q.longitude]).addTo(map).bindPopup("A minha posição").openPopup()},e=>alert("Ativa o GPS e permite localização."),{enableHighAccuracy:true,timeout:15000})};
$("qr").onclick=()=>{let o=visible().find(x=>!x.captured);if(!o)return alert("Sem objetivo pendente.");let qr=prompt("TESTE QR — código esperado: "+o.qr);if(qr!==null)socket.emit("capture",{objectId:o.id,qr:qr.trim(),team})};
init();