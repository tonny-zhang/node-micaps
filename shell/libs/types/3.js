var idw = require('../interpolate/idw');

var DEFAULT_VALUE = 999999;
var REG_DATA_NUM = /^\d+\s+(\d+)$/;
var REG_DATA = /^(\d+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)$/;
function _parse_level(v){
	var level = 0;
	if(v != DEFAULT_VALUE){
		if(v <= 0.9){
	        level = 1;
	    }else if(v <= 1.9){
	        level = 2;
	    }else if(v <= 3.9){
	        level = 3;
	    }else if(v <= 5.9){
	        level = 4;
	    }else if(v < 7.9){
	        level = 5;
	    }else{
	        level = 6;
	    }
    }
    return level;
}
function _getArray(width, height){
	var arr = [];
	for(var i = 0; i< width; i++){
		arr.push(new Array(height));
	}
	console.log('arr',arr,width, height);
	return arr;
}
// 对数据进行等级分组
function _sort(data){
	var levels_arr = {};
	var _width = data.length;
	data.forEach(function(v, x){
		v.forEach(function(v_v, y){
			if(x == 3 && y == 9){
				console.log(v_v);
			}
			var level = _parse_level(v_v.v);
			v_v.l = level;
			if(level != undefined){
				if(x == 3 && y == 9){
					console.log('--',v_v);
				}
				if(!levels_arr[level]){
					levels_arr[level] = _getArray(_width, v.length);
				}
				
				levels_arr[level][x][y] = v_v;
			}
		})
	});

	data = null;
	var arr = [];
	for(var i in levels_arr){
		arr.push({
			level: i,
			data: levels_arr[i]
		});
	}

	arr.sort(function(a, b){
		return a.level > b.level;
	});
	console.log(arr[1].data[3][9]);
	// return;
	// console.log('len',arr[2].level, arr[2].data);
	// return;
	return arr;
}
var MIN_EARA_POINTS = 3;// 画多边形的最少点数
var MIN_SPACE = 2;//多边形连线时的最小间隔点数
var _stroke = (function(){
	var _data,
		_width,
		_height;
	function _next(current_point, num_line, num_column){
		var next_point;
		var to_line = num_line,
			to_column = num_column;
		// 向上找
		for(var i = 0; i < MIN_SPACE; i++){
			to_line = num_line-i-1;
			if(to_line > 0){
				var column = _data[num_column];
				var _v = column[to_line];
				if(_v != undefined){
					next_point = _v;
					break;
				}
			}
		}
		// 向右上
		if(!next_point){
			for(var i = 0; i < MIN_SPACE; i++){
				to_column = num_column-i-1,
				to_line = num_line+i+1;
				if(to_line < _width && to_column > 0){
					var column = _data[to_line];
					var _v = column[to_column];
					if(_v != undefined){
						next_point = _v;
						break;
					}
				}
			}
		}
		// 向右
		if(!next_point){
			for(var i = 0; i < MIN_SPACE; i++){
				to_line = num_line+i+1;
				if(to_line < _width){
					var column = _data[to_line];
					var _v = column[num_column];
					if(_v != undefined){
						next_point = _v;
						break;
					}
				}
			}
		}
		// 向右下
		if(!next_point){
			for(var i = 0; i < MIN_SPACE; i++){
				to_column = num_column+i+1,
				to_line = num_line+i+1;
				if(to_line < _width && to_column > 0){
					var column = _data[to_line];
					var _v = column[to_column];
					if(_v != undefined){
						next_point = _v;
						break;
					}
				}
			}
		}
		// 向下
		if(!next_point){
			for(var i = 0; i < MIN_SPACE; i++){
				to_column = num_column+i+1;
				if(to_column < _height){
					var column = _data[num_line];
					if(!column){
						continue;
					}
					var _v = column[to_column];
					if(_v != undefined){
						next_point = _v;
						break;
					}
				}
			}
		}
		// 向左下
		if(!next_point){
			for(var i = 0; i < MIN_SPACE; i++){
				to_column = num_column-i-1,
				to_line = num_line-i-1;
				if(to_line < _width && to_column > 0){
					var column = _data[to_line];
					var _v = column[to_column];
					if(_v != undefined){
						next_point = _v;
						break;
					}
				}
			}
		}
		// 向左
		if(!next_point){
			for(var i = 0; i < MIN_SPACE; i++){
				to_line = num_line-i-1;
				if(to_line < _width){
					var column = _data[to_line];
					var _v = column[num_column];
					if(_v != undefined){
						next_point = _v;
						break;
					}
				}
			}
		}
		// 向左上
		if(!next_point){
			for(var i = 0; i < MIN_SPACE; i++){
				to_column = num_column-i-1,
				to_line = num_line+i+1;
				if(to_line < _width && to_column > 0){
					var column = _data[to_line];
					var _v = column[to_column];
					if(_v != undefined){
						next_point = _v;
						break;
					}
				}
			}
		}
		console.log(next_point);
		if(next_point){
			return [next_point,to_line, to_column];
		}
	}
	return function(data){
		var level = data.level;
		_data = data.data;
		_width = _data.length;
		if(_width > 0 && _data[0] && (_height = _data[0].length) && _height * _width >= MIN_EARA_POINTS){
			console.log(_width, _height, _data[3]);
			var areas = [];
			while(1){
				var area_items = [];
				// 顺时针进行数据添加
				// 先找到第一个点
				var first_point = null;
				for(var i_x = 0; i_x < _width; i_x++){
					var column = _data[i_x];
					for(var i_y = 0; i_y < _height; i_y++){
						var _v = column[i_y];
						if(_v != undefined && _v.v != DEFAULT_VALUE){
							first_point = _v;
							break;
						}
					}
				}
				
				if(!first_point){
					break;
				}
				// console.log(first_point);
				var next_info, num_line = i_y, num_column = i_x;
				while((next_info = _next(first_point, num_line, num_column))){
					console.log(next_info);
					_data[y][x] = undefined;
					area_items.push(next_info[0]);
					num_line = next_info[1];
					num_column = next_info[2];
				}
				areas.push(area_items);
			}
			return areas;
		}
	}
})();

function _parse_file(lines){
	var flag_read_data = false;
	var data_num = 0;
	var data = [];
	lines.forEach(function(line){
		line = line.trim();
		if(!flag_read_data){
			var m = REG_DATA_NUM.exec(line);
			if(m){
				flag_read_data = true;
				data_num = m[1];
			}
		}else{
			var m = REG_DATA.exec(line);
			if(m){
				var v = parseFloat(m[5]);
				data.push({
					x: parseFloat(m[2]),
					y: parseFloat(m[3]),
					z: parseFloat(m[4]),
					v: v
				});
			}
		}		
	});
	var lnglat_arr = idw.genLngLatArr(73.5, 18.16, 135.09, 53.56);
	var new_data = idw.interpolate(data, lnglat_arr, 6, DEFAULT_VALUE);

	var area_arr = [];
	var levels_arr = _sort(new_data);
	console.log('\n\r', levels_arr.length);
	levels_arr.forEach(function(v){
		console.log(v.data.length, v.data[0].length);
		var area = _stroke(v);
		// console.log(v.data[57][25]);
		// if(area){
		// 	area_arr = area_arr.concat(area);
		// }
	});return;
	return area_arr;
}
exports.parse = _parse_file;