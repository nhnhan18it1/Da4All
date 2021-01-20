var createRoom = function (con, roomName, key, main, callback) { 
    con.query("INSERT INTO room(room.name,room.Key,room.main) VALUES(?,?,?)",[roomName,key,parseInt(main)], function (err, result, fields) {  
        if (err) {
            callback(false)
            throw err
        }
        con.query("SELECT ID FROM room WHERE room.name LIKE ? AND room.Key LIKE ?",[roomName,key], function (err, result, fields) { 
            if (err) {
                callback(false)
                throw err
            }
            callback(result[0].ID)
         })
        
    })
 }
var getRoom = function (con,callback) { 
    con.query("SELECT * FROM room",function (err, result, fields) { 
        if (err) {
            throw err;
        }
        callback(result)
     })
 }

module.exports.getRoom = getRoom;
module.exports.createRoom = createRoom;