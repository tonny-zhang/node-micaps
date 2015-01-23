var idw = require('../interpolate/idw');

var REG_DATA_NUM = /^\d+\s+(\d+)$/;
var REG_DATA = /^(\d+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)$/;
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
				data.push({
					x: parseFloat(m[2]),
					y: parseFloat(m[3]),
					z: parseFloat(m[4]),
					v: parseFloat(m[5])
				});
			}
		}		
	});
	return data;
}
exports.parse = _parse_file;