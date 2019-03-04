var PRESENTATION_PHASE = false;

var app = require('express')();
var fs = require("fs");
var http = require('http').Server(app);
var io = (PRESENTATION_PHASE ? require('socket.io')(http) : null);

var presentationTemplate;
var presentationData;

var items = (PRESENTATION_PHASE ? require('./items.js').presentationItems : require('./items.js').designItems);

var delayTime = (PRESENTATION_PHASE ? 0 : 475);
var roomDim = (PRESENTATION_PHASE ? 30 : 20);

var binLocations = {
	ORGANIC: {
		X: (PRESENTATION_PHASE ? 13 : 19),
		Y: (PRESENTATION_PHASE ? 29 : 6)
	}, 
	RECYCLE: {
		X: (PRESENTATION_PHASE ? 14 : 19),
		Y: (PRESENTATION_PHASE ? 29 : 7)
	}, 
	GARBAGE: {
		X: (PRESENTATION_PHASE ? 15 : 19),
		Y: (PRESENTATION_PHASE ? 29 : 8)
	}
};

var presentationKey = "dedinsky-Tcwr6DhhoEgvifh8NpYwaBKa5fkartbiVkvVU82LR9YvPPkLYunGfHaues6xPtwZ";
var tokens = ["dedinsky-Tcwr6DhhoEgvifh8NpYwaBKa5fkartbiVkvVU82LR9YvPPkLYunGfHaues6xPtwZ",
    "bakowski-uRdnvZag8Shrmai5EawqM3dH37mHTAF6w9fE2LnbFVBpHHbUff43q8zDwvTR4b3M",
    "harder-t3MVg8gRoS4eCArfyzLcrPysoFPsgqz54mnCEKr2zobLFhiJpJxidycEM2r747Yr",
    "vidov-XVAJXXAyxVtJ5weyeuiHjBM33KTPo7UZ3NTQpW69NKp5BmriMFRTKfJt87mbR3KD",
    "alberta-77hXNVY9CfBT8jvzU5oNPHHn2EVFTbdUVP5CYzBUQ9Fmz5GbD2T8NqXh7b9nXwmQ",
    "regina-bvCgXsYYJYAXE3abDNaD4PV3G4KGYp5sLKbiTHuwQ5jqtY2pBNcuorsU3psJ8efr",
    "toronto-gWbRmC3Vo7MKnd2niVuBoh76xPxaT8B3noPVnmwanr885uuZf68MEfzuPhRVJFBY",
    "york-Mtea5EVCvQaf698EGUhKnMsVe8juoUkV7iuZgD5wWX3zpKzBZxFDV4JdMStDN8rN",
    "memorial-zW73Zcp4H5XAtdbNsuNCDmyDF3NtVMN9DR6moRh4ekZ3WWkuMSBH54FN3Dxhmiv5",
    "brunswick-8Nq9JsYFUtFzdReih3P8s2YMQiRQHDRMkWNkASN5A8xMGa4yzq5njUv4hFEEaBbZ",
    "extra-g4NVAXmHXWKs4326bHQxu53taSEo9G8JDQMUDMcfYDepT48rJAQJ6XWNyggFEQmc"];
var instances = {};

if (PRESENTATION_PHASE) {
	instances[presentationKey] = null;
} else {
	for (token in tokens) {
		instances[token] = null;
	}
}

class Error {
	constructor(error, params) {
		this.type = "ERROR";
		this.error = error;
		switch (error) {
			case "INVALID_TOKEN":
				this.message = "Token " + params['token'] + " is not valid. Please contact the administrator for more information.";
				break;
			case "INSTANCE_NOT_ACTIVE":
				this.message = "Token " + params['token'] + " does not have an active instance. Please create a new instance beforehand.";
				break;
			case "INSTANCE_ALREADY_ACTIVE":
				this.message = "Token " + params['token'] + " already has an active instance. If you would like a new instance, please delete the active instance beforehand.";
				break;
			case "INVALID_ID":
				this.message = "Item ID " + params['id'] + " is not valid. Please select a different item.";
				break;
			case "INVALID_DIRECTION":
				this.message = "Invalid direction " + params['direction'] + " is not a cardinal direction. Please use N, S, E, or W.";
				break;
		}
	}
}

