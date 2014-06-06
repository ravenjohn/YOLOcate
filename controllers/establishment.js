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
		geocode,
		name,
		mylocation,
		modes = ['driving', 'walking', 'bicycling', 'transit'],
		data = req.body.inboundSMSMessageList.inboundSMSMessage[0],
		sender = data.senderAddress.replace('tel:+63', ''),
		message = data.message.split(' '),
		keyword = message[0],
		mode = message[1],
		msg, mobile = false;
		get_access_token = function (err, result) {
			if (err) return next(err);
			if (!result) return next('User not registered');
			access_token = result.access_token;




			if (keyword.trim().toLowerCase().indexOf('isusingmobile')===0) {
				keyword = keyword.trim().toLowerCase().replace('isusingmobile', '');
				mobile = true;
			}


			if (keyword.trim().toLowerCase() === 'all') {

				var send_response = function (err, result) {
						var data = {},
							msg = '';
						if (err) return next(err);
						result.forEach(function (e) {
							var keyword = e.keyword;
							if (!data[e.keyword]) {
								data[e.keyword] = e.supername;
							}
						});
						for (var i in data) {
							msg += data[i] + ' - ' + i + '\n';
						}
						send_msg(msg);
						res.send({});
					};

				return mongo.collection('establishments')
					.find({}).toArray(send_response);
			}






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
			mylocation = [+data.latitude, +data.longitude];
			mongo.collection('establishments')
				.findOne({
					keyword : keyword.toLowerCase(),
					loc : {$near : [+data.latitude, +data.longitude]}
				}, send_response);
		},
		send_response = function (err, result) {
			if (err)
				return next(err);
			if (!result)
				return next('Invalid keyword');

			geocode = result.geocode;
			name = result.name;
			msg = 'Nearest is ' + result.name + ' at ' + result.geocode + '.';

			if (mode) {
				if (~modes.indexOf(mode.toLowerCase())) {
					return curl.get
						.to('maps.googleapis.com', 443, '/maps/api/directions/json')
						.secured()
						.send({
							origin : mylocation.join(','),
							destination : result.loc.join(','),
							key : config.google_api_key,
							mode : mode
						})
						.then(get_directions)
						.onerror(next);
				}
				else {
					send_msg(msg + ' Invalid mode, should be ' + modes.join(' '));
					return res.send('Invalid mode, should be ' + modes.join(' '));
				}
			}
			else
				send_msg(msg);

			if(mobile) {
				send_msg(JSON.stringify({
					geocode : result.geocode,
					name : name
				});
			}
			
			res.send({
				geocode : result.geocode,
				name : name
			});
		},
		get_directions = function (status, result) {
			var steps = result.routes[0].legs[0].steps,
				i = steps.length,
				j = 0,
				_steps = [],
				temp;

			if (status !== 200)
				return send_msg(' Failed to get directions, please try again.');

			for (; j < i; j += 1) {
				temp = (' ' + steps[j].html_instructions).replace(/<(?:.|\n)*?>/gm, '') + ' for ' + steps[j].duration.text + '.';
				_steps.push(temp);
				msg += temp;
			}

			send_msg(msg);
			res.send({
				name : name,
				geocode : geocode,
				steps : _steps
			});
		},
		send_msg = function (msg) {
			if (req.body.notext) return;
			var ar = msg.match(/(.|\n){1,130}/gm);
			ar.forEach(function (m, i) {
				m = (i + 1) + '/' + ar.length + ' ' + m;
				curl.post
					.to('devapi.globelabs.com.ph', 80, '/smsmessaging/v1/outbound/' + config.globe.code+ '/requests?access_token=' + access_token)
					.add_header('Content-Type', 'application/json')
					.send({
						outboundSMSMessageRequest : {
							clientCorrelator : util.random_string(6),
							senderAddress : 'tel:' + config.globe.code,
							outboundSMSTextMessage : {message : m},
							address : ['tel:+63' + sender]
						}
					})
					.then(function (status, result) {
						if (status === 200)
							console.dir('message sent!');
					})
					.onerror(next);
			});
		};

	mongo.collection('users')
		.findOne({subscriber_number : sender}, get_access_token)
};

exports.update_establishment = function (req, res, next) {
	// name, lat, long, geocode, contact
	var onUpdate = function (err, result) {
		var count;

		if(err) return next(err);



		res.send(200, { message : "success"});
	}, toUpdate = {};

	if (req.body.name && req.body.name.trim() !== 0) toUpdate.name = req.body.name;
	if (req.body.lat && req.body.long && !isNaN(req.body.lat) && !isNaN(req.body.long)) toUpdate.loc = [req.body.lat, req.body.long];
	if (req.body.geocode && req.body.name.trim() !== 0) toUpdate.geocde = req.body.geocode;
	if (req.body.contact && req.body.contact.trim() !== 0) toUpdate.contact = req.body.contact;

	mongo.collection('establishments')
		.update({_id : mongo.toId(req.body.id)}, { $set : toUpdate }, onUpdate);
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


	if (!req.body.name || req.body.name.trim() === 0) next("missing name");
	if (!req.body.supername || req.body.supername.trim() === 0) next("missing supername");
	if (!req.body.username || req.body.username.trim() === 0) next("missing username");

	if (!req.body.lat  || isNaN(req.body.lat)) next("missing latitude");
	if (!req.body.long  || isNaN(req.body.long)) next("missing latitude");
	if (!req.body.geocode || req.body.geocode.trim() === 0) next("missing geocode");
	if (!req.body.keyword || req.body.keyword.trim() === 0) next("missing keyword");

	mongo.collection('establishments')
		.insert({
			name: req.body.name,
			supername : req.body.supername,
			username: req.body.username,
			contact : req.body.contact || '',
			loc : [parseFloat(req.body.lat), parseFloat(req.body.long)],
			geocode : req.body.geocode,
			keyword : req.body.keyword
		}, ensure);
};
