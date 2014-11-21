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
		fs.readFile(file_path,function(err,data){
			if(err){
				console.log(err);
			}else{
				var line_arr = data.toString().split(/[\r\n]+/);
				if(line_arr.length > 0){
					var m = /diamond\s+(\d+)/.exec(line_arr[0]);
					var type;
					if(m && (type = m[1])){
						var data = require('./libs/types/'+type+'.js').parse(line_arr);
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
file_path = '../data/micaps_source/14/14110508.000';// 气压线
file_path = '../data/micaps_source/14/rr111308.024';
// file_path = '../data/micaps_source/14/rr112108.048';

format(file_path,function(source_path){
	return source_path.replace('micaps_source','micaps')+'.json';
});