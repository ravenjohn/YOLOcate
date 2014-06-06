// var controller = require(__dirname + '/../controllers/controller');

module.exports = function (router, logger) {

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
