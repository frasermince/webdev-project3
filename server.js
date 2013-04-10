var util = require("util");
var io = require("socket.io");

var socket;
var players;


var static = require('node-static');

//
// Create a node-static server instance to serve the './public' folder
//
var file = new(static.Server)('./public');

var http = require('http');

httpServer = http.createServer(function (request, response) {
    request.addListener('end', function () {
        //
        // Serve files!
        //
        file.serve(request, response);
    });
}).listen(80);

var Player = function(startX, newName) {
	var x = startX;
	var id;
	var name = newName;
	var moveAmount = 2;

	
	var getX = function(){
		return x;
	}
	
	var setX = function(newX){
		x = newX;
	}


	var getName = function() {
		return name;
	};
	
	// Update player position
	var update = function(keys) {
		// Previous position
		var prevX = x,
			prevY = y;

		// Up key takes priority over down
		if (keys.up) {
			y -= moveAmount;
		} else if (keys.down) {
			y += moveAmount;
		};

		// Left key takes priority over right
		if (keys.left) {
			x -= moveAmount;
		} else if (keys.right) {
			x += moveAmount;
		};

		return (prevX != x || prevY != y) ? true : false;
	};
	
	var draw = function(ctx) {
		ctx.fillRect(x-5, 5, 10, 10);
	};

	return {
		getName: getName
	}
}

function startGameService() {
	players = [];
	socket = io.listen(httpServer);
	httpServer.listen(8000);

	socket.configure(function() {
		socket.set("transports", ["websocket"]);
		socket.set("log level", 2);
	})

	socket.sockets.on("connection", onSocketConnection);
}

function onSocketConnection(client) {
	util.log("New Client Info: "+ client.id);
	client.on("disconnect", onClientDisconnect);
	client.on("new player", onNewPlayer);
	client.on("move player", onMovePlayer);
	client.on("remove player", onRemovePlayer);
}

function onClientDisconnect() {
	util.log("Player has disconnected: "+this.id);

	var removingPlayerWithIndex = playerById(this.id);

	if (!removingPlayerWithIndex) {
		util.log("Player not found: "+this.id);
		return;
	}

	players.splice(players.indexOf(removingPlayerWithIndex), 1);
	this.broadcast.emit("remove player", {id: this.id});	
}

function onNewPlayer(data) {
	var newPlayer = new Player(0, data.name);
	newPlayer.id = data.id;

	this.broadcast.emit("new player", {name: newPlayer.getName()});

	// Send existing players to the new player
	var i, existingPlayer;
	for (i = 0; i < players.length; i++) {
		existingPlayer = players[i];
		this.emit("new player", {name: existingPlayer.getName()});
	}
		
	// Add new player to the players array

	players.push(newPlayer);
}

function onMovePlayer(data) {
	// Find player in array
	var movePlayer = playerById(this.id);

	// Player not found
	if (!movePlayer) {
		util.log("Player not found: "+this.id);
		return;
	};

	// Update player position
	movePlayer.setX(data.x);
	console.log("server move");
	// Broadcast updated position to connected socket clients
	this.broadcast.emit("move player", {id: movePlayer.id, x: movePlayer.getX()});
};

function playerById(id) {
	for (var i = 0; i < players.length; i++) {
		if (players[i].id == id) {
			return players[i];
		}
	};
	
	return false;
};

startGameService();