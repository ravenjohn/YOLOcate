var express = require('express'),
    app = express(),
    config = require(__dirname + '/config/config'),
    logger = require(__dirname + '/lib/logger');

logger.log('info', 'initializing ' + config.app_name + '. ENV = ', process.env['NODE_ENV']);

app.disable('x-powered-by');
app.use(require('morgan')({format : 'dev'}));
app.use(express.static(config.public_dir));
app.use(require('body-parser')({uploadDir : config.temp_dir}));
app.use(require('cookie-parser')(config.cookie_secret));
app.use(require('response-time')());
app.use(require('compression')());
app.use(require('method-override')());
app.use(require(__dirname + '/lib/cors')(config.allowed_servers.join(',')));
app.use(require(__dirname + '/config/router')(express.Router(), logger));

app.listen(config.port);
logger.log('info', 'Server listening on port : ', config.port);

module.exports = app;
