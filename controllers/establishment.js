var config = require(__dirname + '/../config/config'),
	mongo = require(__dirname + '/../lib/mongoskin'),
	curl = require(__dirname + '/../lib/curl');

exports.get_all = function (req, res, next) {
	var send_response = function (err, result) {
			var data = {};
			if (err) return next(err);
			console.dir(result);
			result.forEach(function (e) {
				var keyword = e.keyword;
				if (!data[e.keyword]) {
					data[e.keyword] = [];
				}
				delete e.keyword;
				data[keyword].push(e);
			});
			res.send(data);
		};
	mongo.collection('establishments')
		.find({}).toArray(send_response);
};


exports.get_nearest_establishment = function (req, res, next) {
	var data = req.body.inboundSMSMessageList.inboundSMSMessage[0],
		sender = data.senderAddress,
		keyword = data.message,
		get_access_token = function (err, result) {
			if (err) return next(err);
			curl.get
				.to('devapi.globelabs.com.ph', 80, '/location/v1/queries/location')
				.send({
					access_token : result.access_token,
					address : '+63' + result.subscriber_number,
					requestedAccuracy : 100
				})
				.then(get_nearest_establishment)
				.onerror(next);
		},
		get_nearest_establishment = function (status, result) {
			var data = result.terminalLocationList.terminalLocation.currentLocation;
			if (status !== 200) return next(result);
			mongo.collection('establishments')
				.findOne({
					keyword : keyword,
					$near : [data.latitude, data.longitude]
				}, send_response);
		},
		send_response = function (err, result) {
			if (err)
				return next(err);
			if (result === 0)
				return next('Invalid keyword');

			res.send(result);
		};

	mongo.collection('users')
		.findOne({subscriber_number : sender}, get_access_token)
};

exports.add_establishment = function (req, res, next) {
	/* lat, long, geocode, name, username, contact */
	var send_response = function (err, result) {
		if (err) return next(err);

		res.send(200, {
			message: "Success"
		});

	},
		ensure = function (err, result) {
			if (err) return next(err);

			mongo.collection('establishment')
				.ensureIndex({loc: "2d"}, send_response);

		};

	mongo.collection('establishments')
		.insert({name: req.body.name,
			supername : req.body.supername,
		username: req.body.username,
		contact : req.body.contact,
		loc : [+req.body.lat, +req.body.long],
		geocode : req.body.geocode,
		keyword : req.body.keyword
	}, ensure);
};
