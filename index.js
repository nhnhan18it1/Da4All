var express = require("express");
var app = express();
var https = require("https")//.createServer(app).listen(process.env.PORT || 3000);
const httpolyglot = require('httpolyglot')

var fs = require("fs")
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();
const path = require('path')
const { v4: uuidV4 } = require("uuid");
var session = require('express-session')
var mysql = require('mysql')
var con = mysql.createConnection({
  host: "b8qlmi0rrl6fqlz9g7xq-mysql.services.clever-cloud.com",
  user: "ulxhup08hubnlnlb",
  password: "56cWxVOzXaCCD5QmDQsr",
  database: "b8qlmi0rrl6fqlz9g7xq"
})

const options = {
  key: fs.readFileSync(path.join(__dirname,'.','ssl','key.pem'), 'utf-8'),
  cert: fs.readFileSync(path.join(__dirname,'.','ssl','cert.pem'), 'utf-8')
}
port = process.env.PORT || 3000
const httpsServer = httpolyglot.createServer(options, app)
httpsServer.listen(port, () => {
  console.log(`listening on port ${port}`)
})

var io = require("socket.io").listen(httpsServer);

con.connect((err)=>{
  if(err) throw err;
  console.log("db connected")
})
peers = {}
var groups = []
// [{
//   gId:1,
//   name:'aaaa',
//   key:'socket_id',
//   gpeers:{
//     sk_id:socket
//   }
// }]
app.use(bodyParser.json());
app.set('view engine', 'ejs')
app.set('views', './views')
app.use(express.static("public"))
app.use(express.static('node_modules'))
app.use(session({
  secret: 'this-is-a-secret-token',
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 60000,
  }
}));
app.use(function (req, res, next) {
  if(req.session.user!=null){
    res.locals.user = req.session.user;
  }
  
  next();
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html')
})
app.get('/room', (req, res) => {
  req.session.user={
    id:1,
    name:'hele'
  }
  console.log(req.session.user)
  res.render('room')
})

// app.get('/:room',(req, res)=>{
//     res.render('room',{roomId: req.params.room})
// })

console.log("hello")

io.on("connection", function (socket) {
  console.log(socket.id);
  peers[socket.id] = socket

  // console.log(peers)

  socket.on('CreateRoom', (data) => {
    roomx = {
      gId: groups.length + 1,
      name: data,
      key: socket.id,
      gpeers: {

      }
    }
    roomx.gpeers[socket.id] = socket
    groups.push(roomx)
    console.log(groups)
    // groups.forEach((item, index)=>{
    //   console.log(item.gId)
    // })
  })

  socket.on('joinRoom', (data) => {
    ix = 0;
    groups.forEach((item, index) => {
      if (item.gId == data.gId) {
        item.gpeers[socket.id] = socket
        ix = index;
      }
    })
    for (let id in groups[ix].gpeers) {
      if (id === socket.id) continue
      console.log('sending init re to' + socket.id)
      groups[ix].gpeers[id].emit('initReceive', socket.id)
    }
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