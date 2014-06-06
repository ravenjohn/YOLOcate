var config = require(__dirname + '/../config/config'),
	mongo = require(__dirname + '/../lib/mongoskin'),
	curl = require(__dirname + '/../lib/curl');

exports.get_all = function (req, res, next) {
	var send_response = function (err, result) {
			var data = {};
			if (err) return next(err);
			console.dir(result);
			result = result.forEach(function (e) {
				if (!data[e.name]) {
					data[e.name] = [];
				}
				delete e.name;
				data[e.name].push(e);
			});
			res.send(data);
		};
	mongo.collection('establishments')
		.find({}).toArray(send_response);
};