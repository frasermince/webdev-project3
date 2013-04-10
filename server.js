var util = require("util");
var io = require("socket.io");
var static = require('node-static');

var Player = function(startX, startY) {
	var x = startX;
	var y = startY;
	var id;
	var name;

	var getX = function() {
		return x;
	}

	var getY = function() {
		return y;
	}

	var setX = function(newX) {
		x = newX;
	}

	var setY = function(newY) {
		y = newY;
	}

	return {
		getX: getX,
		getY: getY,
		setX: setX,
		setY: setY,
		id: id,
		name: name
	}
}

var socket;
var players;

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
}).listen(8080);

function startGameService() {
	players = [];

	socket = io.listen(httpServer);
	httpServer.listen(8081);

	socket.configure(function() {
		socket.set("transports", ["websocket"]);
		socket.set("log level", 2);
	})

	//Sets event handlers
	socket.sockets.on("connection", onSocketConnection);
}

function onSocketConnection(client) {
	//When a new socket is connected by a client
	util.log("New Client Info: "+ client.id);

	//Client disconnected
	client.on("disconnect", onClientDisconnect);

	//New player message
	client.on("new player", onNewPlayer);

	//Move player message
	client.on("move player", onMovePlayer);
}

function onClientDisconnect() {
	util.log("Player has disconnected: "+this.id);

	var removePlayer = playerById(this.id);

	if (!removePlayer) {
		util.log("Player not found: "+this.id);
		return;
	}

	players.splice(players.indexOf(removePlayer), 1);

	this.broadcast.emit("remove player", {id: this.id});
}

function onNewPlayer(data) {
	var newPlayer = new Player(data.x, data.y);
	newPlayer.id = this.id;
	newPlayer.name = data.name;

	this.broadcast.emit("new player", {id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY(), name: newPlayer.name});

	// Send existing players to the new player
	var i, existingPlayer;
	for (i = 0; i < players.length; i++) {
		existingPlayer = players[i];
		this.emit("new player", {id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY(), name: existingPlayer.name});
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
	movePlayer.setY(data.y);
	// Broadcast updated position to connected socket clients
	this.broadcast.emit("move player", {id: movePlayer.id, x: movePlayer.getX(), y: movePlayer.getY(), name: movePlayer.name});
};

function playerById(id) {
	for (var i = 0; i < players.length; i++) {
		if (players[i].id == id) {
			return players[i];
		}
	}
	
	return false;
};

startGameService();