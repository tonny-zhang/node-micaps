!function(global){
	var width_data, height_data, data_parsing, isoline_val;
	var cells = [];
	var MIN_VAL = Number.MIN_VALUE;

	function Cell(x, y){
		var left_top = data_parsing[x-1][y-1],
			right_top = data_parsing[x+1][y-1],
			left_bottom = data_parsing[x-1][y+1],
			right_bottom = data_parsing[x+1][y+1];

		var v_left_top = left_top.v,
			v_right_top = right_top.v,
			v_left_bottom = left_bottom.v,
			v_right_bottom = right_bottom.v;

		var center = (v_left_top + v_right_top + v_left_bottom + v_right_bottom)/4;

		var _this = this;
		// var data = [left_top, right_top, left_bottom, right_bottom];
		var i_val = {};
		for(var i = 0, j = isoline_val.length; i<j; i++){
			var v = isoline_val[i];
			var s3 = v - v_left_top,
				s2 = v - v_right_top,
				s4 = v - v_left_bottom,
				s1 = v - v_right_bottom;
			s1 || (s1 += MIN_VAL);
			s2 || (s2 += MIN_VAL);
			s3 || (s3 += MIN_VAL);
			s4 || (s4 += MIN_VAL);

			// console.log(s1, s2, s3, s4, v);
			var lng_lat = [];
			var codeSum = -1;
			if((s1 > 0 && s2 > 0 && s3 > 0 && s4 > 0) || (s1 < 0 && s2 < 0 && s3 < 0 && s4 < 0)){
				codeSum = 0;
			}else{
				var p_1 = 
				var lng_lat_1 = {
					x: left_top.x + (right_top.x - left_top.x)
				};
				lng_lat = [];
				var F = s1 + s2 + s3 + s4;
				if(F < 0){
					if(s1 + s4 < 0 && s1 + s2 < 0){
						codeSum = 1;
					}else if(s1+s2 < 0 && s2+s3 < 0){
						codeSum = 2;
					}else if(s2+s3 < 0 && s3+s4 < 0){
						codeSum = 3;
					}else if(s3+s4 < 0 && s1+s4 < 0){
						codeSum = 4;
					}
				}else{
					if(s1 + s3 > 0){
						var s5 = v - center;
						if(s1 + s5 < 0){
							codeSum = 5;
						}else{
							codeSum = 10;
						}
					}else{
						if(s1 + s2 < 0){
							codeSum = 6
						}else{
							codeSum = 3;
						}
					}
				}
			}
			i_val[v] = codeSum;
		}
		_this.i_val = i_val;
		_this.x = x;
		_this.y = y;
		console.log(i_val);
	}
	Cell.prototype.getVal = function(i_val){

	}
	function _initCell(){
		for(var i = 1; i<width_data-1; i++){
			var arr = [];
			for(var j = 1; j<height_data-1; j++){
				arr.push(new Cell(i, j));
			}
			cells[i-1] = arr;
		}
	}

	function _init(data, isoline_values){
		data_parsing = data;
		width_data = data_parsing.length;
		height_data = data_parsing[0].length;
		isoline_val = isoline_values;
	}
	global.isoline = function(data, isoline_values){
		_init(data, isoline_values)
	}
	global._init = _init;
	global._initCell = _initCell;
}(this);