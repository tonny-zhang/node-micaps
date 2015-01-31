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
		fs.readFile(file_path,{encoding: 'utf8'},function(err,data){
			if(err){
				console.log(err);
			}else{
				var line_arr = data.toString().split(/[\r\n]+/).filter(function(v){
					return !!v.trim()
				});
				if(line_arr.length > 0){
					var m = /diamond\s+(\d+)/.exec(line_arr[0]);
					var type;
					if(m && (type = m[1])){
						var data = require('./libs/types/'+type+'.js').parse(line_arr.slice(2));

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

// var file_path = '../data/micaps_source/14/';
// // file_path = '../data/micaps_source/14/14110508.000';// 气压线
// // file_path = '../data/micaps_source/14/rr111308.024';
// file_path = '../data/micaps_source/14/rr111314.024';
// // file_path = '../data/micaps_source/14/rr112108.048';
// // file_path = '../data/micaps_source/14/rrr112708.006';
// file_path = '../data/micaps_source/14/kw14121808.024';
// file_path = '../data/micaps_source/14/wt121808.024';
// format(file_path,function(source_path){
// 	return source_path.replace('micaps_source','micaps')+'.json';
// });

var args = [].slice.call(process.argv);
//命令行进行指定文件压缩
if(args.length > 2){
	var fileIn = args[2];
	if(fileIn == '-local'){
		var file_path = '../data/micaps_source/14/';
		// file_path = '../data/micaps_source/14/14110508.000';
		var file_path = '../data/micaps_source/3/';
		var file_path = '../data/micaps_source/3/15012114.000';
		format(file_path,function(source_path){
			return source_path.replace('micaps_source','micaps')+'.json';
		});
	}else{
		format(fileIn,function(source_path){
			return source_path.replace('data','data_stream')+'.json';
		});
	}
	
}
