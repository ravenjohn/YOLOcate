var handler = require(__dirname + '/../controllers/handler'),
	establishment = require(__dirname + '/../controllers/establishment');

module.exports = function (router, logger) {

	router.get('/sms_handler', handler.handle_sms);
	router.get('/get_nearest_establishment', establishment.get_nearest_establishment);

	// establishments
	router.get('/establishments', establishment.get_all);

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
