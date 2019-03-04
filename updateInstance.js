updateInstance = function(payload) {
	var data = payload["presentationData"];
	var instance = payload["presentationInstance"];
	var binLocations = payload["binLocations"];
	var isRunning = instance != null;

	var displayDim = data.length;
	var displayBoxDim = 2;
	var displayDimPerc = 100 / displayDim;
	var displayBoxDimPerc = 100 / displayBoxDim * 7 / 8;
	var displayBoxDimPaddPerc = 100 / displayBoxDim / 8;

	var currentX = (isRunning ? instance.location.x : -1);
	var currentY = (isRunning ? instance.location.y : -1);
	var direction = (isRunning ? instance.direction : "");

	var borderWidth = displayDimPerc / 75;
	var arrowWidth = 75 / displayDim - (2 * borderWidth);
	var arrowHeight = 100 / displayDim - (2 * borderWidth);

	var displayBoardHTML = '';
	for (var i = 0; i < displayDim; i++) {
		displayBoardHTML += '<div class="display-row" style="height:' + displayDimPerc + '%" index="' + i +'">';
		for (var j = 0; j < displayDim; j++) {
			displayBoardHTML += '<div class="display-box" style="width:' + displayDimPerc + '%;outline-width:' + borderWidth + 'vw" index="' + j +'">';
			if (currentX == j && currentY == (displayDim - i - 1)) {
				displayBoardHTML += '<div id="cleaner" style="border-width:';
				if (direction == "N") {
					displayBoardHTML += arrowHeight + 'vh ' + arrowWidth/2 + 'vw;left:' + borderWidth + 'vw;bottom:' + borderWidth + 'vw;border-bottom';
				} else if (direction == "S") {
					displayBoardHTML += arrowHeight + 'vh ' + arrowWidth/2 + 'vw;left:' + borderWidth + 'vw;border-top';
				} else if (direction == "E") {
					displayBoardHTML += arrowHeight/2 + 'vh ' + arrowWidth + 'vw;left:' + borderWidth + 'vw;border-left';
				} else if (direction == "W") {
					displayBoardHTML += arrowHeight/2 + 'vh ' + arrowWidth + 'vw;right:' + borderWidth + 'vw;border-right';
				}
				displayBoardHTML += '-color:red"></div>';
			}
			var currentBlockData = data[j][displayDim - i - 1];
			for (var k = 0; k < displayBoxDim; k++) {
				displayBoardHTML += '<div class="display-box-row" style="height:' + displayBoxDimPerc + '%" index="' + k +'">';
				var binLocation = null;
				if (binLocations.GARBAGE.X == j && binLocations.GARBAGE.Y == (displayDim - i - 1)) {
					binLocation = "garbage";
				} else if (binLocations.RECYCLE.X == j && binLocations.RECYCLE.Y == (displayDim - i - 1)) {
					binLocation = "recycle";
				} else if (binLocations.ORGANIC.X == j && binLocations.ORGANIC.Y == (displayDim - i - 1)) {
					binLocation = "organic";
				}
				for (var l = 0; l < displayBoxDim; l++) {
					displayBoardHTML += '<div class="display-box-box' + (binLocation ? ' ' + binLocation : '');
					if (k == 0 && l == 0) {
						displayBoardHTML += (binLocation ? '' : ' garbage" count="' + currentBlockData["GARBAGE"]) + '" style="margin:' + displayBoxDimPaddPerc + '% 0 0 ' + displayBoxDimPaddPerc + '%;';
					} else if (k == 0 && l == displayBoxDim - 1) {
						displayBoardHTML += (binLocation ? '' : ' recycle" count="' + currentBlockData["RECYCLE"]) + '" style="margin:' + displayBoxDimPaddPerc + '% ' + displayBoxDimPaddPerc + '% 0 0;';
					} else if (k == displayBoxDim - 1 && l == 0) {
						displayBoardHTML += (binLocation ? '' : ' organic" count="' + currentBlockData["ORGANIC"]) + '" style="margin:0 0 ' + displayBoxDimPaddPerc + '% ' + displayBoxDimPaddPerc + '%;';
					} else if (k == displayBoxDim - 1 && l == displayBoxDim - 1) {
						displayBoardHTML += (binLocation ? '' : ' hidden" count="' + currentBlockData["HIDDEN"]) + '" style="margin:0 ' + displayBoxDimPaddPerc + '% ' + displayBoxDimPaddPerc + '% 0;';
					} else {
						'" style="'
					}
					displayBoardHTML += 'width:' + displayBoxDimPerc + '%" index = "' + l + '"></div>';
				}
				displayBoardHTML += '</div>';
			}
			displayBoardHTML += '</div>';
		}
		displayBoardHTML += '</div>';
	}

	var displayStats = document.getElementById("display-stats");
	var types = ["", "garbage", "recycle", "organic", "hidden"];
	var counts = ["", "3+", "2", "1", "0"];
	var itemsHidden = (isRunning ? (instance.constants.TOTAL_COUNT.GARBAGE + instance.constants.TOTAL_COUNT.RECYCLE + instance.constants.TOTAL_COUNT.ORGANIC) - (instance.itemsLocated.length + instance.itemsHeld.length + instance.itemsBin.length + instance.itemsCollected.length) : 0);
	var itemsLeft = (isRunning ? (instance.constants.TOTAL_COUNT.GARBAGE + instance.constants.TOTAL_COUNT.RECYCLE + instance.constants.TOTAL_COUNT.ORGANIC) - instance.itemsCollected.length : 0);

	displayStatsHTML = '<div id="stats-info">';
	displayStatsHTML += '<p>Direction: ' + (isRunning ? instance.direction : "N") + '</p>';
	displayStatsHTML += '<p>Finished: ' + (isRunning ? instance.finished.toString() : "false") + '</p>';
	displayStatsHTML += '<p>Time Spent: ' + (isRunning ? instance.timeSpent.toString() : 0) + '</p>';
	displayStatsHTML += '<p>Items Located: ' + (isRunning ? instance.itemsLocated.length.toString() : 0) + '</p>';
	displayStatsHTML += '<p>Items Held: ' + (isRunning ? instance.itemsHeld.length.toString() : 0) + '</p>';
	displayStatsHTML += '<p>Items Bin: ' + (isRunning ? instance.itemsBin.length.toString() : 0) + '</p>';
	displayStatsHTML += '<p>Items Collected: ' + (isRunning ? instance.itemsCollected.length.toString() : 0) + '</p>';
	displayStatsHTML += '<p>Items Hidden: ' + (isRunning ? itemsHidden.toString() : 0) + '</p>';
	displayStatsHTML += '<p>Items Left: ' + (isRunning ? itemsLeft.toString() : 0) + '</p>';
	displayStatsHTML += '</div><div id="stats-guide" style="height:50%;width:100%">';
	for (var i = 0; i < 5; i++) {
		displayStatsHTML += '<div class="stats-row">';
		for (var j = 0; j < 5; j++) {
			displayStatsHTML += '<div class="stats-box ' + (i > 0 & j > 0 ? types[i] : (i == 0 ? 'counts' : 'types')) + '"' + (i > 0 & j > 0 ? ' count="' + (4-j) + '"' : '') + '>';
			if (i == 0) {
				displayStatsHTML += counts[j];
			}
			if (j == 0) {
				displayStatsHTML += types[i];
			}
			displayStatsHTML += '</div>';
		}
		displayStatsHTML += '</div>';
	}
	displayStatsHTML += '</div>';

	return '<div id="display-board">' + displayBoardHTML + '</div><div id="display-stats">' + displayStatsHTML + '</div>';
}