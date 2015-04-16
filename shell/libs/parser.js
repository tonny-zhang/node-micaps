var fs = require('fs'),
	path = require('path');

function formatDir(dir, format_path_fn){
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
						formatFile(tmpPath, tmpPath, function(err, data){
							if(err){
								console.log(err);
							}else{
								saveData(data, format_path_fn(tmpPath));
							}
						});
					}
				}
			})
		});
	});
}
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
/*保存数据*/
function saveData(content_info, save_file_path){
	if(typeof content_info != 'string'){
		content_info = JSON.stringify(content_info);
	}
	mkdirSync(path.dirname(save_file_path));
	fs.writeFile(save_file_path, content_info, function(err){
		if(err){
			return console.log(err);
		}
		console.log(save_file_path,'save successfully!');
	});
}
var ERROR_NO_DATA = {
	code: 1,
	msg: 'no data'
},
ERROR_NO_TYPE = {
	code: 2,
	msg: 'no data TYPE'
},
ERROR_NOT_SUPPORT = {
	code: 3,
	msg: 'no support this type'
}
/*解析文件*/
function formatFile(file_path, option, callback){
	if(({}).toString.call(option) == '[object Function]'){
		callback = option;
		option = null;
	}
	fs.readFile(file_path,{encoding: 'utf8'},function(err,data){
		if(err){
			callback && callback(err);
		}else{
			var line_arr = data.toString().split(/[\r\n]+/).filter(function(v){
				return !!v.trim()
			});
			if(line_arr.length > 0){
				var m = /diamond\s+(\d+)/.exec(line_arr[0]);
				var type;
				if(m && (type = m[1])){
					var parser;
					try{
						parser = require('./types/'+type);
					}catch(e){
						callback && callback(ERROR_NOT_SUPPORT);
						return;
					}
					var data = parser.parse(line_arr.slice(2), option);

					data.type = type;
					var stat = fs.statSync(file_path);
					var file_time = new Date(stat.mtime);
					data.mtime = file_time.getTime(); // 可以做为数据的制作时间

					m = /^(([12]\d)?\d{2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})/.exec(line_arr[1].trim());
					
					if(m){
						var year = file_time.getFullYear(),// 暂时以文件的修改时间里的年数据代替
							month = m[3],
							day = m[4],
							hour = m[5];
						var str_hour = path.basename(file_path).replace(/\..+/g,'').replace(/\D+$/,'').substr(-2);
						if(str_hour.length == 2 && !isNaN(str_hour)){
							hour = parseInt(str_hour);
						}
						data.time = new Date(year+'-'+month+'-'+day+' '+hour+':00').getTime();
					}
					callback && callback(null, data);
					
					return ;
				}else{
					callback && callback(ERROR_NO_TYPE);
				}
			}else{
				callback && callback(ERROR_NO_DATA);
			}
		}
	});
}
var format = function(data_path, format_path_fn){
	data_path = path.normalize(data_path);
	fs.stat(data_path,function(err,stats){
		if(err){
			console.log(err);
		}else{
			if(stats.isDirectory()){
				formatDir(data_path,format_path_fn);
			}else{
				formatFile(data_path, function(err, data){
					if(err){
						console.log(err);
					}else{
						saveData(data, format_path_fn(data_path));
					}
				});
			}
		}
	});
}
exports.parse = formatFile;
exports.format = format; //用于命令行批量操作