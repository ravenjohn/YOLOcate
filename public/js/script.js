
	var doc = window.document,
		apiURL = 'http://yolo.adin234.com',
		frontEndURL = 'http://ravenjohn.github.io/YOLOcate/public',
		current = {},
		_$ = function (s) {
			if (s[0] === '#') return doc.getElementById(s.substring(1));
			else if (s[0] === ':') return doc.getElementsByName(s.substring(1));
			return doc.querySelectorAll(s);
		},
		t = function (s, d) {
			var p;
			s = _$('#' + s + '_tmpl').innerHTML;
			for (p in d) {
				d[p] = '' + d[p];
				if (!~d[p].indexOf('http'))
					d[p] = (d[p].match(/\S{1,30}/g) || []).join(' ');
				s = s.replace(new RegExp('{' + p + '}', 'g'), d[p]
					.replace(/&/gi, '&amp;')
					.replace(/</gi, '&lt;')
					.replace(/\"/gi, '&quot;')
					.replace(/\'/gi, '&#039;')
					.replace(/>/gi, '&gt;'));
			}
			return s;
		},
		serialize = function (f) {
			var i = f.length,
				ret = {};
			while (i--) {
				if (f[i].type === 'submit') continue;
				ret[f[i].name] = f[i].value;
			}
			return ret;
		},
		content_div = _$('#content_div'),



		activateLink = function (ctx, next) {
			var temp = _$('[href="/' + ctx.path.split('/')[1] + '"]')[0];
			_$('.active')[0] && (_$('.active')[0].className = '');
			temp && (temp.className = 'active');
			next();
		},

		start = function () {
			page.show(window.location.pathname === '/'
				? '/index.html'
				: window.location.pathname);
		};




	/**
		Setup Pages
	**/
	page('*', activateLink);

	/**
		Bind events
	**/

	_$("#close_modal").addEventListener('click', function (e) {
		_$('#register_section') && (_$('#register_section').style.display = 'none');
	}, true);

	_$('#login_form').addEventListener('submit', function (e) {
		var data = {
			username : e.target.username.value,
			password : e.target.password.value
		};

		curl.post(apiURL + '/login')
			.send(data)
			.then(function (d) {
				Cookies.set('sessid', e.target.username.value);
				window.location.href = frontEndURL + '/login.html';
			})
			.onerror(function (e) {
				alert('Something went wrong with login.');
			});

		return false;
	});

	_$('#registration_form').addEventListener('submit', function (e) {
			if (e.target.password.value !== e.target.password_confirmation.value)
				return function () {
					alert('Passwords do not match!');
					return false;
				}

			var data = {
				username : e.target.username.value,
				password : e.target.password.value,
				email : e.target.email.value,
				keyword : e.target.keyword.value
			};

			curl.post(apiURL + '/register')
				.send(data)
				.then(function (d) {
					Cookies.set('sessid', e.target.username.value);
					window.location.href = frontEndURL + '/login.html';
				})
				.onerror(function (e) {
					alert('Something went wrong with your registration.');
				});
			return false;
	}, true);

	doc.body.addEventListener('click', function (e) {
		var href = e.target.getAttribute('href');
		if (href && !~href.indexOf('http://')) {
			e.preventDefault();
			page.show(href);
			return false;
		}
	}, true);

	doc.body.addEventListener('keyup', function (e) {
		if (e.keyCode === 27) {
			_$('#register_section') && (_$('#register_section').style.display = 'none');
		}
	});

	window.onpopstate = page;


	/**
		configure libraries then start
	*/
	NProgress.configure({ showSpinner: false });
	start();
