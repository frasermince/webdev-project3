var canvas;
var ctx;
var keys;
var localPlayer;
var remotePlayers;
var socket;

function init() {
	canvas = document.getElementById("gameCanvas");
	ctx = canvas.getContext("2d");

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight*0.5;

	socket = io.connect("http://webdev-project3.jit.su", {transports: ["websocket"]});

	socket.on("connect", onSocketConnected);
}

function onSocketConnected() {
	console.log("Connected to socket server");

	// Send local player data to the game server
	//socket.emit("new player", {x: localPlayer.getX(), y: localPlayer.getY()});
};