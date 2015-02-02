var util = require('util'),
	utils = require('../utils'),
	isInsidePolygon = utils.isInsidePolygon,
	isInLeftTopLine = utils.isInLeftTopLine,
	lineIsInsidePolygon = utils.lineIsInsidePolygon,
	polygonIsInsidePolygon = utils.polygonIsInsidePolygon;

var CONSTANT = require('../../../config/constant');

function _parse_file(line_arr){
	var REG_TOW_NUM = /^([\d.]+)\s+([\d.]+)$/,
		REG_THREE_NUM = /^([\d.]+)\s+([\d.]+)\s+([\d.]+)$/,
		REG_LINES = /^LINES: (\d+)/,
		REG_LINES_SYMBOL = /^LINES_SYMBOL: (\d+)/,
		REG_SYMBOLS = /^SYMBOLS: (\d+)/,
		REG_CLOSED_CONTOURS = /^CLOSED_CONTOURS: (\d+)/,
		REG_NOLABEL = /NoLabel/,
		REG_BLANK = /\s+/;

	var lines = {
		len: 0,
		items: []
	}
	var line_symbols = {
		len: 0,
		items: []
	};
	var symbols = {
		len: 0,
		items: []
	};
	var areas = {
		len: 0,
		items: []
	};
	var content_info = {
		lines: lines,
		line_symbols: line_symbols,
		symbols: symbols,
		areas: areas
	};

	var FLAG_READLINE = 1,
		FLAG_READLINE_WEIGHT = 2,
		FLAG_READLINE_POINTS = 3,
		FLAG_READLINE_FLAG = 4,
		FLAG_READLINE_FLAG_POINTS = 5;
		FLAG_LINES_SYMBOLE = 6,
		FLAG_LINES_SYMBOLE_POINTS = 7,
		FLAG_SYMBOLE = 8,
		FLAG_SYMBOLE_ITEM = 9,
		FLAG_OVER = 10,
		FLAG_AREA_POINTS_INFO = 11,
		FLAG_AREA_POINTS = 12,
		FLAG_AREA_LABEL_INFO = 13,
		FLAG_AREA_LABEL = 14;

	var flag,reg_m;
	line_arr.forEach(function(v,i){
		v = v.trim();
		if(reg_m = REG_LINES.exec(v)){// step 1
			lines.len = reg_m[1];
			reg_m = null;
			flag = FLAG_READLINE_WEIGHT;
			// console.log('1. LINES -> ',lines.len);
			return;
		}else if(reg_m = REG_LINES_SYMBOL.exec(v)){
			line_symbols.len = reg_m[1];
			reg_m = null;
			flag = FLAG_LINES_SYMBOLE;
			return;
		}else if(reg_m = REG_SYMBOLS.exec(v)){
			symbols.len = reg_m[1];
			// console.log('8. SYMBOLE(len:'+reg_m[1]+')');
			reg_m = null;
			flag = FLAG_SYMBOLE_ITEM;
			return;
		}else if(reg_m = REG_CLOSED_CONTOURS.exec(v)){
			areas.len = reg_m[1];
			// console.log('9. CLOSED_CONTOURS(len:'+reg_m[1]+')');
			reg_m = null;
			flag = FLAG_AREA_POINTS_INFO;
			return;
		}
		if(flag == FLAG_OVER){
			return;
		}
		// console.log(flag,v);
		if(flag == FLAG_READLINE_WEIGHT){/*step 2*/
			var m = REG_TOW_NUM.exec(v);
			if(m){
				lines.items.push({
					weight: m[1],
					point: {
						len: m[2],
						items: []
					},
					flags: {
						len: 0,
						text: '',
						items: []
					}
				});
				// console.log('2. LINES(weight:'+m[1]+',pointLen:'+m[2]+')');
			}
			flag = FLAG_READLINE_POINTS;
		}else if(flag == FLAG_READLINE_POINTS /*step 3*/ || 
				flag == FLAG_READLINE_FLAG_POINTS/*step 5*/ ||
				flag == FLAG_LINES_SYMBOLE_POINTS/*step 7*/ ||
				flag == FLAG_AREA_POINTS ||
				flag == FLAG_AREA_LABEL){
			var items = [];
			var points_arr = v.split(REG_BLANK);
			if(points_arr.length%3 != 0){
				// console.log('===',points_arr.length);
				return;
			}
			for(var i = 0,j = points_arr.length;i<j;i+=3){
				var point = {
					x: Number(points_arr[i]),
					y: Number(points_arr[i+1]),
					z: Number(points_arr[i+2])
				};
				items.push(point);
			}
			if(flag == FLAG_READLINE_POINTS){
				// console.log('3. LINES_POINT()');
				var line = lines.items[lines.items.length-1];
				// console.log(lines.items);
				line.point.items = line.point.items.concat(items);
				// console.log('3. ->',items.length,line.point.items.length);
				if(line.point.len == line.point.items.length){
					flag = FLAG_READLINE_FLAG;
				}
			}else if(flag == FLAG_READLINE_FLAG_POINTS){
				// console.log('5. LINES_POINT()');
				var line = lines.items[lines.items.length-1];
				line.flags.items = line.flags.items.concat(items);
				// console.log('5. ->',items.length,line.flags.items.length,v);
				if(line.flags.len == line.flags.items.length){/* to step 2*/
					flag = FLAG_READLINE_WEIGHT;
				}
			}else if(flag == FLAG_LINES_SYMBOLE_POINTS){
				// console.log('7. LINES_POINT()');
				var line_symbol = line_symbols.items[line_symbols.items.length-1];
				line_symbol.items = line_symbol.items.concat(items);
				if(line_symbol.items.length == line_symbol.len){
					flag = FLAG_LINES_SYMBOLE;
				}
			}else if(flag == FLAG_AREA_POINTS){
				// console.log('11. AREA_POINT()');
				var area = areas.items[areas.items.length-1];
				area.items = area.items.concat(items);
				if(area.items.length == area.len){
					flag = FLAG_AREA_LABEL_INFO;
				}
			}else if(flag == FLAG_AREA_LABEL){
				var area = areas.items[areas.items.length-1];
				var area_symbols = area.symbols;
				area_symbols.items = area_symbols.items.concat(items);
				if(area_symbols.items.length == area_symbols.len){
					flag = FLAG_AREA_POINTS_INFO;
				}

				if(areas.items.length == areas.len){
					flag = FLAG_OVER;
				}
			}	
		}else if(flag == FLAG_READLINE_FLAG/*step 4*/){
			var m = REG_TOW_NUM.exec(v);
			if(m){
				var _flags = lines.items[lines.items.length-1].flags;
				_flags.text = m[1];
				_flags.len = m[2];
				flag = FLAG_READLINE_FLAG_POINTS;
				// console.log('4. LINES_FLAG(text:'+m[1]+',len:'+m[2]+')');
			}
		}else if(flag == FLAG_LINES_SYMBOLE){/*step 6*/
			var m = REG_THREE_NUM.exec(v);
			if(m){
				line_symbols.items.push({
					code: Number(m[1]),
					weight: Number(m[2]),
					len: Number(m[3]),
					items: []
				});
				flag = FLAG_LINES_SYMBOLE_POINTS;
				// console.log('6. LINES_SYMBOLE(code:'+m[1]+',weight:'+m[2]+',len:'+m[3]+')');
			}
			
		}else if(flag == FLAG_SYMBOLE_ITEM){
			var arr = v.split(REG_BLANK);
			symbols.items.push({
				type: Number(arr[0]),
				x: Number(arr[1]),
				y: Number(arr[2]),
				z: Number(arr[3]),
				text: arr[4]
			});
			// console.log('9. symbols');
			if(symbols.items.length == symbols.len){
				flag = FLAG_OVER;
			}					
		}else if(flag == FLAG_AREA_POINTS_INFO){
			var m = REG_TOW_NUM.exec(v);
			if(m){
				areas.items.push({
					weight: Number(m[1]),
					len: Number(m[2]),
					items: []
				});
				flag = FLAG_AREA_POINTS;
				// console.log('10. area_FLAG(weight:'+m[1]+',len:'+m[2]+')');
			}
		}else if(flag == FLAG_AREA_LABEL_INFO){
			flag = FLAG_AREA_POINTS_INFO;
			var m = REG_TOW_NUM.exec(v);
			if(m){
				var area = areas.items[areas.items.length-1];
				area.symbols = {
					text: m[1],
					len: Number(m[2]),
					items: []
				}
				flag = FLAG_AREA_LABEL;
			}
		}
	});
	content_info.areas.items = content_info.areas.items.splice(3, 1);
	content_info.areas.len = content_info.areas.items.length;
	// 当有特殊的线分割面的情况时进行处理
	if(content_info.areas.len > 0 && content_info.line_symbols.len > 0){
		_parseArea(content_info);
	}
	console.log(content_info.areas.items.length, ' area');
	// 格式化数据
	_format(content_info);
	return content_info;
}
var PRECIPITATION_SNOW = 1,
	PRECIPITATION_RAIN = 2,
	PRECIPITATION_RAIN_SNOW = 3;

