//Adapted from http://rawkes.com/articles/creating-a-real-time-multiplayer-game-with-websockets-and-node.html
var canvas;
var ctx;
var keys;
var localPlayer;
var remotePlayers;
var socket;
var img;
var gameEnded = false;

var Player = function(startX, startY, newName) {
	var x = startX;
	var y = startY;
	var id;
	var name = newName;
	var moveAmount = 2;
	
	var getX = function(){
		return x;
	}

	var getY = function(){
		return y;
	}

	var getName = function() {
		return name;
	}
	
	var setX = function(newX){
		x = newX;
	}

	var setY = function(newY){
		y = newY;
	}
	
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
		if(name == "pikachu") {
			var img = document.getElementById("pikachu");
			ctx.drawImage(img, x-5, y-5);
		} else {
			var img = document.getElementById("pokeball");
			ctx.drawImage(img, x-5, y-5);
		}
	};

	return {
		getX: getX,
		getY: getY,
		getName: getName,
		setX: setX,
		setY: setY,
		update: update,
		draw: draw
	}
}

function init() {
	canvas = document.getElementById("gameCanvas");

	keys = new Keys();
	ctx = canvas.getContext("2d");

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight-100;

	keys = new Keys();

	var startX = Math.round(Math.random()*(canvas.height-5));
	var startY = Math.round(Math.random()*(canvas.width-5));

	var playerName = $("#loginName").val();
	if(playerName == "pikachu") {
		localPlayer =  new Player(500, 50, playerName);
	} else {
		localPlayer =  new Player(50, 50, playerName);
	}

	socket = io.connect("http://localhost", {port: 8080, transports: ["websocket"]});

	remotePlayers = [];

	//Set event handlers
	window.addEventListener("keydown", onKeydown, false);
	window.addEventListener("keyup", onKeyup, false);

	//On connection with socket
	socket.on("connect", onSocketConnected);

	//On disconnect with socket
	socket.on("disconnect", onSocketDisconnected);

	//Event listeners from server. Calls when received from server
	socket.on("new player", onNewPlayer);
	socket.on("move player", onMovePlayer);
	socket.on("remove player", onRemovePlayer);
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
	socket.emit("new player", {x: localPlayer.getX(), y: localPlayer.getY(), name: localPlayer.getName()});
}

function onSocketDisconnected() {
	console.log("Disconnected from socket server");
}

function onNewPlayer(data) {
	console.log("New player connected: ", data.name);

	// Initialise the new player
	var newPlayer = new Player(data.x, data.y, data.name);
	newPlayer.id = data.id;

	// Add new player to the remote players array
	remotePlayers.push(newPlayer);
	console.log("# Remote Players:", remotePlayers.length);
}

function onMovePlayer(data) {
	var movePlayer = playerById(data.id);

	// Player not found
	if (!movePlayer) {
		console.log("Player not found: "+data.id);
		return;
	};

	// Update player position
	movePlayer.setX(data.x);
	movePlayer.setY(data.y);
};

function onRemovePlayer(data) {
	var removePlayer = playerById(data.id);
	console.log("Player", removePlayer.getName(), "has left the game");
	
	if(!removePlayer) {
		console.log("Player not found: " + data.id);
		return;
	}
	remotePlayers.splice(remotePlayers.indexOf(removePlayer),1);
}

function animate() {
	//console.log("animate");
	if(gameEnded == false) {
		update();
		draw();

		// Request a new animation frame using Paul Irish's shim
		window.requestAnimFrame(animate);
	} else {
		ctx.font="50px Helvetica";
		ctx.fillText("Game Over!",10,50);
	}
};


function playerById(id) {
	for (var i = 0; i < remotePlayers.length; i++) {
		if (remotePlayers[i].id == id) {
			return remotePlayers[i];
		}
	}
	
	return false;
};

function update() {
	// Update local player and check for change
	if (localPlayer.update(keys)) {
		// Send local player data to the game server
		socket.emit("move player", {x: localPlayer.getX(), y: localPlayer.getY()});
	};
};

function draw() {
	//console.log("we are drawing", gameEnded);
	// Wipe the canvas clean
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Draw the local player
	localPlayer.draw(ctx);
	var pikachuImage = document.getElementById("pikachu");
	var pokeballImage = document.getElementById("pokeball");

	// Draw the remote players
	var i;
	//console.log(remotePlayers.length);
	for (i = 0; i < remotePlayers.length; i++) {
		
		remotePlayers[i].draw(ctx);

		if(localPlayer.getX() == remotePlayers[i].getX() &&
			localPlayer.getY() == remotePlayers[i].getY()) {
			console.log("End game");
			
			gameEnded = true;
		}
		// if(localPlayer.getName() == "pikachu" && remotePlayers[i].getName() != "pikachu") {
		// 	console.log(isPixelCollision(pikachuImage, localPlayer.getX(), localPlayer.getY(), pokeballImage, remotePlayers[i].getX(), remotePlayers[i].getY(), true));
		// }
	};

	
	
};