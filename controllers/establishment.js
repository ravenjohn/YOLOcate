var config = require(__dirname + '/../config/config'),
	mongo = require(__dirname + '/../lib/mongoskin'),
	util = require(__dirname + '/../helpers/util'),
	curl = require(__dirname + '/../lib/curl');

exports.get_all = function (req, res, next) {
	var send_response = function (err, result) {
			var data = {};
			if (err) return next(err);
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
	var access_token,
		data = req.body.inboundSMSMessageList.inboundSMSMessage[0],
		sender = data.senderAddress.replace('tel:+63', ''),
		keyword = data.message,
		_next = function (err) {
			curl.post
				.to('devapi.globelabs.com.ph', 80, '/smsmessaging/v1/outbound/' + config.globe.code+ '/requests?access_token=' + access_token)
				.send({
					outboundSMSMessageRequest : {
						clientCorrelator : util.random_string(6),
						senderAddress : 'tel:' + config.globe.code,
						outboundSMSTextMessage : {message : err},
						address : ['tel:+63' + sender]
					}
				})
				.then(function (status, result) {
					if (status === 200)
						console.dir('message sent!');
				})
				.onerror(next);
			next(err);
		},
		get_access_token = function (err, result) {
			if (err) return next(err);
			if (!result) return _next('User not registered');
			access_token = result.access_token;
			curl.get
				.to('devapi.globelabs.com.ph', 80, '/location/v1/queries/location')
				.send({
					access_token : result.access_token,
					address : result.subscriber_number,
					requestedAccuracy : 100
				})
				.then(get_nearest_establishment)
				.onerror(next);
		},
		get_nearest_establishment = function (status, result) {
			var data;
			if (status !== 200) return next(result);
			data = result.terminalLocationList.terminalLocation.currentLocation;
			console.dir({
					keyword : keyword,
					$near : [+data.latitude, +data.longitude]
				});
			mongo.collection('establishments')
				.findOne({
					keyword : keyword,
					loc : {$near : [+data.latitude, +data.longitude]}
				}, send_response);
		},
		send_response = function (err, result) {
			if (err)
				return next(err);
			if (!result)
				return next('Invalid keyword');

			curl.post
				.to('devapi.globelabs.com.ph', 80, '/smsmessaging/v1/outbound/' + config.globe.code+ '/requests?access_token=' + access_token)
				.send({
					outboundSMSMessageRequest : {
						clientCorrelator : util.random_string(6),
						senderAddress : 'tel:' + config.globe.code,
						outboundSMSTextMessage : {message : result.geocode},
						address : ['tel:+63' + sender]
					}
				})
				.then(function (status, result) {
					if (status === 200)
						console.dir('message sent!');
				})
				.onerror(next);

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

			mongo.collection('establishments')
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