function _parseArea(content_info){
	// 得到所含特殊线的面
	var include_relation = {};
	var line_symbols = content_info.line_symbols.items.filter(function(v){
		return v.code == 0;
	});
	var items_area = content_info.areas.items;
	items_area.forEach(function(v,i){
		var items = v.items;
		line_symbols.forEach(function(v_line,i_line){
			if(lineIsInsidePolygon(items, v_line.items, true)){
				if(!include_relation[i]){
					include_relation[i] = [];
				}
				include_relation[i].push(i_line);
			}
		});
	});
	console.log(include_relation);
	// include_relation[0] = [0]
	var _cache_area = {};
	for(var i in include_relation){
		var line_indexs = include_relation[i];
		var _area = items_area[i],
			_items_area = _area.items.slice();
		var new_areas = [];
		while(line_indexs.length > 0){
			var c_line_index = line_indexs.shift();
			var line_items = line_symbols[c_line_index].items.slice();
			var len_new_areas = new_areas.length;
			if(len_new_areas > 0){
				for(var i_new_area = 0; i_new_area < len_new_areas; i_new_area++){
					var _items = new_areas[i_new_area].items;
					if(lineIsInsidePolygon(_items, line_items, true)){
						new_areas.splice(i_new_area, 1);
						console.log(len_new_areas, '->', new_areas.length);
						var areas = _split_area(_items, line_items, content_info);
						new_areas = new_areas.concat(areas);
						console.log(areas.length, new_areas.length);
						break;
					}
				}
			}else{
				var areas = _split_area(_items_area, line_items, content_info);
				new_areas = new_areas.concat(areas);
				console.log('init', c_line_index, areas.length, new_areas.length);
			}
		}
		var weight = _area.weight;
		var symbols = _area.symbols;
		if(weight || symbols){
			new_areas.forEach(function(val){
				if(weight){
					val.weight = weight;
				}
				if(symbols){
					val.symbols = symbols;
				}
			});
		}
		_add_area_code(content_info, new_areas);
		_cache_area[i] = new_areas;
	}
	var items_arr = [];
	content_info.areas.items.forEach(function(v,items_index){
		var _cache = _cache_area[items_index];
		if(_cache){
			items_arr = items_arr.concat(_cache);
			delete _cache_area[items_index];
		}else{
			items_arr.push(v);
		}
	});
	content_info.areas.items = items_arr;
	content_info.areas.len = items_arr.length;

	_sort_areas(content_info.areas);
	// _add_area_code(content_info);
}
// function _parseArea(content_info){
// 	var line_symbols = content_info.line_symbols.items.filter(function(v){
// 		return v.code == 0;
// 	});
// 	// 得到所含特殊线的面
// 	var include_relation = [];
// 	content_info.areas.items.forEach(function(v,i){
// 		var items = v.items;
// 		line_symbols.forEach(function(v_line,i_line){
// 			if(lineIsInsidePolygon(items,v_line.items,true)){
// 				include_relation.push([i,i_line]);
// 			}
// 		});
// 	});
// 	console.log(include_relation);
// 	// 用特殊线和面的部分点组成新的面

