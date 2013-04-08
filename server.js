var util = require("util");
var io = require("socket.io");

var socket;
var players;

var Player = function(newName) {
	var id;
	var name = newName;

	var getName = function() {
		return name;
	};

	return {
		test: "test",
		name: name
	}
}

function startGameService() {
	players = [];
	socket = io.listen(8000);

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
}

function onClientDisconnect() {
	util.log("Player has disconnected: "+this.id);

	var removingPlayerWithIndex = playerById(this.id);

	if (!removePlayer) {
		util.log("Player not found: "+this.id);
		return;
	}

	players.splice(players.indexOf(removePlayer), 1);
	this.broadcast.emit("remove player", {id: this.id});	
}

function onNewPlayer(data) {
	var newPlayer = new Player(data.name);
	newPlayer.id = data.id;

	this.broadcast.emit("new player", {name: newPlayer.name()});

	// Send existing players to the new player
	var i, existingPlayer;
	for (i = 0; i < players.length; i++) {
		existingPlayer = players[i];
		this.emit("new player", {name: existingPlayer.name()});
	}
		
	// Add new player to the players array
	players.push(newPlayer);
}

function playerById(id) {
	for (var i = 0; i < players.length; i++) {
		if (players[i].id == id) {
			return players[i];
		}
	};
	
	return false;
};

startGameService();