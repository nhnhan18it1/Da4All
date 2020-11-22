
console.log("hello")
let socket
let localStreem = null;
let peers={}

 const configuration = {
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
}
//{
//     "iceServers": [{
//             "urls": "stun:stun.l.google.com:19302"
//         },
//         // public turn server from https://gist.github.com/sagivo/3a4b2f2c7ac6e1b5267c2f1f59ac6c6b
//         // set your own servers here
//         {
//             url: 'turn:192.158.29.39:3478?transport=udp',
//             credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
//             username: '28224511:1379330808'
//         }
//     ]
// }

let constraints = {
    audio: true,
    video: {
        width: {
            max: 300
        },
        height:{
            max: 300
        }
    }
}

constraints.video.facingMode = {
    ideal: "user"
}

navigator.mediaDevices.getUserMedia(constraints).then(stream=>{
    console.log("Receive local stream");

    localVideo.srcObject = stream
    localStreem = stream;
    init();
}).catch(e => alert(`getusermedia err ${e.name}`))

function init(){
    socket = io("/")
    console.log("init")

    socket.on('joinRoomSucess',(data)=>{
        if(data!=-1){
            console.log("Join room success")
            socket.emit('clinetReadyGroup',data);
        }
        
    })

    socket.emit('joinRoom',{gId:ROOM_ID})

    

    socket.on('initReceive',(socket_id)=>{
        console.log('INIT RECEIVE '+ socket_id)
        addPeer(socket_id,false)
        socket.emit('initSend', socket_id)
    })

    socket.on('initSend', socket_id => {
        console.log('INIT SEND ' + socket_id)
        addPeer(socket_id,true)
    })

    socket.on('removePeer', (socket_id)=>{
        console.log('romove peer '+socket_id)
        removePeer(socket_id)
    })

    socket.on('disconnect', ()=>{
        console.log('got DISCONNECTED')
        for(let socket_id in peers){
            removePeer(socket_id)
        }
    })

    socket.on('signal', data => {
        peers[data.socket_id].signal(data.signal)
    })
}

function removePeer(socket_id){
    let videoEl = document.getElementById(socket_id)
    let ctn=document.getElementById('ctn'+socket_id)
    if (videoEl) {
        const tracks = videoEl.srcObject.getTracks();

        tracks.forEach(function (track) {
            track.stop();
        });

        videoEl.srcObject= null;
        videoEl.parentNode.removeChild(videoEl)
        ctn.parentNode.removeChild(ctn)

    }
    if(peers[socket_id])peers[socket_id].destroy();
    delete peers[socket_id]
}

function addPeer(socket_id, am_init){
    peers[socket_id] = new SimplePeer({
        initiator: am_init,
        stream: localStreem,
        config: configuration
    })
    peers[socket_id].on('signal',(data)=>{
        socket.emit('signal',{
            signal: data,
            socket_id: socket_id
        })
    })
    peers[socket_id].on('stream',stream=>{
        console.log(stream);
        let newVid = document.createElement('video')
        newVid.srcObject = stream
        newVid.id = socket_id
        newVid.playsinline = false
        newVid.autoplay = true
        newVid.className = "vid"

        let ctn = document.createElement('div')
        ctn.className='col-md-1'
        ctn.id='ctn'+socket_id
        ctn.appendChild(newVid)
        videos.appendChild(ctn)
    })
}

function removeLocalStream() {
    if (localStream) {
        const tracks = localStream.getTracks();

        tracks.forEach(function (track) {
            track.stop()
        })

        localVideo.srcObject = null
    }

    for (let socket_id in peers) {
        removePeer(socket_id)
    }
}
