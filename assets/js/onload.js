$("#startButton").click(function() {
	console.log($("#loginName").val());
	startGame();
});

$("#loginName").focus();

$("#buildStatus").mouseenter(function() {
	$(this).addClass('animated pulse');
}).mouseleave(function() {
	$(this).removeClass('animated pulse');
});

function startGame() {
	$('#login').addClass('animated bounceOutUp');
	init();
	animate();
	$('#gameCanvas').removeClass("noDisplay");
}