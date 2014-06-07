
	var doc = window.document,
		current = {},
		_$ = function (s) {
			if (s[0] === '#') return doc.getElementById(s.substring(1));
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