// 	content_info.lines = {
// 		items: [{
// 			point: {
// 				items: []
// 			},
// 			flags: {
// 				len: 0
// 			}
// 		}]
// 	};
// 	// include_relation = [[0,0], [0,1], [0,2]]
// 	var cha_index = 0,
// 		tmp_include_relation;

// 	var include_relation_bak = include_relation.slice();	
// 	var cache_area = {};
// 	while(tmp_include_relation = include_relation.shift()){
// 		var area_index = tmp_include_relation[0],
// 			line_index = tmp_include_relation[1];

// 		var line_items = line_symbols[line_index].items.slice();

// 		if(cache_area[area_index]){
// 			var cache_items = cache_area[area_index];
// 			var flag = false;
// 			for(var i = 0,j=cache_items.length;i<j;i++){
// 				var _items = cache_items[i].items;
// 				var _flag = lineIsInsidePolygon(_items,line_items,true);
// 				if(_flag){
// 					var areas = _split_area(_items,line_items,content_info);
// 					var arr = [];
// 					areas.forEach(function(v){
// 						arr.push({
// 							len: v.length,
// 							items: v,
// 							type: 'add'
// 						});
// 					});
// 					arr.unshift(1);
// 					arr.unshift(i);
// 					cache_items.splice.apply(cache_items,arr);
// 					flag = true;
// 					break;
// 				}
// 			}
// 			continue;
// 		}
// 		var area_items = content_info.areas.items[area_index].items.slice();
// 		var areas = _split_area(area_items,line_items,content_info);

