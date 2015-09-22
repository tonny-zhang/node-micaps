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
			china_end_lat = 60;
						
		var data = [];
		var vals = lines.join('\s').trim().split(REG_BLANK);

		// 对数据进行处理，防止出现间隔太小的数据
		var SPACE_MIN = 0.2;
		var cha_lng = Math.abs(space_lng),
			cha_lat = Math.abs(space_lat);
		cha_lng	= cha_lng > SPACE_MIN? Math.ceil(SPACE_MIN/space_lng): 1;
		cha_lat	= cha_lat > SPACE_MIN? Math.ceil(SPACE_MIN/cha_lat): 1;

		var index_read = 0;
		for(var i = 0; i<num_lat; i++){
			var items = [];
			for(var j = 0; j<num_lng; j++){
				var x = lng_start + space_lng * j,
					y = lat_start + space_lat * i;
				var val = parseFloat(vals[index_read++]);
				if(x >= china_start_lng && x <= china_end_lng && y >= china_start_lat && y <= china_end_lat){
					if(x%cha_lng == 0 && y%cha_lat == 0){
						items.push({
							x: x,
							y: y,
							v: val
						});
					}
				}
			}
			if(items.length > 0){
				data.push(items);
			}	
		}
		var is_reverse = lat_start > lat_end; //保证纬度从小到大
		// console.log('is_reverse = '+is_reverse+', space_lat = '+space_lat+', lat_start = '+lat_start+', lat_end = '+lat_end);	
		// 重组保证和其它类型的格式及顺序一致
		var data_new = [];
		for(var i = 0, j = data.length; i<j; i++){
			var items = data[i];
			for(var i_1 = 0, j_1 = items.length; i_1<j_1; i_1++){
				(data_new[i_1] || (data_new[i_1] = []))[is_reverse?'unshift': 'push'](items[i_1]);
			}
		}
		return {
			interpolate: data_new
		};
	}
}