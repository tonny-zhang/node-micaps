var fs = require('fs'),
	path = require('path');

var format = (function(){
	function formatDir(dir,format_path_fn){
		fs.readdir(dir, function(err, files) {
			if(err){
				return console.log(err);
			}

			files.forEach(function(item) {
				var tmpPath = path.join(dir, item);
				fs.stat(tmpPath, function(err1, stats) {
					if(err1){
						console.log(err1);
					}else{
						if (stats.isDirectory()) {
							formatDir(tmpPath,format_path_fn);
						}else{
							formatFile(tmpPath,format_path_fn);
						}
					}
				})
			});
		});
	}
	var file_type = {
		14: function(line_arr){
			var REG_TOW_NUM = /^(\d+)\s+(\d+)$/,
				REG_THREE_NUM = /^(\d+)\s+(\d+)\s+(\d+)$/
				REG_LINES = /^LINES: (\d+)/,
				REG_LINES_SYMBOL = /^LINES_SYMBOL: (\d+)/,
				REG_SYMBOLS = /^SYMBOLS: (\d+)/;
				REG_BLANK = /\s+/;
			var lines = {
				len: 0,
				items: []
			}
			var line_symbols = {
				len: 0,
				items: []
			};
			var symbols = {
				len: 0,
				items: []
			};
			var content_info = {
				lines: lines,
				line_symbols: line_symbols,
				symbols: symbols
			};
			var FLAG_READLINE = 1,
				FLAG_READLINE_WEIGHT = 2,
				FLAG_READLINE_POINTS = 3,
				FLAG_READLINE_FLAG = 4,
				FLAG_READLINE_FLAG_POINTS = 5;
				FLAG_LINES_SYMBOLE = 6,
				FLAG_LINES_SYMBOLE_POINTS = 7,
				FLAG_SYMBOLE = 8,
				FLAG_SYMBOLE_ITEM = 9,
				FLAG_OVER = 10;

			var flag,reg_m;
			line_arr.forEach(function(v,i){
				if(flag == FLAG_OVER){
					return;
				}
				v = v.trim();
				if(reg_m = REG_LINES.exec(v)){// step 1
					lines.len = reg_m[1];
					reg_m = null;
					flag = FLAG_READLINE_WEIGHT;
					console.log('1. LINES -> ',lines.len);
					return;
				}else if(reg_m = REG_LINES_SYMBOL.exec(v)){
					line_symbols.len = reg_m[1];
					reg_m = null;
					flag = FLAG_LINES_SYMBOLE;
					return;
				}else if(reg_m = REG_SYMBOLS.exec(v)){
					symbols.len = reg_m[1];
					console.log('8. SYMBOLE(len:'+reg_m[1]+')');
					reg_m = null;
					flag = FLAG_SYMBOLE_ITEM;
					return;
				}
				// console.log(flag,v);
				if(flag == FLAG_READLINE_WEIGHT){/*step 2*/
					var m = REG_TOW_NUM.exec(v);
					if(m){
						lines.items.push({
							weight: m[1],
							point: {
								len: m[2],
								items: []
							},
							flags: {
								len: 0,
								text: '',
								items: []
							}
						});
						console.log('2. LINES(weight:'+m[1]+',pointLen:'+m[2]+')');
					}
					flag = FLAG_READLINE_POINTS;
				}else if(flag == FLAG_READLINE_POINTS /*step 3*/ || 
						flag == FLAG_READLINE_FLAG_POINTS/*step 5*/ ||
						flag == FLAG_LINES_SYMBOLE_POINTS/*step 7*/){
					var items = [];
					var points_arr = v.split(REG_BLANK);
					for(var i = 0,j = points_arr.length;i<j;i+=3){
						var point = {
							x: Number(points_arr[i]),
							y: Number(points_arr[i+1]),
							z: Number(points_arr[i+2])
						};
						items.push(point);
					}
					if(flag == FLAG_READLINE_POINTS){
						console.log('3. LINES_POINT()');
						var line = lines.items[lines.items.length-1];
						// console.log(lines.items);
						line.point.items = line.point.items.concat(items);
						console.log('3. ->',items.length,line.point.items.length);
						if(line.point.len == line.point.items.length){
							flag = FLAG_READLINE_FLAG;
						}
					}else if(flag == FLAG_READLINE_FLAG_POINTS){
						console.log('5. LINES_POINT()');
						var line = lines.items[lines.items.length-1];
						line.flags.items = line.flags.items.concat(items);
						console.log('5. ->',items.length,line.flags.items.length,v);
						if(line.flags.len == line.flags.items.length){/* to step 2*/
							flag = FLAG_READLINE_WEIGHT;
						}
					}else if(flag == FLAG_LINES_SYMBOLE_POINTS){
						console.log('7. LINES_POINT()');
						var line_symbol = line_symbols.items[line_symbols.items.length-1];
						line_symbol.items = line_symbol.items.concat(items);
						if(line_symbol.items.length == line_symbol.len){
							flag = FLAG_LINES_SYMBOLE;
						}
					}				
				}else if(flag == FLAG_READLINE_FLAG/*step 4*/){
					var m = REG_TOW_NUM.exec(v);
					if(m){
						var _flags = lines.items[lines.items.length-1].flags;
						_flags.text = m[1];
						_flags.len = m[2];
						flag = FLAG_READLINE_FLAG_POINTS;
						console.log('4. LINES_FLAG(text:'+m[1]+',len:'+m[2]+')');
					}
				}else if(flag == FLAG_LINES_SYMBOLE){/*step 6*/
					var m = REG_THREE_NUM.exec(v);
					if(m){
						line_symbols.items.push({
							code: m[1],
							weight: m[2],
							len: Number(m[3]),
							items: []
						});
						flag = FLAG_LINES_SYMBOLE_POINTS;
						console.log('6. LINES_SYMBOLE(code:'+m[1]+',weight:'+m[2]+',len:'+m[3]+')');
					}
					
				}else if(flag == FLAG_SYMBOLE_ITEM){
					var arr = v.split(REG_BLANK);
					symbols.items.push({
						type: arr[0],
						x: Number(arr[1]),
						y: Number(arr[2]),
						z: Number(arr[3]),
						text: arr[4]
					});
					console.log('9. symbols');
					if(symbols.items.length == symbols.len){
						flag = FLAG_OVER;
					}					
				}
			});
			return content_info;
			// console.log(content_info);
		}
	};
	/*同步递归创建目录*/
	var mkdirSync = function(mkPath){
		var parentPath = path.dirname(mkPath);
		if(!fs.existsSync(parentPath)){
			mkdirSync(parentPath);
		}

		if(!fs.existsSync(mkPath)){
			fs.mkdirSync(mkPath);
		}
	}
	function saveData(content_info,save_file_path){
		if(typeof content_info != 'string'){
			content_info = JSON.stringify(content_info);
		}
		mkdirSync(path.dirname(save_file_path));
		fs.writeFile(save_file_path,content_info,function(err){
			if(err){
				return console.log(err);
			}
			console.log(save_file_path,'save successfully!');
		});
	}
	function formatFile(file_path,format_path_fn){
		fs.readFile(file_path,function(err,data){
			if(err){
				console.log(err);
			}else{
				var line_arr = data.toString().split(/[\r\n]+/);
				if(line_arr.length > 0){
					var m = /diamond\s+(\d+)/.exec(line_arr[0]);
					var type;
					if(m && (type = m[1])){
						var data = file_type[type](line_arr);
						saveData(data,format_path_fn(file_path));
						return ;
					}else{
						throw new Error('no data type');
					}
				}else{
					throw new Error('no data');
				}
			}
		});
	}
	return function(data_path,format_path_fn){
		data_path = path.normalize(data_path);
		fs.stat(data_path,function(err,stats){
			if(err){
				console.log(err);
			}else{
				if(stats.isDirectory()){
					formatDir(data_path,format_path_fn);
				}else{
					formatFile(data_path,format_path_fn);
				}
			}
		});
	}
})();

var file_path = '../data/micaps_source/14/';
// file_path = '../data/micaps_source/14/14110508.000';
format(file_path,function(source_path){
	return source_path.replace('micaps_source','micaps')+'.json';
});