var util = require("util");
var io = require("socket.io");

var socket;
var players;

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

function onClientConnection() {

}

function onNewPlayer() {
	
}

startGameService();