class Failure {
	constructor(failure, params) {
		this.type = "FAILURE";
		this.failure = failure;
		switch (failure) {
			case "TURN_NOT_REQUIRED":
				this.message = "You are already facing direction " + params['direction'] + ".";
				break;
			case "WALL_PRESENT":
				this.message = "There is a wall present immediately in direction " + params['direction'] + ". Please choose another direction or action.";
				break;
			case "PROPER_BIN_NOT_HERE":
				this.message = "Current location (" + params['location_x'] + "," + params['location_y'] + ") is not location of " + params['item_type'] + 
				" bin. Please check instance object for location.";
				break;
			case "UNABLE_TO_FINISH":
				this.message = "You have not collected all of the items yet. Please look at your constants and itemsCollected to see what you're missing.";
				break;
			case "ALREADY_FINISHED":
				this.message = "You have already finished. If you would like to start again, please delete this instance.";
				break;
			case "ITEM_NOT_IN_RANGE":
				this.message = "You currently aren't positioned where item ID " + params['id'] + " is located. Please move to that position if you wish to collect it.";
				break;
			case "ITEM_NOT_LOCATED":
				this.message = "You currently haven't located item with ID " + params['id'] + ".";
				break;
			case "ITEM_NOT_HELD":
				this.message = "You currently aren't holding item with ID " + params['id'] + ".";
				break;
			case "SPACE_FULL":
				this.message = "Item with " + params['id'] + " cannot fit in the garbagewasher. Please check the capacity measurements of the garbagewasher.";
				break;
		}
	}
}

class Success {
	constructor(payload) {
		this.type = "SUCCESS";
		this.payload = payload;
		if (PRESENTATION_PHASE) {
			if (payload) {
				populatePresentationData(payload);
			} else {
				populatePresentationTemplate();
			}
		}
	}
}
class Location {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	static isEqual(l1, l2) {
		return (l1.x == l2.x && l1.y == l2.y);
	}

	static isIn(a1, l2) {
		return a1.some(function(l1) {
			return Location.isEqual(l1, l2);
		});
	}
}

class Instance {
	constructor(id) {
		this.id = id;
		this.location = (PRESENTATION_PHASE ? new Location(14, 14) : new Location(9, 9));
		this.direction = "N";
		this.finished = false;
		this.timeSpent = 0;
		this.itemsLocated = [];
		this.itemsHeld = [];
		this.itemsBin = [];
		this.itemsCollected = [];

		this.constants = {
			ROOM_DIMENSIONS: {
				X_MIN: 0,
				X_MAX: roomDim - 1,
				Y_MIN: 0,
				Y_MAX: roomDim - 1
			},
			BIN_LOCATION: binLocations,
			TIME: {
				TURN: 1,
				MOVE: 1,
				SCAN_AREA: 4,
				COLLECT_ITEM: 2,
				UNLOAD_ITEM: 2
			},
			TOTAL_COUNT: {
				ORGANIC: 70,
				RECYCLE: 60,
				GARBAGE: 60
			},
			BIN_CAPACITY: {
				ORGANIC: 25,
				RECYCLE: 15,
				GARBAGE: 20
			},
			BIN_COLLECTION_CYCLE: 150,
			SCAN_RADIUS: 3
		};
	}