// 		if(!cache_area[area_index]){
// 			cache_area[area_index] = [];
// 		}
// 		areas.forEach(function(v){
// 			cache_area[area_index].push({
// 				len: v.length,
// 				items: v,
// 				type: 'add'
// 			});
// 		});
		
// 	}
	
// 	var items_arr = [];
// 	content_info.areas.items.forEach(function(v,items_index){
// 		var in_include = false;
// 		for(var i = 0,j = include_relation_bak.length;i<j;i++){
// 			var val = include_relation_bak[i];
// 			if(val[0] == items_index){
// 				in_include = true;
// 				break;
// 			}
// 		}
// 		if(in_include){
// 			var val_cache = cache_area[items_index];
// 			if(val_cache){
// 				// 重置被切割的面的其它属性
// 				var weight = v.weight;
// 				var symbols = v.symbols;
// 				if(weight || symbols){
// 					val_cache.forEach(function(val){
// 						if(weight){
// 							val.weight = weight;
// 						}
// 						if(symbols){
// 							val.symbols = symbols;
// 						}
// 					});
// 				}
				
// 				items_arr = items_arr.concat(val_cache);
// 				delete cache_area[items_index];
// 			}
			
// 		}else{
// 			items_arr.push(v);
// 		}
// 	});
// 	content_info.areas.items = items_arr;
// 	content_info.areas.len = items_arr.length;

