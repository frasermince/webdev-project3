var canvas;
var ctx;
var keys;
var localPlayer;
var remotePlayers;
var socket;

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

function init() {
	window.addEventListener("keydown", onKeydown, false);
	window.addEventListener("keyup", onKeyup, false);
	canvas = document.getElementById("gameCanvas");
	keys = new Keys();
	ctx = canvas.getContext("2d");

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight*0.5;

	socket = io.connect("http://localhost", {port: 8080, transports: ["websocket"]});

	remotePlayers = [];

	socket.on("connect", onSocketConnected);
	socket.on("disconnect", onSocketDisconnected);
	socket.on("new player", onNewPlayer);
	socket.on("move player", onMovePlayer);
	socket.on("remove player", onRemovePlayer);

	var playerName = $("#loginName").val();
	localPlayer =  new Player(0, playerName);
}

// Keyboard key down
function onKeydown(e) {
	if (localPlayer) {
		keys.onKeyDown(e);
	};
};

// Keyboard key up
function onKeyup(e) {
	if (localPlayer) {
		keys.onKeyUp(e);
	};
};

function onSocketConnected() {
	console.log("Connected to socket server");

	// Send local player data to the game server
	socket.emit("new player", {name: localPlayer.getName()});
}

function onSocketDisconnected() {
	console.log("Disconnected from socket server");
}

function onNewPlayer(data) {
	console.log("New player connected: ", data.name);
	console.log("# Remote Players:", remotePlayers.length);

	// Initialise the new player
	var newPlayer = new Player(data.name);
	newPlayer.id = data.id;

	// Add new player to the remote players array
	remotePlayers.push(newPlayer);
}

function onRemovePlayer(data) {
	console.log("Player Removed");
}

function playerById(id) {
	for (var i = 0; i < players.length; i++) {
		if (players[i].id == id) {
			return players[i];
		}
	};
	
	return false;
};

function onMovePlayer(data) {
	var movePlayer = playerById(data.id);

	// Player not found
	if (!movePlayer) {
		console.log("Player not found: "+data.id);
		return;
	};

	// Update player position
	movePlayer.setX(data.x);
};

function animate() {
	update();
	draw();

	// Request a new animation frame using Paul Irish's shim
	window.requestAnimFrame(animate);
};


function update() {
	// Update local player and check for change
	if (localPlayer.update(keys)) {
		// Send local player data to the game server
		socket.emit("move player", {x: localPlayer.getX()});
	};
};

function draw() {
	console.log("we are drawing");
	// Wipe the canvas clean
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Draw the local player
	localPlayer.draw(ctx);

	// Draw the remote players
	var i;
	for (i = 0; i < remotePlayers.length; i++) {
		remotePlayers[i].draw(ctx);
	};
};