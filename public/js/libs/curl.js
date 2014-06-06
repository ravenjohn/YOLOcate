/**
	Curl.js

	@author	Raven Lagrimas | any.TV
*/

(function (root) {

	var stringify = function (obj) {
			var ret = [],
				key;
			for (key in obj)
				ret.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
			return ret.join('&');
		},
		Request = function (method) {
			this.started = false;
			this.method = method;
			this.headers = {};
			this.to = function (url) {
				this.url = url;
				return this;
			};
			this.addHeader = function (key, value) {
				this.headers[key] = value;
				return this;
			};
			this.then = function (cb) {
				if (!this.scb)
					this.scb = cb;
				else if (!this.ecb)
					this.ecb = cb;
				else
					this.fcb = cb;
				!this.started && this.send();
				return this;
			};
			this.onerror = function (cb) {
				this.ecb = cb;
				!this.started && this.send();
				return this;
			};
			this.finally = function (cb) {
				this.fcb = cb;
				!this.started && this.send();
				return this;
			};
			this.send = function (data) {
				var req = new XMLHttpRequest(),
					self = this,
					payload = '',
					i;

				this.started = true;
				NProgress.start();


				if (this.method === 'GET' && data)
					this.url += '?' + stringify(data);
				else {
					data = data || {};
					payload = stringify(data);
				}

				req.open(this.method, this.url, true);
				req.withCredentials = true;
				this.headers['Accept'] = 'application/json';


				if (this.method !== 'GET')
					this.headers['Content-Type'] = 'application/x-www-form-urlencoded';

				for (i in this.headers)
					req.setRequestHeader(i, this.headers[i]);

				req.onreadystatechange = function () {
					if (req.readyState === 4) {
						NProgress.done();
						if (req.status === 200)
							self.scb && self.scb(JSON.parse(req.responseText));
						else
							self.ecb && self.ecb(JSON.parse(req.responseText));
						self.fcb && self.fcb();
					}
				};

				req.onerror = function (err) {
					NProgress.done();
					self.ecb && self.ecb(err);
					self.fcb && self.fcb();
				};

				req.send(payload);
				return this;
			};
		};

	root.curl = {
		to :  function (url) {
			return new Request('GET').to(url);
		},
		get :  function (url) {
			return new Request('GET').to(url);
		},
		post : function (url) {
			return new Request('POST').to(url);
		},
		put : function (url) {
			return new Request('PUT').to(url);
		},
		delete : function (url) {
			return new Request('DELETE').to(url);
		}
	};

} (this) );