// 	_sort_areas(content_info.areas);
// 	_add_area_code(content_info);
// 	return ;
// }
/*得到面的面积*/
function _get_acreage(area_items){
	var len = area_items.length;
	var first_item = area_items[0];
	var minx = maxx = first_item.x,miny = maxy = first_item.y;
	for(var i = 1;i<len;i++){
		var item = area_items[i],
			x = item.x,
			y = item.y;
		if(minx > x){
			minx = x;
		}
		if(maxx < x){
			maxx = x;
		}
		if(miny > y){
			miny = y;
		}
		if(maxy < y){
			maxy = y;
		}
	}
	return (maxx - minx)*(maxy - miny);
}
/*对面数据进行排序*/
function _sort_areas(areas){
	areas.items.forEach(function(area){
		area.area = _get_acreage(area.items);
	});
	areas.items.sort(function(a,b){
		return a.area < b.area? 1: -1;
	});
	areas.items.forEach(function(area){
		delete area.area;
	});
}
function _split_area(area_items, line_items, content_info){
	var return_areas = [];
	var len = line_items.length;
	var start_line_index = 0;
	while( start_line_index < len){
		var len_return = return_areas.length;
		if(len_return > 0){
			for(var i = 0; i< len_return; i++){
				var _items = return_areas[i].items;
				var info = _split_area2two(_items, line_items, content_info, start_line_index);

				if(info){
					var areas = info.areas;
					if(areas && areas.length > 0){
						return_areas.splice(i, 1);
						return_areas = return_areas.concat(areas);
					}
					start_line_index = info.start_line_index;
					console.log('init2', start_line_index, areas.length, return_areas.length);
					break;
				}
			}
			if(i == len_return){
				break;
			}
		}else{
			var info = _split_area2two(area_items, line_items, content_info, start_line_index);
			var areas = info.areas;
			if(areas && areas.length > 0){
				return_areas = return_areas.concat(areas);
				start_line_index = info.start_line_index;
				console.log('init1', start_line_index, areas.length, return_areas.length);
			}else{
				break;
			}			
		}
	}
	return return_areas;
}
/*单线分割面(暂时不考虑单线和分割面有两个以上交点情况)*/
function _split_area2two(area_items, line_items, content_info, start_line_index){
	start_line_index || (start_line_index = 0); //检测线上点的开始索引
	var areas = []; //存储分割后的面
	var new_line_items = [];
	// 开头点的准确率很高，结尾点的准确率很低
	var _items_len = line_items.length;
	var _all_true_len = 0;
	var _flag_all_false = false;
	// 把线分割成三部分
	// console.log('===',area_items.length,line_items.length);

	// 重写得到四个端点逻辑，！！！暂时不考虑开头点不在面外面情况
	// 得到四个端点
	// console.log('\r\n============', start_line_index , _items_len);
	var start_x1,start_y1,
		start_x2,start_y2,
		start_item_1,start_item_2;
	var end_x1,end_y1,
		end_x2,end_y2,
		end_item_1,end_item_2;
	for(var i = start_line_index; i < _items_len; i++){
		var v_line_item = line_items[i];
		var flag = isInsidePolygon(area_items,v_line_item.x,v_line_item.y);
		if(flag){
			if(!start_item_2){
				start_item_2 = v_line_item;
			}else{
				end_item_1 = v_line_item;
			}
			new_line_items.push(v_line_item);
		}else{
			if(start_item_1 && start_item_2){
				end_item_2 = v_line_item
			}else{
				start_item_1 = v_line_item;
			}
		}
		if(start_item_1 && start_item_2 && end_item_1 && end_item_2){
			start_line_index = i;
			break;
		}
	}
	if(start_line_index == _items_len || !start_item_1 || !start_item_2 || !end_item_1 || !end_item_2){
		return;
	}

	// console.log(start_line_index, start_item_1 , start_item_2 , end_item_1 , end_item_2);


	// 添加方便在前端显示的有交点的四个顶点
	content_info.symbols.items.push({
		x: start_item_1.x,
		y: start_item_1.y,
		z: 0,
		type: 3
	});
	content_info.symbols.items.push({
		x: start_item_2.x,
		y: start_item_2.y,
		z: 0,
		type: 3
	});
	content_info.symbols.items.push({
		x: end_item_1.x,
		y: end_item_1.y,
		z: 0,
		type: 4
	});
	content_info.symbols.items.push({
		x: end_item_2.x,
		y: end_item_2.y,
		z: 0,
		type: 4
	});
	start_x1 = start_item_1.x;
	start_y1 = start_item_1.y;
	start_x2 = start_item_2.x,
	start_y2 = start_item_2.y;

	end_x1 = end_item_1.x;
	end_y1 = end_item_1.y;
	end_x2 = end_item_2.x,
	end_y2 = end_item_2.y;

	var start_k,start_b,end_k,end_b;
	
	if(start_x1 != start_x2){
		start_k = (start_y1-start_y2)/(start_x1-start_x2);
		start_b = (start_x1*start_y2 - start_x2*start_y1)/(start_x1-start_x2);
	}
	if(end_x1 != end_x2){
		end_k = (end_y1-end_y2)/(end_x1-end_x2);
		end_b = (end_x1*end_y2 - end_x2*end_y1)/(end_x1-end_x2);
	}

	var _jiaodian_start = _jiaodian_end = null;
	var i = 0,j=area_items.length-1,k=j+1;
	for(var i = 0,len=area_items.length-1,j=len-1;i<len;j=i++){
		var x1 = area_items[i].x,
			x2 = area_items[j].x,
			y1 = area_items[i].y,
			y2 = area_items[j].y;

		var k,b;
		if(x1 != x2){
			k = (y1-y2)/(x1-x2);
			b = (x1*y2 - x2*y1)/(x1-x2);
		}

		// 暂时不考虑两条直接垂直平行和水平平行
		if(k != start_k){
			// console.log('x1',x1,'x2',x2,'y1',y1,'y2',y2,'start_k',start_k,'start_b',start_b);
			if(k == 0){
				if(start_k != undefined){
					var _x = (b - start_b)/start_k;
    				var _y = y1;
				}else{
					var _x = start_x1,
						_y = b;
				}
			}else if(start_k == 0){
				if(k != undefined){
    				var _x = (start_b - b)/k;
    				var _y = start_y1;
    			}else{
    				var _x = x1,
						_y = start_b;
    			}
			}else{
				if(k == undefined){
					var _x = x1,
						_y = start_k * x1 + start_b;
				}else if(start_k == undefined){
					var _x = start_x1,
						_y = k * start_x1 + b;
				}else{
					var _x = (start_b - b)/(k - start_k),
						_y = (k*start_b - b*start_k)/(k - start_k);
				}
			}
			// console.log(_x,x1,x2,start_x1,start_x2,_x >= Math.min(x1,x2) && _x <= Math.max(x1,x2));
			// console.log(_y,y1,y2,start_y1,start_y2,_y >= Math.min(y1,y2) && _x <= Math.max(y1,y2));
			if(_x >= Math.min(x1,x2) && _x <= Math.max(x1,x2) && 
			   _x >= Math.min(start_x1,start_x2) && _x <= Math.max(start_x1,start_x2) && 
			   _y >= Math.min(y1,y2) && _y <= Math.max(y1,y2) && 
			   _y >= Math.min(start_y1,start_y2) && _y <= Math.max(start_y1,start_y2)){
			   	_jiaodian_start = [_x,_y,i,j];
				// console.log('start_v_x,start_v_y',i,j,k,start_k,_x,_y);
				// 添加开头的分割点
				// content_info.symbols.items.push({
				// 	x: _x,
				// 	y: _y,
				// 	z: 0,
				// 	type: 4
				// });
			}
		}
		if(k != end_k){
			var _x,_y;
			// console.log('x1',x1,'x2',x2,'y1',y1,'y2',y2,'start_k',start_k,'start_b',start_b);
			if(k == 0){
				if(end_k != undefined){
					var _x = (b - end_b)/end_k;
    				var _y = y1;
				}else{
					var _x = end_x1,
						_y = b;
				}
			}else if(start_k == 0){
				if(k != undefined){
    				var _x = (end_b - b)/k;
    				var _y = end_y1;
    			}else{
    				var _x = x1,
						_y = end_b;
    			}
			}else{
				if(k == undefined){
					var _x = x1,
						_y = end_k * x1 + end_b;
				}else if(end_k == undefined){
					var _x = end_x1,
						_y = k * end_x1 + b;
				}else{
					var _x = (end_b - b)/(k - end_k),
						_y = (k*end_b - b*end_k)/(k - end_k);
				}
			}
			// console.log(i,j,_x,_y,x1,x2,end_x1,end_x2,_x >= Math.min(x1,x2) && _x <= Math.max(x1,x2));
			if(_x >= Math.min(x1,x2) && _x <= Math.max(x1,x2) && 
			   _x >= Math.min(end_x1,end_x2) && _x <= Math.max(end_x1,end_x2) && 
			   _y >= Math.min(y1,y2) && _y <= Math.max(y1,y2) && 
			   _y >= Math.min(end_y1,end_y2) && _y <= Math.max(end_y1,end_y2)){
				// console.log('end_v_x,end_v_y',i,j,k,end_k,_x,_y);
				_jiaodian_end = [_x,_y,i,j];
				// 添加结尾的分割点
				// content_info.symbols.items.push({
				// 	x: _x,
				// 	y: _y,
				// 	z: 0,
				// 	type: 4
				// });
			}
		}
	}
	// console.log('jiaodian_info',_jiaodian_start,_jiaodian_end);
	// 根据开始和结尾的交点从面数据里截取点片段和和特殊线组合成新的面
	if(_jiaodian_start && _jiaodian_end){
		var start_index = _jiaodian_start[2],
			end_index = _jiaodian_end[2];

		// 从面数据里截取点片段
		var add_items = [],
			add_items_other = [];
		// console.log('start_index,end_index',start_index,end_index);
		if(start_index > end_index){
			// add_items = area_items.slice(0,start_index+1).reverse();//.concat(area_items.slice(end_index).reverse());
			// add_items = area_items.slice(end_index).concat(area_items.slice(0,start_index+1));
			add_items = area_items.slice(end_index,start_index + 1).reverse();
			add_items_other = area_items.slice(start_index).concat(area_items.slice(0,end_index));
			// add_items = area_items;
		}else{
			// add_items = area_items.splice(start_index,end_index - start_index + 1);
			// add_items = area_items.slice(0,2).reverse();
			add_items = area_items.slice(start_index,end_index + 1);
			add_items_other = area_items.slice(end_index).concat(area_items.slice(0,start_index)).reverse();
		}
		// console.log('len -- '+area_items.length,add_items.length,new_line_items.length);
		
		add_items[0].x = _jiaodian_start[0];
		add_items[0].y = _jiaodian_start[1];
		add_items[add_items.length-1].x = _jiaodian_end[0];
		add_items[add_items.length-1].y = _jiaodian_end[1];
		
		var first_new_line_point = new_line_items[0],
			last_new_line_point = new_line_items[new_line_items.length-1];
		// 根据四个点的距离进行追加判断
		if(Math.pow(_jiaodian_start[0]-first_new_line_point.x,2)+Math.pow(_jiaodian_start[1]-first_new_line_point.y,2) > 
		   Math.pow(_jiaodian_end[0]-first_new_line_point.x,2)+Math.pow(_jiaodian_end[1]-first_new_line_point.y,2)){
			// new_line_items = new_line_items.concat(add_items);
		}else{
			// new_line_items = new_line_items.concat(add_items.reverse());
			add_items.reverse();
			add_items_other.reverse();
		}
		if(_jiaodian_start[0] != first_new_line_point.x && _jiaodian_start[1] != first_new_line_point.y){
			add_items.splice(-1,1,{
				x: _jiaodian_start[0],
				y: _jiaodian_start[1],
				z: 0
			});
			add_items.splice(0,1,{
				x: _jiaodian_end[0],
				y: _jiaodian_end[1],
				z: 0
			});
			add_items_other.splice(-1,1,{
				x: _jiaodian_start[0],
				y: _jiaodian_start[1],
				z: 0
			});
			add_items_other.splice(0,1,{
				x: _jiaodian_end[0],
				y: _jiaodian_end[1],
				z: 0
			});
		}
		areas = [new_line_items.concat(add_items),new_line_items.concat(add_items_other)];
	}

	// var new_areas = [];
	areas.forEach(function(v, i){
		areas[i] = {
			len: v.length,
			items: v,
			type: 'add'
		}
	});
	// areas.forEach(function(v, i){
	// 	var other_areas = _split_area(v.items, line_items, content_info, start_line_index);
	// 	if(other_areas && other_areas.length > 0){
	// 		areas = areas.concat(other_areas);
	// 	}
	// });
	// var other_areas = _split_area(area_items, line_items, content_info, start_line_index);
	// if(other_areas && other_areas.length > 0){
	// 	areas = areas.concat(other_areas);
	// }
	return {
		areas: areas,
		start_line_index: start_line_index
	};
}