	increaseTime(constant) {
		if (!this.finished) {
			this.timeSpent += this.constants.TIME[constant];
			if ((this.timeSpent % this.constants.BIN_COLLECTION_CYCLE) < ((this.timeSpent - this.constants.TIME[constant]) % this.constants.BIN_COLLECTION_CYCLE)) {
				this.itemsCollected = this.itemsCollected.concat(this.itemsBin);
				this.itemsBin = [];
				this.itemsCollected.sort(function(a, b){return a.id - b.id});
			}
		}
	};
	finish() {
		var organicCount = this.constants.TOTAL_COUNT.ORGANIC;
		var recycleCount = this.constants.TOTAL_COUNT.RECYCLE;
		var garbageCount = this.constants.TOTAL_COUNT.GARBAGE;
		this.itemsCollected.forEach(function(item) {
			switch (item.type) {
				case "ORGANIC":
					organicCount--;
					break;
				case "RECYCLE":
					recycleCount--;
					break;
				case "GARBAGE":
					garbageCount--;
					break;
			}
		});
		if (organicCount <= 0 && recycleCount <= 0 && garbageCount <= 0) {
			if (!this.finished) {
				console.log(this.id + " has finished in " + this.timeSpent + " units of time.");
				this.finished = true;
				return new Success(this);
			}
			return new Failure("ALREADY_FINISHED");
		}
		return new Failure("UNABLE_TO_FINISH");
	};
	turn(direction) {
		if (this.direction == direction) {
			return new Failure("TURN_NOT_REQUIRED", {direction:direction});
		}
		if (direction != "N" && direction != "S" && direction != "E" && direction != "W") {
			return new Error("INVALID_DIRECTION", {direction:direction});
		}
		this.direction = direction;
		this.increaseTime("TURN");
		return new Success(this);
	};
	move() {
		switch (this.direction) {
			case "N":
				if (this.location.y == this.constants.ROOM_DIMENSIONS.Y_MAX) {
					return new Failure("WALL_PRESENT", {direction:this.direction});
				}
				this.location.y++;
				break;
			case "S":
				if (this.location.y == this.constants.ROOM_DIMENSIONS.Y_MIN) {
					return new Failure("WALL_PRESENT", {direction:this.direction});
				}
				this.location.y--;
				break;
			case "E":
				if (this.location.x == this.constants.ROOM_DIMENSIONS.X_MAX) {
					return new Failure("WALL_PRESENT", {direction:this.direction});
				}
				this.location.x++;
				break;
			case "W":
				if (this.location.x == this.constants.ROOM_DIMENSIONS.X_MIN) {
					return new Failure("WALL_PRESENT", {direction:this.direction});
				}
				this.location.x--;
				break;
		}
		this.increaseTime("MOVE");
		return new Success(this);
	};
	scanArea() {
		var self = this;
		var scanLocations = [];
		for (var x = Math.max((this.location.x - this.constants.SCAN_RADIUS), this.constants.ROOM_DIMENSIONS.X_MIN); x <= 
			Math.min((this.location.x + this.constants.SCAN_RADIUS), this.constants.ROOM_DIMENSIONS.X_MAX); x++) {
			for (var y = Math.max((this.location.y - this.constants.SCAN_RADIUS), this.constants.ROOM_DIMENSIONS.Y_MIN); y <= 
				Math.min((this.location.y + this.constants.SCAN_RADIUS), this.constants.ROOM_DIMENSIONS.Y_MAX); y++) {
				if (Math.abs(x - this.location.x) + Math.abs(y - this.location.y) <= this.constants.SCAN_RADIUS) {
					scanLocations.push(new Location(x, y));
				}
			}
		}
		items.forEach(function(item) {
			if (Location.isIn(scanLocations, item)) {
				var undiscoveredItem = true;
				var uncoveredItem = true;
				self.itemsLocated.concat(self.itemsHeld).concat(self.itemsBin).concat(self.itemsCollected).forEach(function(otherItem) {
					if (item.id == otherItem.id) {
						undiscoveredItem = false;
						return;
					}
				});
				if (item.coveredBy && undiscoveredItem) {
					uncoveredItem = false;
					var coveringItems = item.coveredBy.slice(0);
					self.itemsHeld.concat(self.itemsBin).concat(self.itemsCollected).forEach(function(otherItem) {
						if (coveringItems.indexOf(otherItem.id) > -1) {
							coveringItems.splice(coveringItems.indexOf(otherItem.id), 1);
							if (coveringItems.length == 0) {
								uncoveredItem = true;
								return;
							}
						}
					});
				}
				if (undiscoveredItem && uncoveredItem) {
					self.itemsLocated.push(item);
				}
			}
		});
		this.increaseTime("SCAN_AREA");
		return new Success(this);
	};
	collectItem(id) {
		var self = this;
		var itemLocated = false;
		var itemCollected = false;
		if (id >= items.length || id < 0) {
			return new Error("INVALID_ID", {id: id});
		}
		this.itemsLocated.forEach(function(item) {
			if (item.id == id && Location.isEqual(self.location, item)) {
				itemLocated = true;
				if (Location.isEqual(self.location, item)) {
					itemCollected = true;
					self.increaseTime("COLLECT_ITEM");
					self.itemsHeld.push(item);
					self.itemsLocated.splice(self.itemsLocated.indexOf(item), 1);
				}
				return;
			}
		});
		if (itemCollected) {
			return new Success(this);
		}
		if (itemLocated) {
			return new Failure("ITEM_NOT_IN_RANGE", {id: id});
		}
		return new Failure("ITEM_NOT_LOCATED", {id: id});
	};
	unloadItem(id) {
		var self = this;
		var itemHeld = false;
		var spaceFull = false;
		var properBin = true;
		var itemType = "GARBAGE";
		if (id >= items.length || id < 0) {
			return new Error("INVALID_ID", {id: id});
		}
		this.itemsHeld.forEach(function(item) {
			if (item.id == id) {
				itemType = item.type;
				switch (item.type) {
					case "ORGANIC":
						if (!Location.isEqual(self.location, new Location(self.constants.BIN_LOCATION.ORGANIC.X, self.constants.BIN_LOCATION.ORGANIC.Y))) {
							properBin = false;
						}
						break;
					case "RECYCLE":
						if (!Location.isEqual(self.location, new Location(self.constants.BIN_LOCATION.RECYCLE.X, self.constants.BIN_LOCATION.RECYCLE.Y))) {
							properBin = false;
						}
						break;
					case "GARBAGE":
						if (!Location.isEqual(self.location, new Location(self.constants.BIN_LOCATION.GARBAGE.X, self.constants.BIN_LOCATION.GARBAGE.Y))) {
							properBin = false;
						}
						break;
				}
				if (properBin) {
					var typeCount = 0;
					self.itemsBin.forEach(function(otherItem) {
						if (item.type == otherItem.type) {
							typeCount++
							if (typeCount == self.constants.BIN_CAPACITY[item.type]) {
								spaceFull = true;
								return;
							}
						}
					});
					if (!spaceFull) {
						itemHeld = true;
						self.itemsBin.push(item);
					    self.itemsHeld.splice(self.itemsHeld.indexOf(item), 1);
						self.increaseTime("UNLOAD_ITEM");
					}
					return;
				}
				return;
			}
		});
		if (itemHeld) {
			return new Success(this);
		}
		if (!properBin) {
			return new Failure("PROPER_BIN_NOT_HERE", {item_type: itemType, location_x: this.location.x, location_y: this.location.y});
		}
		if (spaceFull) {
			return new Failure("SPACE_FULL", {id: id});
		}
		return new Failure("ITEM_NOT_HELD", {id: id});
	};
}

