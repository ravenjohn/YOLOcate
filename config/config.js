var path = require('path'),
	config = {
		development : {
			port : 8000,
			app_name : 'YOLO',
			env : 'development',
			frontend_url : 'http://ravenjohn.github.io/YOLOcate/public/'.
			src_dir : path.normalize(__dirname + '/../src'),
			temp_dir : path.normalize(__dirname + '/../temp'),
			logs_dir : path.normalize(__dirname + '/../logs'),
			images_dir : path.normalize(__dirname + '/../images'),
			public_dir : path.normalize(__dirname + '/../public'),
			upload_dir : path.normalize(__dirname + '/../uploads'),
			cookie_secret : 'c38b1c9ac1c2f9d442f17bb2b77d1a075b617715',
			db_mongo : {
				host : 'localhost',
				port : 27017,
				name : 'yolocate'
			},
			globe : {
				app_id : 'By674CykxGEu67caL6ixxzu8o6xRC68r',
				app_secret : '77c1b22369b0cd2a0e5167da8e621afa00eb06965771ccb9fdcab55231b1a743'
			}
		}
	};

// set development as default environment
!process.env['NODE_ENV'] && (process.env['NODE_ENV'] = 'development');

module.exports = config[process.env['NODE_ENV']];
