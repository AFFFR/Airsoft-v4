const express=require("express");
const http=require("http");
const {Server}=require("socket.io");
const path=require("path");
const app=express(), server=http.createServer(app), io=new Server(server);
app.use(express.json({limit:"10mb"}));
app.use(express.static(path.join(__dirname,"public")));

let game={
  objects:[], scores:{RED:0,BLUE:0}, players:{}, started:false
};

io.on("connection",socket=>{
  socket.emit("state",game);
  socket.on("join",p=>{
    game.players[socket.id]={name:p.name||"Jogador",team:p.team||"RED",lat:null,lon:null};
    io.emit("state",game);
  });
  socket.on("gps",p=>{
    if(game.players[socket.id]){
      game.players[socket.id].lat=p.lat; game.players[socket.id].lon=p.lon;
      io.emit("player_gps",{id:socket.id,...game.players[socket.id]});
    }
  });
  socket.on("capture",({objectId,qr,team})=>{
    const o=game.objects.find(x=>x.id===objectId);
    if(!o || o.team!==team || o.captured || o.qr!==qr)return;
    o.captured=true; game.scores[team]+=Number(o.points)||0;
    io.emit("state",game);
  });
  socket.on("add_object",o=>{
    if(!o.id)o.id=Date.now().toString(36)+Math.random().toString(36).slice(2);
    o.captured=false;
    o.order=game.objects.filter(x=>x.team===o.team).length+1;
    game.objects.push(o); io.emit("state",game);
  });
  socket.on("reset",()=>{game.objects.forEach(o=>o.captured=false);game.scores={RED:0,BLUE:0};io.emit("state",game)});
  socket.on("disconnect",()=>{delete game.players[socket.id];io.emit("state",game)});
});
app.get("/health",(req,res)=>res.json({ok:true,players:Object.keys(game.players).length}));
const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log("Airsoft Quest online on "+PORT));