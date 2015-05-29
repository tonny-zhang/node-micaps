!function(global){
	var data_parsing,
		width_data,
		height_data,
		x_space,
		y_space;

	var TYPE_FILL = ClipperLib.PolyFillType.pftNonZero;
	var SCALE = 1000;
	var cache_color_info = {};
	function _numFormat(num, digit) {
		return parseFloat(num.toFixed(digit || 3)) * SCALE;
	}
	function _parse(){
		for(var i = 0; i<width_data; i++){
    		var item_arr = data_parsing[i];
    		for(var j = 0; j<height_data; j++){
    			var item = item_arr[j];
    			var c = item.c;
    			var x = item.x,
    				y = item.y;
    			var x_left = _numFormat(x - x_space),
    				x_right = _numFormat(x + x_space),
    				y_top = _numFormat(y - y_space),
    				y_bottom = _numFormat(y + y_space);

    			var arr = [];
    			arr.push({
    				X: x_left,
    				Y: y_top
    			});
    			arr.push({
    				X: x_right,
    				Y: y_top
    			});	
    			arr.push({
    				X: x_right,
    				Y: y_bottom
    			});	
    			arr.push({
    				X: x_left,
    				Y: y_bottom
    			});	
				// arr.push({
    // 				X: x_left,
    // 				Y: y
    // 			});
    // 			arr.push({
    // 				X: x,
    // 				Y: y_top
    // 			});	
    // 			arr.push({
    // 				X: x_right,
    // 				Y: y
    // 			});	
    // 			arr.push({
    // 				X: x,
    // 				Y: y_bottom
    // 			});	

    			(cache_color_info[c] || (cache_color_info[c] = [])).push(arr);
    			
    		}
    	}
    	var polygons = [];
    	for(var c in cache_color_info){
    		var cpr = new ClipperLib.Clipper();
    		// ClipperLib.JS.ScaleUpPaths(clipItems, SCALE);
    		// console.log(c, cache_color_info[c]);
    		cpr.AddPaths(cache_color_info[c], ClipperLib.PolyType.ptSubject, true);
    		var solution_paths = new ClipperLib.Paths();
			cpr.Execute(ClipperLib.ClipType.ctUnion, solution_paths, TYPE_FILL, TYPE_FILL);
			// console.log(solution_paths);
			for(var i = 0, j = solution_paths.length; i<j; i++){
				polygons.push({
					c: c,
					items: solution_paths[i]
				});
			}
    	}
    	return polygons;
	}
	global.merger = function(data){
		var time_start = new Date();
		width_data = data.length;
    	height_data = data[0].length;
    	data_parsing = data;
    	x_space = (data[0][0].x - data[0][1].x)/2;
    	y_space = (data[0][0].y - data[1][0].y)/2;
    	if(x_space == 0 || y_space == 0){
    		x_space = (data[0][0].x - data[1][0].x)/2;
    		y_space = (data[0][0].y - data[0][1].y)/2;
    	}
    	// console.log(x_space, y_space, data[0][0], data[0][1]);
    	var polygons = _parse();
    	var time_end = new Date();
    	console.log('用时'+(time_end - time_start)+'ms!');
    	return polygons;
	}
}(typeof __dirname == 'undefined'? this: exports);