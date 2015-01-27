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
	// console.log('arr',arr,width, height);
	return arr;
}
// 对数据进行等级分组
function _sort(data){
	var levels_arr = {};
	var _width = data.length;
	data.forEach(function(v, x){
		v.forEach(function(v_v, y){
			var level = _parse_level(v_v.v);
			v_v.l = level;
			if(level != undefined){
				for(var i = 1; i <= level; i++){
					if(!levels_arr[i]){
						levels_arr[i] = _getArray(_width, v.length);
					}
					
					levels_arr[i][x][y] = v_v;
				}
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
	// return;
	// console.log('len',arr[2].level, arr[2].data);
	// return;
	return arr;
}
var MIN_AREA_POINTS = 3;// 画多边形的最少点数
var MIN_SPACE = 2;//多边形连线时的最小间隔点数
var _stroke = (function(){
	var _data,
		_width,
		_height;
	
	function _is_have_val(point){
		return point != undefined && point.v != DEFAULT_VALUE;
	}
	function _point_weight(x, y){var arr = [];
		var sum = 0;
		var current_point;
		try{
			current_point = _data[x][y];
		}catch(e){}
		if(_is_have_val(current_point)){
			for(var i = x - 1, j = x + 1; i<=j; i++){
				for(var i_y = y - 1, j_y = y + 1; i_y<=j_y; i_y++){
					if(i == x && i_y == y){
						continue;
					}
					var c;
					try{
						c = _data[i][i_y];
					}catch(e){}
					if(_is_have_val(c)){
						arr.push([i, i_y, c.v]);
						sum ++;
					}
				}
			}
		}
		return {
			x: x,
			y: y,
			sum: sum,
			// arr: arr
		};
	}
	// 对点进行标记
	var _cache_flag = (function(){
		var _cache = {};
		var _cache_stroke = {};
		return {
			init: function(){
				_cache = {};
			},
			trim_flag: function(){
				for(var x in _cache){
					var y_arr = _cache[x].sort(function(a, b){
						return a > b;
					});
					// console.log('y_arr', x, y_arr);
					var data_x = _data[x];
					var new_y_arr = [];
					var start_y = y_arr.shift();
					
					var to_y, start_y_tmp = start_y;
					while((to_y = y_arr.shift()) != undefined){
						for(var i = start_y_tmp; i < to_y; i++){
							if(!_is_have_val(data_x[i])){
								break;
							}
						}
						if(i == to_y){
							new_y_arr.pop();
							new_y_arr.pop();
						}else{
							start_y = to_y;
						}
						new_y_arr.push(start_y);
						new_y_arr.push(to_y);
						start_y_tmp = to_y;
					}
					_cache[x] = new_y_arr;
					// console.log('newyarr', _cache[x]);
				}
			},
			flag: function(x, y, area_index){
				console.log('flag', x, y);
				if(!_cache[x]){
					_cache[x] = [];
				}
				_cache[x].push(y);
			},
			check: function(x, y){
				var flag = x == 20 && y == 4;
				var v_y = _cache[x];
				// if(flag){
				// 	console.log('check1', y, v_y);
				// }
				if(v_y){
					var len = v_y.length;
					if(len > 0){
						for(var i = 0; i<len; i+=2){
							var start_v = v_y[i],
								end_v = v_y[i+1];
							// console.log('check2', i, start_v, end_v);
							if(y >= start_v && y <= end_v){
								// console.log(x, y, start_v, end_v);
								return false;
							}
						}
					}
				}
				if(_cache_flag.is_flag_stoke(x, y)){
					return false;
				}
				return true;
			},
			flag_stoke: function(x, y){
				console.log();
				_cache_stroke[[x, y].join('_')] = 1;
			},
			is_flag_stoke: function(x, y){
				return !!_cache_stroke[[x, y].join('_')];
			}
		}
	})();
	function _next(x, y, prev_point){
		_cache_flag.flag_stoke(x, y);
		var x0 = x - 1,
			x1 = x,
			x2 = x + 1;
		var y0 = y - 1,
			y1 = y,
			y2 = y + 1;

		var left_top = [],
			right_bottom = [];	
		var sum02 = _point_weight(x2, y0), 	//右上
			sum12 = _point_weight(x2, y1),	//右
			sum22 = _point_weight(x2, y2),	//右下
			sum21 = _point_weight(x1, y2),	//下
			sum20 = _point_weight(x0, y2),	//左下
			sum10 = _point_weight(x0, y1),	//左
			sum00 = _point_weight(x0, y0),	//左上
			sum01 = _point_weight(x1, y0);	//上

		// console.log('_next_'+x+'_'+y);
		// // if(x == 10 && y == 3){
		// 	console.log(_point_weight(x, y));
		// 	console.log(sum02);
		// 	console.log(sum12);
		// 	console.log( sum22);
		// 	console.log( sum21);
		// 	console.log(sum20);
		// 	console.log(sum10);
		// 	console.log(sum00);
		// 	console.log(sum01);
		// // }
		if(sum02.sum >=2){
			right_bottom.push(sum02);
		}
		if(sum12.sum >=2){
			right_bottom.push(sum12);
		}
		if(sum22.sum >=2){
			right_bottom.push(sum22);
		}
		if(sum21.sum >=2){
			right_bottom.push(sum21);
		}

		if(sum20.sum >=2){
			left_top.push(sum20);
		}
		if(sum10.sum >=2){
			left_top.push(sum10);
		}
		if(sum00.sum >=2){
			left_top.push(sum00);
		}
		if(sum01.sum >=2){
			left_top.push(sum01);
		}

		// var is_right = sum01.sum == 0 || sum21.sum != 0,
		// 	is_up = sum10.sum == 0;
		// if(is_up){
		// 	if(is_right){
		// 		is_right = false;
		// 	}
		// }
		var len_right_bottom = right_bottom.length,
			len_left_top = left_top.length;
		var is_right = (sum01.sum == 0 || sum21.sum != 0) && len_right_bottom > 0;
		if(is_right && sum01.sum != 0){
			if(_cache_flag.is_flag_stoke(sum01.x, sum01.y)){
				if(sum01.x == _first_point[0] && sum01.y == _first_point[1]){// 是第一个点时跳出
					return;
				}
			}
			is_right = false;
		}
		if(!is_right && sum21.sum != 0 && !_cache_flag.is_flag_stoke(sum21.x, sum21.y)){
			is_right = true;
		}
		// if(prev_point){
		// 	if(is_right){
		// 		if(prev_point.is_right){
		// 			// if(len_left_top > 0 && len_left_top < len_right_bottom){
		// 			// 	is_right = false;
		// 			// }
		// 		}else{
		// 			if(len_left_top > 0){
		// 				is_right = false;
		// 			}
		// 		}
		// 	}
		// }
		// if(is_right && !dir_is_right){
		// 	console.log('change right', x, y);
		// 	if(left_top.length > 0){
		// 		is_right = false;
		// 	}
		// }
		// console.log(is_right, right_bottom);
		var select_area = is_right? right_bottom: left_top;
		if(select_area.length > 0){
			var tmp;
			while((tmp = select_area.shift())){
				if(!_cache_flag.is_flag_stoke(tmp.x, tmp.y)){
					_cache_flag.flag_stoke(tmp.x, tmp.y);
					tmp.is_right = is_right;
					return tmp;
				}
			}
		}
	}
	var _first_point;//用于缓存第一个点信息
	return function(data){
		var level = data.level;
		_data = data.data;
		_width = _data.length;
		// require('fs').writeFileSync('./1.json', JSON.stringify(_data));
		_cache_flag.init();
		// console.log('\n\rnextVal',_next(23, 8));return;
		// console.log('\n\rnextVal',_next(18, 8));
		// console.log('\n\rnextVal',_next(18, 9));

		if(_width > 0 && _data[0] && (_height = _data[0].length) && _height * _width >= MIN_AREA_POINTS){
			console.log('width = ',_width,'height = ', _height);
			var areas = [];
			while(1){
				var next_info, current_x = 0, current_y = 0;
				var area_items = [];
				// 顺时针进行数据添加
				// 先找到第一个点
				var first_point = null;
				for(var i_x = 0; i_x < _width; i_x++){
					var column = _data[i_x];
					for(var i_y = 0; i_y < _height; i_y++){
						var _v = column[i_y];
						if(_is_have_val(_v) && _cache_flag.check(i_x, i_y)){
							first_point = _v;
							current_x = i_x, current_y = i_y
							break;
						}
					}
					if(first_point){
						break;
					}
				}
				console.log('\r\n==========================\r\nfirst_point', first_point, current_x, current_y);
				if(!first_point){
					break;
				}
				_first_point = [current_x, current_y];
				_cache_flag.flag(current_x, current_y);
				_cache_flag.flag(current_x, current_y);
				// console.log(first_point, i_x, i_y);
				var prev_is_right = true;
				while((next_info = _next(current_x, current_y, next_info))){
					console.log('next_info', next_info);
					prev_is_right = next_info.is_right;
					// _data[y][x] = undefined;
					current_x = next_info.x;
					current_y = next_info.y;
					area_items.push(_data[current_x][current_y]);
					_cache_flag.flag(current_x, current_y);

				}
				if(area_items.length >= 3){
					area_items.unshift(first_point);
					areas.push(area_items);
					console.log('put_area', area_items.length);
				}
				_cache_flag.trim_flag();
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

	require('fs').writeFile('./gedian.json', JSON.stringify(levels_arr));

	var area_arr = [];
	var levels_arr = _sort(new_data);
	require('fs').writeFile('./1.json', JSON.stringify(levels_arr));
	// console.log(levels_arr[1].data[0].length);
	// console.log('\r\nresult',_stroke(levels_arr[1]));return;
	// console.log('\n\r', levels_arr.length);
	levels_arr.forEach(function(v){
	// 	console.log(v.level);return;
		var area = _stroke(v);
	// 	// console.log(v.data[57][25]);
		if(area){
			console.log(area.length);
			area_arr = area_arr.concat(area);
		}
	});
	return area_arr;
}
exports.stroke = _stroke;
exports.parse = _parse_file;