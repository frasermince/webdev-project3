$("#startButton").click(function() {
	console.log($("#loginName").val());
	$('#login').addClass('animated bounceOutUp');
	init();
	animate();
	$('#gameCanvas').removeClass("noDisplay");
});

$("#loginName").focus();

$("#buildStatus").mouseenter(function() {
	$(this).addClass('animated pulse');
}).mouseleave(function() {
	$(this).removeClass('animated pulse');
});