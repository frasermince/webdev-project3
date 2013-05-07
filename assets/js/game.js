
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
var myMissiles = [];
var otherMissiles = [];

var Missile = function(iden, startX,startY, d){
	var id = iden;
	//console.log("id = " + id);
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
		y += direction * 5;
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
	var xDir = 0;
	var yDir = 0;
	var time = 0;
	if(id % 2 == 1) {
		console.log("odd");
		img = document.getElementById("pikachu");
		direction = 1;
	}
	else{
		console.log("even");
		img = document.getElementById("pokeball");
		direction = -1;
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

	var setDir = function(newX, newY){
		xDir = newX;
		yDir = newY;
	}
	var getXDir = function(){
		return xDir;
	}
	var getYDir = function(){
		return yDir;
	}
	
	// Update player position
	var update = function(keys) {
		if(keys != false){
		// Previous position
			var zero = 0;
			var prevX = x,
				prevY = y;
				
			if(keys.fire && keys != 0 && new Date().getTime() - time > 500){
				time = new Date().getTime();
				missId = parseInt(id.toString() + "0" + count.toString(),10);
				count++;
				//console.log("missId: " + missId);
				tempMissile = new Missile(missId, x + 15, y + direction, direction)
				missiles.push(tempMissile);
				myMissiles.push(tempMissile);
				//console.log("emit id: " + missId);
				socket.emit("new missile", {id: missId, x: x + 15, y: y + direction, direction: direction});

			}
			var oldX = xDir;
			var oldY = yDir;
			// Up key takes priority over down
			if (keys.up) {
				yDir = -1;
			} 
			else if (keys.down) {
				yDir = 1;
			}
			else{
				yDir = 0;
			}

			// Left key takes priority over right
			if (keys.left) {
				xDir = -1;
			} 
			else if (keys.right) {
				xDir = 1;
			}
			else{
				xDir = 0;
			}
			if(oldX != xDir || oldY != yDir){
				socket.emit("move player", {id: id, x: x, y: y, dx: xDir, dy: yDir});
			}
		}
		else{
			console.log("Xdir: " + xDir);
			console.log("Ydir: " + yDir);
		}
		x += xDir * moveAmount;
		y += yDir * moveAmount;
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
		getXDir: getXDir,
		getYDir: getYDir,
		setDir: setDir,
		update: update,
		//getImg: getImg,
		draw: draw
	}
}

// window.onunload = function(){
// 	socket.emit("disconnect",{id: localPlayer.id});
// }


function startGame(){
	init();
}

function init() {
	canvas = document.getElementById("gameCanvas");

	keys = new Keys();
	ctx = canvas.getContext("2d");

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight-100;

	keys = new Keys();

	//var startX = Math.round(Math.random()*(canvas.height-5));
	//var startY = Math.round(Math.random()*(canvas.width-5));
	playerName = $("#loginName").val();
	
	
	socket = io.connect('http://space-shooter-7699.onmodulus.net/');
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
	console.log("id: " + data.id);
	if(data.id % 2 == 1)
		localPlayer =  new Player(data.id, playerName, 500, 50);
	else
		localPlayer =  new Player(data.id, playerName, 500, 500);
	console.log("id: " + data.id);

	// Send local player data to the game server
	socket.emit("new player", {id: localPlayer.id, name: localPlayer.getName(), x: localPlayer.getX(), y: localPlayer.getY()});
}

function onSocketDisconnected() {
	console.log("Disconnected from socket server");
}

function onNewPlayer(data) {
	
	console.log("New player connected: ", data.name);

	// Initialise the new player
	var newPlayer = new Player(data.id, data.name, data.x, data.y);
	//newPlayer.name = data.id;

	// Add new player to the remote players array
	remotePlayers.push(newPlayer);
	console.log("# Remote Players:", remotePlayers.length);
}

function onNewMissile(data){
	console.log( "Missile fired " + data.id);
	var newMissile = new Missile(data.id, data.x, data.y, data.direction);
	missiles.push(newMissile);
	otherMissiles.push(newMissile);
}

function onMovePlayer(data) {
	var movePlayer = playerById(data.id);

	// Player not found
	if (!movePlayer) {
		console.log("Move: Player not found: "+data.id);
		return;
	};

	// Update player position
	//console.log("x: " + data.x + " y: " + data.y);
	movePlayer.setX(data.x);
	movePlayer.setY(data.y);
	movePlayer.setDir(data.dx,data.dy);
	//console.log("x: " + movePlayer.getXDir() + " y: " + movePlayer.getYDir());
	if(((localPlayer.getX() - movePlayer.getX() >= 0 && localPlayer.getX() - movePlayer.getX() <= 15) || (localPlayer.getX() - movePlayer.getX() <= 0 && localPlayer.getX() - movePlayer.getX() >= -15)) &&
		((localPlayer.getY() - movePlayer.getY() >= 0 && localPlayer.getY() - movePlayer.getY() <= 15) || (localPlayer.getY() - movePlayer.getY() <= 0 && localPlayer.getY() - movePlayer.getY() >= -15))) {
		console.log("End game");
		
		gameEnded = true;
	}
};

function onMoveMissile(data){
	console.log("id: " + data.id);
	var currentMissile = missileById(data.id);
	console.log("missile id: " + currentMissile.id);
	if(!currentMissile){
		return;
	}
	currentMissile.setX(data.x);
	currentMissile.setY(data.y);
	console.log("X = " + currentMissile.getX());
	console.log("Y = " + currentMissile.getY());
	
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
	} 
	else {
		socket.disconnect();
		ctx.font="50px Helvetica";
		ctx.fillText("Game Over!",10,50);
		displayLeaderboard();
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
	//console.log("compare: " + id);
	for (var i = 0; i < otherMissiles.length; i++) {
		//console.log("with " + missiles[i].id);
		if (otherMissiles[i].id == id) {
			//console.log("returning " + missiles[i].id);
			return missiles[i];
		}
	}
	
	return false;
};


function update() {
	// Update local player and check for change
	var check = true;
	while(check){
		check = false;
		for( var i = 0; i < missiles.length; i++){
			if(missiles[i].getY() >= 700 || missiles[i].getY() <= 0){
				missiles.splice(i,1);
				check = true;
				break;
			}
		}
	}
	for( var i = 0; i < missiles.length; i++){
		missiles[i].update();
		//currentMissile = missiles[i];
		//console.log("collision = " + (localPlayer.getX() - currentMissile.getX()) + ", " + (localPlayer.getY() - currentMissile.getY()));
		//console.log("x = " + myMissiles[i].getX());
		//console.log("y = " + missiles[i].getY());
		//socket.emit("move missile", {id: myMissiles[i].id, x: myMissiles[i].getX(), y: myMissiles[i].getY(), direction: myMissiles[i].getDirection()});
	}
	for(var i = 0; i < otherMissiles.length; i++){
		currentMissile = otherMissiles[i];
		if((localPlayer.getX() - currentMissile.getX() >= -20 && localPlayer.getX() - currentMissile.getX() <= 20) &&
			(localPlayer.getY() - currentMissile.getY() >= -25 && localPlayer.getY() - currentMissile.getY() <= 25)) {
			console.log("End game missile");
			gameEnded = true;
		}
	}
	if(localPlayer != null){
		localPlayer.update(keys);
		for(var i = 0; i < remotePlayers.length; i++){
			remotePlayers[i].update(false);
		}
	}

	/*if (localPlayer != null && localPlayer.update(keys)) {
		// Send local player data to the game server
		socket.emit("move player", {id: localPlayer.id, x: localPlayer.getX(), y: localPlayer.getY()});
	};*/
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

		
	
		// if(localPlayer.getName() == "pikachu" && remotePlayers[i].getName() != "pikachu") {
		// 	console.log(isPixelCollision(pikachuImage, localPlayer.getX(), localPlayer.getY(), pokeballImage, remotePlayers[i].getX(), remotePlayers[i].getY(), true));
		// }
	};
	for(i = 0; i < missiles.length; i++){
		missiles[i].draw(ctx);
	};
};
