//Adapted from http://rawkes.com/articles/creating-a-real-time-multiplayer-game-with-websockets-and-node.html
var canvas;
var ctx;
var keys;
var localPlayer;
var remotePlayers;
var missiles;
var socket;
var img;
var playerName;
var gameEnded = false;
var first = true;

var Missile = function(iden, startX,startY, d){
	var id = iden;
	var direction = d;
	var count = 0;
	var x = startX;
	var y = startY;
	var img = document.getElementById("miss");//insert image here
	var getX = function(){
		return x;
	};

	var getY = function(){
		return y;
	};

	var getName = function() {
		return name;
	}
	
	var getDirection = function(){
		return direction;
	};
	
	var setX = function(newX){
		x = newX;
	};

	var setY = function(newY){
		y = newY;
	};

	var update = function(){
		count++;
		y += direction;
	};
	var draw = function(ctx) {
		ctx.drawImage(img, x-5, y-5);	
	};
	return {
		getX: getX,
		getY: getY,
		//getName: getName,
		id: id,
		setX: setX,
		setY: setY,
		update: update,
		//getImg: getImg,
		getDirection: getDirection,
		draw: draw
	}

}

var Player = function(iden, newName, startX, startY) {
	
	var count = 0;
	var img
	var x = startX;
	var y = startY;
	var id = iden;
	var name = newName;
	var moveAmount = 2;
	var direction;
	if(id % 2 == 1) {
		console.log("odd");
		img = document.getElementById("pikachu");
		direction = -1;
	}
	else{
		console.log("even");
		img = document.getElementById("pokeball");
		direction = 1;
	}
	
	/*var getImg = function(){
		return imageNum;
	}*/
	
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
			
		if(keys.fire){
			missiles.push(new Missile( id + 0 + (count++),x, y + direction, direction));
			socket.emit("new missile", {id: id+(count), x: x, y: y + direction, direction: direction});
		}

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
		ctx.drawImage(img, x-5, y-5);
		
	};

	return {
		getX: getX,
		getY: getY,
		getName: getName,
		id: id,
		setX: setX,
		setY: setY,
		update: update,
		//getImg: getImg,
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
	playerName = $("#loginName").val();
	
	
	socket = io.connect("http://localhost", {port: 8080, transports: ["websocket"]});
	missiles = [];
	remotePlayers = [];
	console.log(remotePlayers.length);
	

	
	//Set event handlers
	window.addEventListener("keydown", onKeydown, false);
	window.addEventListener("keyup", onKeyup, false);
	
	socket.on("create", createLocal);
	//On connection with socket
	socket.on("connect", onSocketConnected);
	
	//On disconnect with socket
	socket.on("disconnect", onSocketDisconnected);

	//Event listeners from server. Calls when received from server
	socket.on("new missile", onNewMissile);
	socket.on("new player", onNewPlayer);
	socket.on("move missile", onMoveMissile);
	socket.on("move player", onMovePlayer);
	socket.on("remove player", onRemovePlayer);
	//socket.on("pass", onPass);
	
	console.log(remotePlayers.length);
	
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
	socket.emit("get",{});
}

function createLocal(data){
	localPlayer =  new Player(data.id, playerName, 500, 50);

	// Send local player data to the game server
	socket.emit("new player", {id: localPlayer.id, name: localPlayer.getName(), x: localPlayer.getX(), y: localPlayer.getY()});
}

function onSocketDisconnected() {
	console.log("Disconnected from socket server");
}

function onNewPlayer(data) {
	
	console.log("New player connected: ", data.getName());

	// Initialise the new player
	var newPlayer = new Player(data.id, data.name, data.x, data.y);
	//newPlayer.name = data.id;

	// Add new player to the remote players array
	remotePlayers.push(newPlayer);
	console.log("# Remote Players:", remotePlayers.length);
}

function onNewMissile(data){
	console.log( "Missile fired");
	var newMissile = new Missile(data.id, data.x, data.y, data.direction);
	missiles.push(newMissile);
}

function onMovePlayer(data) {
	var movePlayer = playerById(data.id);

	// Player not found
	if (!movePlayer) {
		console.log("Move: Player not found: "+data.id);
		return;
	};

	// Update player position
	movePlayer.setX(data.x);
	movePlayer.setY(data.y);
};

function onMoveMissile(data){
	var currentMissile = missileById(data.id);
	movePlayer.setX(data.x);
	movePlayer.setY(data.y);
}

function onRemovePlayer(data) {
	var removePlayer = playerById(data.id);
	console.log("Player", removePlayer.getName(), "has left the game");
	
	if(!removePlayer) {
		console.log("Client Remove: Player not found: " + data.id);
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

function missileById(id) {
	for (var i = 0; i < remotePlayers.length; i++) {
		if (missiles[i].id == id) {
			return missiles[i];
		}
	}
	
	return false;
};


function update() {
	// Update local player and check for change
	if (localPlayer != null && localPlayer.update(keys)) {
		// Send local player data to the game server
		socket.emit("move player", {id: localPlayer.id, x: localPlayer.getX(), y: localPlayer.getY()});
		var i;
		for(i = 0; i < missiles.length; i++){
			console.log("missile: " + missiles[i].id);
			socket.emit("move missile", {ident: missiles[i].id, x: missiles[i].getX(), y: missiles[i].getY(), direction: missiles[i].getDirection()});
		}
	};
};

function draw() {
	//console.log("we are drawing", gameEnded);
	// Wipe the canvas clean
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Draw the local player
	if(localPlayer != null){
		localPlayer.draw(ctx);
	}
	var pikachuImage = document.getElementById("pikachu");
	var pokeballImage = document.getElementById("pokeball");

	// Draw the remote players
	var i;
	//console.log(remotePlayers.length);
	for (i = 0; i < remotePlayers.length; i++) {
		
		remotePlayers[i].draw(ctx);

		if(((localPlayer.getX() - remotePlayers[i].getX() >= 0 && localPlayer.getX() - remotePlayers[i].getX() <= 15) || (localPlayer.getX() - remotePlayers[i].getX() <= 0 && localPlayer.getX() - remotePlayers[i].getX() >= -15)) &&
			((localPlayer.getY() - remotePlayers[i].getY() >= 0 && localPlayer.getY() - remotePlayers[i].getY() <= 15) || (localPlayer.getY() - remotePlayers[i].getY() <= 0 && localPlayer.getY() - remotePlayers[i].getY() >= -15))) {
			console.log("End game");
			
			gameEnded = true;
			}
	
		// if(localPlayer.getName() == "pikachu" && remotePlayers[i].getName() != "pikachu") {
		// 	console.log(isPixelCollision(pikachuImage, localPlayer.getX(), localPlayer.getY(), pokeballImage, remotePlayers[i].getX(), remotePlayers[i].getY(), true));
		// }
	};
	var j;
	for (j = 0; j < missiles.length; j++) {
		missiles[j].draw(ctx);
	}

	
	
};