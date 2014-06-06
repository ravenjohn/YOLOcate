var config = require(__dirname + '/../config/config'),
	mongo = require(__dirname + '/../lib/mongoskin'),
	curl = require(__dirname + '/../lib/curl');

exports.handle_sms = function (req, res, next) {
	var data,
		get_access_token = function (status, result) {
			if (status !== 200) return next(result);
			data = result;
			mongo.collection('users')
				.insert(result, send_response)
		},
		send_response = function (err) {
			if (err) return next(err);
			res.redirect(config.frontend_url + '#/success');
		};

	curl.post
		.to('developer.globelabs.com.ph', 80, '/oauth/access_token')
		.send({
			app_id : config.globe.app_id,
			app_secret : config.globe.app_secret,
			code : req.query.code
		})
		.then(get_access_token)
		.onerror(next);
};

exports.get_establishments = function (req, res, next) {
};

exports.get_nearest_establishment = function (req, res, next) {
	var data = data.inboundSMSMessageList.inboundSMSMessage[0],
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
				.find({
					keyword : keyword,
					$near : [data.latitude, data.longitude]
				}, send_response)
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