validationError = function(token, instanceShouldNotExist) {
	if ((PRESENTATION_PHASE ? presentationKey != token : tokens.indexOf(token) < 0)) {
		return new Error("INVALID_TOKEN", {token: token});
	} else if (instanceShouldNotExist && instances[token]) {
		return new Error("INSTANCE_ALREADY_ACTIVE", {token: token});
	} else if (!instanceShouldNotExist && !instances[token]) {
		return new Error("INSTANCE_NOT_ACTIVE", {token: token});
	}
}

populatePresentationTemplate = function() {
	presentationTemplate = [];
	for (var x = 0; x < roomDim; x++) {
		presentationTemplate[x] = [];
		for (var y = 0; y < roomDim; y++) {
			presentationTemplate[x][y] = {"GARBAGE": 0, "RECYCLE": 0, "ORGANIC": 0, "HIDDEN": 0};
		}
	}
	items.forEach(function(item) {
		presentationTemplate[item.x][item.y]["HIDDEN"]++;
	});
}

populatePresentationData = function(instance) {
	presentationData = JSON.parse(JSON.stringify(presentationTemplate));
	instance.itemsLocated.forEach(function(item) {
		presentationData[item.x][item.y][item.type]++;
		presentationData[item.x][item.y]["HIDDEN"]--;
	});
	instance.itemsHeld.concat(instance.itemsBin).concat(instance.itemsCollected).forEach(function(item) {
		presentationData[item.x][item.y]["HIDDEN"]--;
	});
	io.emit('updateInstance', {"presentationData": presentationData, "presentationInstance": instance, "binLocations": binLocations});
}

app.get('/instance', function (req, res) {
	var validationError = this.validationError(req.headers['token']);
	var newTime = Math.round((new Date()).getTime() / 1000);
	var response = (validationError ? validationError : new Success(instances[req.headers['token']]));
	setTimeout((function() {res.json(response)}), Math.max(0, delayTime - (Math.round((new Date()).getTime() / 1000) - newTime)));
});

