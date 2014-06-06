var config = require(__dirname + '/../config/config'),
    mongo = require(__dirname + '/../lib/mongoskin'),
    curl = require(__dirname + '/../lib/curl'),
    util = require(__dirname + '/../helpers/util');

exports.login = function (req, res, next) {
    var compare = function (err, result) {
        if (err) return next(err);

        if (!result) return next("database server error response");

        if (result.password === require('crypto').createHash('sha1').update(req.body.password).digest('hex')){
            res.cookie('sessid', req.body.username, {secure: true});
            return res.send(200, {message : "success"});
        } else {
            return next("Invalid username or password");
        }
    };

    if (!req.body.username || req.body.username.trim() === 0) return next("missing username");
    if (!req.body.password || req.body.password.trim() === 0) return next("missing password");

    mongo.collection('establishment_users')
        .findOne({username: req.body.username}, compare);
};

exports.register = function (req, res, next) {
    var reg = function (err, result) {
            if (err) return next(err);

            res.send(200, {message : "success"});
        };

    if (req.signedCookies.sessid) return res.redirect(config.frontend.url + '/login.html');

    if (!req.body.username || req.body.username.trim() === 0) return next("missing username");
    if (!req.body.password || req.body.password.trim() === 0) return next("missing password");
    if (!req.body.keyword || req.body.keyword.trim() === 0) return next("missing keyword");

    mongo.collection('establishment_users')
        .insert({username: req.body.username,
            password: require('crypto').createHash('sha1').update(req.body.password).digest('hex'),
            keyword : req.body.keyword
        }, reg);

};
