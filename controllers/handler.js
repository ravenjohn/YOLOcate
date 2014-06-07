var config = require(__dirname + '/../config/config'),
	mongo = require(__dirname + '/../lib/mongoskin'),
	curl = require(__dirname + '/../lib/curl');

exports.handle_sms = function (req, res, next) {
	var data = req.query,
		get_access_token = function (status, result) {
			if (status !== 200) return next(result);
			data = result;
			data._id = result.subscriber_number;
			mongo.collection('users')
				.insert(result, send_response)
		},
		send_response = function (err) {
			if (err) return next(err);
			res.redirect(config.frontend_url + '#/success');
		};

	if (data.access_token) {
		data._id = data.subscriber_number;
		return mongo.collection('users')
			.insert(data, send_response);
	}

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
