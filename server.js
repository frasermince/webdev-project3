var util = require("util");
var io = require("socket.io");
var static = require('node-static');

var Missile = function(iden, startX, startY, direction){
	var count = 0;
	var x = startX;
	var y = startY;
	var id = iden;
	//var img = document.getElementById("miss");//insert image here
	var getX = function(){
		return x;
	};

	var getY = function(){
		return y;
	};
	
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
		setX: setX,
		setY: setY,
		update: update,
		//getImg: getImg,
		id: id,
		getDirection: getDirection,
		draw: draw
	}
}


var Player = function(iden, n, startX, startY) {
	var x = startX;
	var y = startY;
	//var id;
	var name = n;
	var id = iden;
	//var imageNum = image;
	

	var getX = function() {
		return x;
	}
	
	/*var getImg = function(){
		return imageNum;	
	}*/

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
		name: name,
		//getImg: getImg
	}
}

var socket;
var players;
var missiles;
var identification = 1;

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
	missiles = [];

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
	
	//client.on("get", getData);
	
	client.on("get", onGetData);

	//New player message
	client.on("new player", onNewPlayer);

	//Move player message
	client.on("move player", onMovePlayer);
	//this.emit("create",{l: (players.size % 2)})
	//Add missiles
	client.on("new missile", onNewMissile);
	
	//Move missiles to new location
	client.on("move missile", onMoveMissile);
	
}

function onGetData(data){
	this.emit("create", {id: identification});
	identification++;
}

function onClientDisconnect() {
	util.log("Player has disconnected: "+this.id);

	var removePlayer = playerById(this.id);

	if (!removePlayer) {
		util.log("Remove: Player not found: "+this.id);
		return;
	}

	players.splice(players.indexOf(removePlayer), 1);

	this.broadcast.emit("remove player", {id: this.id});
}

function onNewPlayer(data) {
	var newPlayer = new Player(data.id, data.name,data.x, data.y);
	//newPlayer.id = this.id;
	//newPlayer.name = data.name;

	this.broadcast.emit("new player", {id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY(), name: newPlayer.name});

	// Send existing players to the new player
	var i, existingPlayer;
	for (i = 0; i < players.length; i++) {
		existingPlayer = players[i];
		this.emit("new player", {id: existingPlayer.id, name: existingPlayer.name, x: existingPlayer.getX(), y: existingPlayer.getY()});
	}
	var j, existingMissile;
	for(j = 0; j < missiles.length; j++){
		existingMissile = missiles[j];
		this.emit("new missile", {id: existingMissile.id, x: existingMissile.getX(), y: existingMissile.getY(), direction: existingMissile.getDirection()})
	}
		
	// Add new player to the players array

	players.push(newPlayer);
};

function onMovePlayer(data) {
	// Find player in array
	
	var movePlayer = playerById(data.id);

	// Player not found
	if (!movePlayer) {
		util.log("Move: Player not found: "+this.name);
		return;
	};

	// Update player position
	movePlayer.setX(data.x);
	movePlayer.setY(data.y);
	// Broadcast updated position to connected socket clients
	this.broadcast.emit("move player", {id: movePlayer.id, x: movePlayer.getX(), y: movePlayer.getY(), name: movePlayer.name});
};


function onNewMissile(data){
	var newMissile = new Missile(data.id ,data.x, data.y, data.direction);
	util.log("new missile id: " + data.id);
	missiles.push(newMissile);
	this.broadcast.emit("new missile",{id: data.id, x: newMissile.getX(), y: newMissile.getY(), direction: newMissile.getDirection()});
}

function onMoveMissile(data){
	var currentMissile = missileById(data.id);
	if(!currentMissile){
		return;
	}
	// Missile  found
	currentMissile.setX(data.x);
	currentMissile.setY(data.Y);
	//util.log("id " + currentMissile.id);
	this.broadcast.emit("move missile", {id: currentMissile.id, x: currentMissile.getX(), y: currentMissile.getY(), direction:currentMissile.getDirection()});
}


function playerById(id) {
	for (var i = 0; i < players.length; i++) {
		if (players[i].id == id) {
			return players[i];
		}
	}
	
	return false;
};

function missileById(id){
	//util.log("comparing: " + id);
	for(var i = 0; i < missiles.length; i++){
		//util.log("with: " + missiles[i].id);
		if(missiles[i].id = id){
			//util.log("returning " + missiles[i].id);
			return missiles[i];
		}
	}
	return false;
}

startGameService();