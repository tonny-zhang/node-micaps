var idw = require('../interpolate/idw');
var digit_util = require('../utils').Digit;

var DEFAULT_VALUE = 999999;
var DEFAULT_COLOR = 'rgba(0,0,0,0)';
var REG_DATA_NUM = /^\d+\s+(\d+)$/;
var REG_DATA = /^(\d+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(-?[\d.]+)$/;

function _parse_file(lines, option){
	option || (option = {});
	var default_option = {
		x0: 72.5,
		y0: 17.5,
		x1: 137,
		y1: 55,
		grid_space: 0.5,
		numOfNearest: 5,
		default_val: DEFAULT_VALUE,
		interpolation_all: false,
		num_of_cols: 5,
		val_col: 5,
		arithmetic: null
	}
	for(var i in default_option){
		if(option[i] === undefined || option[i] === null){
			option[i] = default_option[i];
		}
	}
	var arithmetic = (function(){
		var methods = {'*': 1};

		var option_arithmetic = option.arithmetic;
		var type;
		if(option_arithmetic && (type = option_arithmetic.type) && methods[type]){
			var val = option_arithmetic.val;
			if(val){
				return ({
					'*': function(v){
						return v*val;
					}
				})[type];
			}
		}
		return function(val){
			return val;
		}
	})();
	var default_val = option.default_val;
	var val_col = option.val_col - 1;
	var numOfCols = option.num_of_cols - 3;
	var REG_DATA = new RegExp('^\\d+\\s+[\\d.]+\\s+[\\d.]+(\\s+[-\\d.]+){'+numOfCols+'}$');
	var data = [];
	lines.forEach(function(line){
		line = line.trim();
		if(REG_DATA.test(line)){
			var arr = line.split(/\s+/);
			var v = arr[val_col];
			if(!isNaN(v) && v != default_val){
				data.push({
					x: parseFloat(arr[1]),
					y: parseFloat(arr[2]),
					// z: parseFloat(arr[3]),
					v: arithmetic(parseFloat(v)),
				});
			}
		}	
	});
	
	var lnglat_arr = idw.genLngLatArr(option.x0, option.y0, option.x1, option.y1, option.grid_space);
	var new_data = idw.interpolate(data, lnglat_arr, option.numOfNearest, option.default_val, option.interpolation_all);
	// 对格点上的数据值进行格式化，减小文件体积
	for(var i = 0, j = new_data.length; i < j; i++){
		var items = new_data[i];
		for(var y = 0, y_len = items.length; y < y_len; y++){
			items[y].v = parseFloat(digit_util.toFixed(items[y].v));
		}
	}
	return {
		interpolate: new_data
	};
	// return {
	// 	interpolate: data
	// };
}
exports.parse = _parse_file;