exports.parse = function(lines, options){
	var REG_TITLE = /^((-?[\d.]+)(\s+|$)){19}/,
		REG_BLANK = /\s+/;

	var lineExtra = options.lineExtra;
	var lineTitle = lineExtra[1].trim();
	if(REG_TITLE.test(lineTitle)){
		var arr = lineTitle.split(REG_BLANK);
		var space_lng = parseFloat(arr[6]),
			space_lat = parseFloat(arr[7]),
			lng_start = parseFloat(arr[8]),
			lng_end = parseFloat(arr[9]),
			lat_start = parseFloat(arr[10]),
			lat_end = parseFloat(arr[11]),
			num_lng = parseFloat(arr[12]),
			num_lat = parseFloat(arr[13]);

		var china_start_lng = 70,
			china_start_lat = 12,
			china_end_lng = 140,
			china_end_lat = 55;
				
		var data = [];
		var vals = lines.join('\s').trim().split(REG_BLANK);
		for(var i = 0; i<num_lat; i++){
			var items = [];
			for(var j = 0; j<num_lng; j++){
				var x = lng_start + space_lng * j,
					y = lat_start + space_lat * i;
				var val = parseFloat(vals.shift());
				if(x >= china_start_lng && x <= china_end_lng && y >= china_start_lat && y <= china_end_lat){
					items.push({
						x: x,
						y: y,
						v: val
					});
				}
			}
			if(items.length > 0){
				data.push(items);
			}	
		}
		// 重组保证和其它类型的格式及顺序一致
		var data_new = [];
		for(var i = 0, j = data.length; i<j; i++){
			var items = data[i];
			for(var i_1 = 0, j_1 = items.length; i_1<j_1; i_1++){
				(data_new[i_1] || (data_new[i_1] = [])).unshift(items[i_1]);
			}
		}
		return {
			interpolate: data_new
		};
	}
}