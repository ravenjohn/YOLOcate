var config = require(__dirname + '/../config/config'),
	curl = require(__dirname + '/../lib/curl');

exports.handle_sms = function (req, res, next) {
	console.dir(req.query);
	curl.post
		.to('developer.globelabs.com.ph', 80, '/oauth/access_token')
		.send({
			app_id : config.globe.app_id,
			app_secret : config.globe.app_secret,
			code : req.query.code
		})
		.then(function (status, result) {
			if (status === 200) {
				console.dir(result);
			}
		})
		.onerror(next);
};