app.post('/instance', function (req, res) {
	var validationError = this.validationError(req.headers['token'], true);
	var newTime = Math.round((new Date()).getTime() / 1000);
	if (!validationError) {
		instances[req.headers['token']] = new Instance(req.headers['token']);
	}
	var response = (validationError ? validationError : new Success(instances[req.headers['token']]));
	setTimeout((function() {res.json(response)}), Math.max(0, delayTime - (Math.round((new Date()).getTime() / 1000) - newTime)));
});

app.delete('/instance', function (req, res) {
	var validationError = this.validationError(req.headers['token']);
	var newTime = Math.round((new Date()).getTime() / 1000);
	if (!validationError) {
		instances[req.headers['token']] = null;
		if (PRESENTATION_PHASE) {
			presentationData = null;
		}
	}
	var response = (validationError ? validationError : new Success(null));
	setTimeout((function() {res.json(response)}), Math.max(0, delayTime - (Math.round((new Date()).getTime() / 1000) - newTime)));
});

app.post('/finish', function (req, res) {
	var validationError = this.validationError(req.headers['token']);
	var newTime = Math.round((new Date()).getTime() / 1000);
	var response = (validationError ? validationError : instances[req.headers['token']].finish());
	setTimeout((function() {res.json(response)}), Math.max(0, delayTime - (Math.round((new Date()).getTime() / 1000) - newTime)));
});

app.post('/turn/:Direction', function (req, res) {
	var validationError = this.validationError(req.headers['token']);
	var newTime = Math.round((new Date()).getTime() / 1000);
	var response = (validationError ? validationError : instances[req.headers['token']].turn(req.params.Direction));
	setTimeout((function() {res.json(response)}), Math.max(0, delayTime - (Math.round((new Date()).getTime() / 1000) - newTime)));
});

app.post('/move', function (req, res) {
	var validationError = this.validationError(req.headers['token']);
	var newTime = Math.round((new Date()).getTime() / 1000);
	var response = (validationError ? validationError : instances[req.headers['token']].move());
	setTimeout((function() {res.json(response)}), Math.max(0, delayTime - (Math.round((new Date()).getTime() / 1000) - newTime)));
});

app.post('/scanArea', function (req, res) {
	var validationError = this.validationError(req.headers['token']);
	var newTime = Math.round((new Date()).getTime() / 1000);
	var response = (validationError ? validationError : instances[req.headers['token']].scanArea());
	setTimeout((function() {res.json(response)}), Math.max(0, delayTime - (Math.round((new Date()).getTime() / 1000) - newTime)));
});

app.post('/collectItem/:ID', function (req, res) {
	var validationError = this.validationError(req.headers['token']);
	var newTime = Math.round((new Date()).getTime() / 1000);
	var response = (validationError ? validationError : instances[req.headers['token']].collectItem(req.params.ID));
	setTimeout((function() {res.json(response)}), Math.max(0, delayTime - (Math.round((new Date()).getTime() / 1000) - newTime)));
});

app.post('/unloadItem/:ID', function (req, res) {
	var validationError = this.validationError(req.headers['token']);
	var newTime = Math.round((new Date()).getTime() / 1000);
	var response = (validationError ? validationError : instances[req.headers['token']].unloadItem(req.params.ID));
	setTimeout((function() {res.json(response)}), Math.max(0, delayTime - (Math.round((new Date()).getTime() / 1000) - newTime)));
});

app.get('/',  function (req, res) {
	(PRESENTATION_PHASE ? res.sendFile(__dirname + '/index.html') : res.redirect('http://cec.cfes.ca'));
});

app.get('/style.css', function(req, res) {
	(PRESENTATION_PHASE ? res.sendFile(__dirname + "/style.css") : res.status(404).send());
});

app.get('/updateInstance.js', function(req, res) {
	(PRESENTATION_PHASE ? res.sendFile(__dirname + "/updateInstance.js") : res.status(404).send());
});

if (PRESENTATION_PHASE) {
	io.on('connection', function(socket) {
		io.emit('updateInstance', (presentationData ? {"presentationData": presentationData, "presentationInstance": instances[presentationKey], 
			"binLocations": binLocations} : {"presentationData": presentationTemplate, "presentationInstance": null, "binLocations": binLocations}));
	});
}

var server = http.listen(8081, function(){
	var port = server.address().port;
	if (PRESENTATION_PHASE) {
		populatePresentationTemplate();
	}
	console.log("CEC 2019 Programming Competition listening at http://127.0.0.1:%s", port);
});