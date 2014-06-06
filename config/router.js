var handler = require(__dirname + '/../controllers/handler'),
	establishment = require(__dirname + '/../controllers/establishment'),
	user = require(__dirname + '/../controllers/user');

module.exports = function (router, logger) {

	router.all('*', function (req, res, next) {
		console.log('---------------------');
		console.dir(req.query);
		console.dir(req.body);
		console.log('---------------------');
		next();
	});

	router.get('/sms_handler', handler.handle_sms);
	router.post('/get_nearest_establishment', establishment.get_nearest_establishment);

	router.post('/register', user.register);
	router.post('/login', user.login);

	// establishments
	router.get('/establishments', establishment.get_all);

	router.post('/establishment', establishment.add_establishment);
	router.put('/establishment', establishment.update_establishment);
	router.delete('/establishment', establishment.delete_establishment);


	router.all('*', function (req, res) {
		res.send(404, {message : 'Nothing to do here.'});
	});

	router.use(function (err, req, res, next) {
		logger.log('error', err.message || err);
		if (typeof err === 'object') {
			err.message && logger.log('error', err.message);
			err.stack && logger.log('error', err.stack);
		}
		return res.send(400, {message : err.message || err});
	});

	return router;
};
