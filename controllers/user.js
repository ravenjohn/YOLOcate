var config = require(__dirname + '/../config/config'),
    mongo = require(__dirname + '/../lib/mongoskin'),
    curl = require(__dirname + '/../lib/curl'),
    util = require(__dirname + '/../helpers/util');

exports.login = function (req, res, next) {
    var compare = function (err, result) {
        if (err) return next(err);

        if (!result)  return next(err);

        if (result.password === require('crypto').createHash('sha1').update(req.body.password).digest('hex'))
            return res.send(200, {message : "success"});
    },
    lookFor = ['username', 'password'],
    res = util.check_requirements(lookFor, req.body);

    if (!res.code) return next(res.message);

    mongo.collection('users')
        .findOne({name: req.body.username}, compare);
};

exports.register = function (req, res, next) {
    var reg = function (err, result) {
            if (err) return next(err);

            res.send(200, {message : "success"});
        },
        lookFor = ['username', 'password', 'keyword'],
        res = util.check_requirements(lookFor, req.body);

    if (!res.code) return next(res.message);

    mongo.collection('users')
        .insert({username: req.body.username,
            password: require('crypto').createHash('sha1').update(req.body.password).digest('hex'),
            keyword : req.body.keyword
        }, reg);

};
