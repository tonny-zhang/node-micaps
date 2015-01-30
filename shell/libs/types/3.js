var idw = require('../interpolate/idw');

var DEFAULT_VALUE = 999999;
var REG_DATA_NUM = /^\d+\s+(\d+)$/;
var REG_DATA = /^(\d+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(-?[\d.]+)$/;

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
	var new_data = idw.interpolate(data, lnglat_arr, 4, DEFAULT_VALUE, true);
	return new_data;
}
exports.parse = _parse_file;