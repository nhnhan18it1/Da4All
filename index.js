var express = require("express");
var app = express();
var server = require("http").createServer(app).listen(process.env.PORT || 3000);
var io = require("socket.io").listen(server);
var fs = require("fs")
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();
const path = require('path')
const { v4: uuidV4 } = require("uuid");
const { group } = require("console");

peers = {}
var groups=[]
// [{
//   gId:1,
//   name:'aaaa',
//   key:'socket_id',
//   gpeers:{
//     sk_id:socket
//   }
// }]
app.use(bodyParser.json());
// app.set('view engine','ejs')
app.use(express.static("public"))
app.use(express.static('node_modules'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html')
})

// app.get('/:room',(req, res)=>{
//     res.render('room',{roomId: req.params.room})
// })

console.log("hello")

io.on("connection", function (socket) {
  console.log(socket.id);
  peers[socket.id] = socket

  // console.log(peers)

  socket.on('CreateRoom',(data)=>{
    roomx={
          gId:groups.length+1,
          name:data,
          key:socket.id,
          gpeers:{
            
          }
    }
    roomx.gpeers[socket.id]=socket
    groups.push(roomx)
    console.log(groups)
    // groups.forEach((item, index)=>{
    //   console.log(item.gId)
    // })
  })

  socket.on('joinRoom',(data)=>{
    groups.forEach((item, index)=>{
      if(item.gId==data.gId){
        item.gpeers[socket.id]=socket
      }
    })
  })

  socket.on('clinetReady', (data) => {
    for (let id in peers) {
      if (id === socket.id) continue
      console.log('sending init re to' + socket.id)
      peers[id].emit('initReceive', socket.id)
    }
  })

  socket.on('signal', data => {
    console.log('sending singnal from ' + socket.id + ' to ', data)
    if (!peers[data.socket_id]) return
    peers[data.socket_id].emit('signal', {
      socket_id: socket.id,
      signal: data.signal
    })
  })

  socket.on('disconnect', () => {
    console.log("sk disconnect " + socket.id)
    socket.broadcast.emit('removePeer', socket.id)
    delete peers[socket.id]
  })

  socket.on("initSend", (init_socket_id) => {
    console.log('INIT SEND by ' + socket.id + ' for ' + init_socket_id)
    peers[init_socket_id].emit('initSend', socket.id)
  })
})