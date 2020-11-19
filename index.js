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

var dbConfig={
  host: "b8qlmi0rrl6fqlz9g7xq-mysql.services.clever-cloud.com",
  user: "ulxhup08hubnlnlb",
  password: "56cWxVOzXaCCD5QmDQsr",
  database: "b8qlmi0rrl6fqlz9g7xq"
}

var connection;
function handleDisconnect() {
  connection = mysql.createConnection(dbConfig); // Recreate the connection, since
                                                  // the old one cannot be reused.

  connection.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }                                     // to avoid a hot loop, and to allow our node script to
  });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
  connection.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}

handleDisconnect();



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
app.get("/turnsv", function(req, res) {
  let o = {
      iceServers: [{   urls: ["stun:ss-turn2.xirsys.com"] },
          {  
              username: "E4bphbAk4Dbopxj_8MMpnJzYcbgpnBH2x4b_ES-4pnw0ZQWb3Xt5kC8CZvE9wyXRAAAAAF7ozCtuaGF2Ym5t",
                
              credential: "299abf54-afd7-11ea-b1f4-0242ac140004",
                
              urls: ["turn:ss-turn2.xirsys.com:80?transport=udp",       
                  "turn:ss-turn2.xirsys.com:3478?transport=udp",       
                  "turn:ss-turn2.xirsys.com:80?transport=tcp",       
                  "turn:ss-turn2.xirsys.com:3478?transport=tcp",       
                  "turns:ss-turn2.xirsys.com:443?transport=tcp",       
                  "turns:ss-turn2.xirsys.com:5349?transport=tcp"  
              ]
          }
      ]
  };

  let bodyString = JSON.stringify(o);
  let https = require("https");
  let options = {
      host: "global.xirsys.net",
      path: "/_turn/streamx",
      method: "PUT",
      headers: {
          "Authorization": "Basic " + Buffer.from("nhavbnm:feffd4ec-afd5-11ea-b23e-0242ac150003").toString("base64"),
          "Content-Type": "application/json",
          "Content-Length": bodyString.length
      }
  };

  let httpreq = https.request(options, function(httpres) {
      let str = "";
      httpres.on("data", function(data) { str += data; });
      httpres.on("error", function(e) { console.log("error: ", e); });
      httpres.on("end", function() {
          console.log("response: ", str);
          res.send(str);
      });
  });

  httpreq.on("error", function(e) { console.log("request error: ", e); });
  httpreq.end(bodyString);
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

  socket.on("outRoom",(data)=>{
    groups.forEach((item)=>{
      if(item.gId==data){
        delete item.gpeers[socket.id]
      }
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