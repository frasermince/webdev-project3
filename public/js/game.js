var canvas;
var ctx;
var keys;
var localPlayer;
var remotePlayers;
var socket;

var Player = function(newName) {
	var id;
	var name = newName;

	var getName = function() {
		return name;
	};

	return {
		test: "test",
		name: getName
	}
}

function init() {
	canvas = document.getElementById("gameCanvas");
	ctx = canvas.getContext("2d");

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight*0.5;

	socket = io.connect("http://webdev-project3.jit.su", {transports: ["websocket"]});

	socket.on("connect", onSocketConnected);
	socket.on("disconnect", onSocketDisconnected);
	socket.on("new player", onNewPlayer);

	var playerName = $("#loginName").val();
	var localPlayer =  new Player(playerName);
}

function onSocketConnected() {
	console.log("Connected to socket server");

	// Send local player data to the game server
	socket.emit("new player", {name: localPlayer.getName()});
}

function onSocketDisconnected() {
	console.log("Disconnected from socket server");
}

function onNewPlayer(data) {
	console.log("New player connected: "+data.id);

	// Initialise the new player
	var newPlayer = new Player(data.name);
	newPlayer.id = data.id;

	// Add new player to the remote players array
	remotePlayers.push(newPlayer);
}

function playerById(id) {
	for (var i = 0; i < players.length; i++) {
		if (players[i].id == id) {
			return players[i];
		}
	};
	
	return false;
};