var CODE_MORE = 48;

/*给面添加状态码*/
function _add_area_code(content_info, areas){
	var relation = [];
	// var areas = content_info.areas.items;
	var symbols = content_info.symbols.items;
	areas.forEach(function(area,area_index){
		var area_items = area.items;
		var symbols_index = [];
		symbols.forEach(function(symbol_item,symbol_index){
			var type = symbol_item.type;
			if(23 == type || 24 == type || 26 == type || 48 == type){
				var flag = isInsidePolygon(area_items,symbol_item.x,symbol_item.y);
				if(flag){
					symbols_index.push(symbol_item);
				}
			}
		});
		if(symbols_index.length > 0){
			relation.push({
				area_index: area_index,
				symbols_index: symbols_index.sort(function(a,b){
					return a.type > b.type?1:-1;
				})
			});
		}
	});
	// console.log(relation[0].symbols_index);
	var special_relation = [];
	relation.forEach(function(v){
		var area_index = v.area_index;
		// 只考虑完全包涵，并是层级递进关系
		var symbols_index = v.symbols_index;
		var len = symbols_index.length;
		var is_sub = true;
		for(var i = 0;i<len;i++){
			var type = symbols_index[i].type;
			if(type != CODE_MORE){
				areas[area_index].code = type;
				return;
			}
		}
		special_relation.push(area_index);
	});
	var areas_len = areas.length;
	special_relation.forEach(function(v_relation){
		var sub_area = areas[v_relation];
		for(var i = v_relation - 1;i>= 0;i--){
			var p_area = areas[i];
			var flag = polygonIsInsidePolygon(p_area.items,sub_area.items);
			if(flag){
				sub_area.code = p_area.code;
				continue;				
			}
		}
	});
	
	areas.forEach(function(v,i_no_code){
		if(!('code' in v)){
			for(var i = i_no_code - 1;i>= 0;i--){
				var p_area = areas[i];
				var flag = polygonIsInsidePolygon(p_area.items,v.items,true);
				if(flag){
					v.code = p_area.code;
					break;				
				}
			}
		}
	});
}
/*对数据进行格式化(数据精简)*/
function _format(content_info){
	var items = content_info.line_symbols.items;
	// .filter(function(v){
	// 	return v.code != 0;
	// });
	var len = items.length;
	if(len > 0){
		content_info.line_symbols.items = items;
		content_info.line_symbols.len = len;
	}else{
		delete content_info.line_symbols;
	}
	var areas_items = content_info.areas.items;
	areas_items.forEach(function(v){
		delete v.len;
		var _symbols = v.symbols;
		if(_symbols){
			delete _symbols.len;
		}
	});
	content_info.areas = areas_items;
	if(content_info.line_symbols){
		var line_symbols_items = content_info.line_symbols.items;
		line_symbols_items.forEach(function(v){
			delete v.len;
		});
		content_info.line_symbols = line_symbols_items;
	}
	var line_items = content_info.lines.items;
	line_items.forEach(function(v){
		delete v.flags.len;
		v.point = v.point.items;
	});
	content_info.lines = line_items;
	content_info.symbols = content_info.symbols.items;
}
exports.parse = _parse_file;