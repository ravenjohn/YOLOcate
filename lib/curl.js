/**
	Curl.js

	@author	Raven Lagrimas | any.TV
*/

var logger = require(__dirname + '/logger'),
    http = require('http'),
    https = require('https'),
	stringify = function (obj) {
		var ret = [],
			key;
		for (key in obj)
			ret.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
		return ret.join('&');
	},
	Request = function (method) {
		this.method = method;
		this.secure = false;
		this.started = false;
		this._raw = false;
		this.headers = {};
		this.to = function (host, port, path) {
			this.host = host;
			this.port = port;
			this.path = path;
			return this;
		};
		this.secured = function () {
			this.secure = true;
			return this;
		};
		this.add_header = function (key, value) {
			this.headers[key] = value;
			return this;
		};
		this.raw = function () {
			this._raw = true;
			return this;
		};
		this.then = function (cb) {
			if (!this.scb)
				this.scb = cb;
			else if (!this.ecb)
				this.ecb = cb;
			else
				this.fcb = cb;
			(!this.started) && this.send();
			return this;
		};
		this.onerror = function (cb) {
			this.ecb = cb;
			return this;
		};
		this.before = function (cb) {
			this.bcb = cb;
			return this;
		};
		this.finally = function (cb) {
			this.fcb = cb;
			return this;
		};
		this.send = function (data) {
			var self = this,
				protocol,
				payload,
				req;

			this.bcb && this.bcb();

			this.started = true;
			this.time = +new Date;

			if (this.method === 'GET' && data)
				this.path += '?' + stringify(data);
			else {
				payload = JSON.stringify(data);
				if (!this.headers['Content-Type']) {
					payload = stringify(data);
					this.headers['Content-Type'] = 'application/x-www-form-urlencoded';
				}
				this.headers['Content-Length'] = payload.length;
			}

			if (!this._raw) {
				this.headers['Accept'] = 'application/json';
			}

			logger.log('verbose', this.method + ' ' + this.host + ':' + this.port + this.path);

			if (payload)
				logger.log('silly', 'data\n' + payload);

			protocol = this.secure ? https : http;

			req = protocol.request({
				host: this.host,
				port: this.port,
				path: this.path,
				method: this.method,
				headers: this.headers
			}, function (response) {
				var s = '';
				response.setEncoding('utf8');
				response.on('data', function (chunk) {
					s += chunk;
				});
				response.on('end', function () {
					self.time = +new Date - self.time;
					if (self._raw) {
						logger.log('verbose', 'Request complete. status : ', response.statusCode, 'in ' + self.time + 'ms');
						self.scb(response.statusCode, s);
					}
					else {
						logger.log('verbose', 'Request complete. status : ', response.statusCode, 'in ' + self.time + 'ms', s);
						try {
							self.scb(response.statusCode, JSON.parse(s));
						} catch (e) {
							logger.log('error', 'Invalid JSON');
							logger.log('verbose', s);
							console.dir(e);
							self.ecb(e);
						}
					}
					self.fcb && self.fcb();
				});
			});

			req.on('error', function (err) {
				logger.log('error', 'Request error', err);
				self.time = +new Date - self.time;
				self.ecb(err);
				self.fcb && self.fcb();
			});

			if (this.method !== 'GET')
				req.write(payload);

			req.end();
			return this;
		};
	};

module.exports = {
	get : {
		to : function (host, port, path) {
			return new Request('GET').to(host, port, path);
		}
	},
	post : {
		to : function (host, port, path) {
			return new Request('POST').to(host, port, path);
		}
	},
	put : {
		to : function (host, port, path) {
			return new Request('PUT').to(host, port, path);
		}
	},
	delete : {
		to : function (host, port, path) {
			return new Request('DELETE').to(host, port, path);
		}
	},
	request : function (method) {
		this.to = function (host, port, path) {
			return new Request(method).to(host, port, path);
		};
		return this;
	}
};
