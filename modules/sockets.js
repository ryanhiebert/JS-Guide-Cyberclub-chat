console.log("required game-sockets module\r\n");

module.exports = function(io, db) {
	var User = db.collection("users"),
		Room = db.collection("rooms"),
		Chat = db.collection("chatOptions");
	return {
		socketHandler: function(socket) {
			console.log("socketHandler called");
			var thisRoom;

			socket// continued "on" events
			.on("join", function(obj) {
				console.log("'join' socket function");
				console.log(obj);

				if(!obj.room) {
					thisRoom = obj.room;
					io.to(socket.id).emit("update", {
						"msg": "Welcome, " + obj.username + ", to the Guide Cyberclub chat! Please select one of our available rooms to begin chatting."
					});
				} else {
					Room.findOne({ "roomname" : obj.room }, { "_id" : 0, "roomname" : 1, "minMods" : 1, "topic" : 1 }, function(roomQErr, roomQDoc) {
        		if(roomQErr) throw roomQErr;

        		if(roomQDoc) {
							socket.leave(thisRoom);
							socket.join(obj.room);
        			thisRoom = obj.room;
							console.log(obj.room, thisRoom);

							io.to(socket.id).emit("enter room", {
								"msg": "Joined " + obj.room,
								"room": obj.room
							});
							io.emit("new entry", {
								"msg": obj.username + "has joined ",
								"user": obj.username,
								"userDisplay": obj.displayName,
								"room": obj.room
							});
        		} else {
        			io.to(socket.id).emit("command", { "msg" : "Room does not exist" });
        		}
        	});
				}
			})
			.on("leave", function(obj) {
				console.log("'leave' socket function");
				console.log(obj);

				socket.leave(obj.room);
				io.to(socket.id).emit("update", {
						"msg": "You have left the room " + obj.room
					});
			})
			.on("chat message", function(obj) {
				if(obj.msg) {
					console.log("'chat message' socket function");
					console.log(obj);
					obj.msg = obj.msg.replace(/[<]/gi, "&lt;")
						.replace(/[>]/gi, "&gt;");

					if(obj.msg.match(/^(\/me)/gi)) {
						obj.msg = obj.msg.replace(/^(\/me)/gi, "")
						io.in(thisRoom).emit("chat me response", { "msg" : obj.msg, "user" : obj.user, "color" : obj.color, "level" : obj.level });
					} else {
						io.in(thisRoom).emit("chat response", { "msg" : obj.msg, "user" : obj.user, "color" : obj.color, "level" : obj.level });
					}
				}
			})
			.on("live update", function(obj) {
				console.log("'live update' socket function");
				console.log(obj);

				var callbacks = {
					updateBannedWords: function() {
						io.emit("real time update", { "callback" : obj.callback, "operation" : obj.op, "word" : obj.word });
					},
					updateRooms: function() {
						io.emit("real time update", { "callback" : obj.callback, "operation" : obj.op, "roomname" : obj.roomname, "topic" : obj.topic });
					},
					updateUsers: function() {
						io.emit("real time update", { "callback" : obj.callback, "operation" : obj.op, "username" : obj.username, "newName" : obj.newName });
					}
				};
				callbacks[obj.callback]();
			})
			.on("example", function(obj) {
				console.log("'' socket function");
				console.log(obj);
			})
			.on("disconnect", function() {
				console.log("disconnected");
			});
		}
	}
}