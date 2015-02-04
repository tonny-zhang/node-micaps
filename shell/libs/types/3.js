var idw = require('../interpolate/idw');
var digit_util = require('../utils').Digit;

var DEFAULT_VALUE = 999999;
var REG_DATA_NUM = /^\d+\s+(\d+)$/;
var REG_DATA = /^(\d+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(-?[\d.]+)$/;

function _parse_file(lines, option){
	var data = [];
	lines.forEach(function(line){
		line = line.trim();
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
	});
	option || (option = {});
	var default_option = {
		x0: 73.5,
		y0: 18.16,
		x1: 139,
		y1: 54,
		grid_space: 0.5,
		numOfNearest: 4,
		default_val: DEFAULT_VALUE,
		interpolation_all: false
	}
	for(var i in default_option){
		if(option[i] === undefined){
			option[i] = default_option[i];
		}
	}
	console.log(option);
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
}
exports.parse = _parse_file;