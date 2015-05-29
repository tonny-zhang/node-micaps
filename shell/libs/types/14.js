var util = require('util'),
	utils = require('../utils'),
	isInsidePolygon = utils.isInsidePolygon,
	isInLeftTopLine = utils.isInLeftTopLine,
	lineIsInsidePolygon = utils.lineIsInsidePolygon,
	polygonIsInsidePolygon = utils.polygonIsInsidePolygon;

var PI = Math.PI;
var _options;
/*个部调用的解析入口主程序*/
function _parse_file(line_arr, options){
	_options = options;
	var REG_TOW_NUM = /^(-?[\d.]+)\s+([\d.]+)$/,
		REG_THREE_NUM = /^([\d.]+)\s+([\d.]+)\s+([\d.]+)$/,
		REG_LINES = /^LINES:\s*(\d+)/,
		REG_LINES_SYMBOL = /^LINES_SYMBOL:\s*(\d+)/,
		REG_SYMBOLS = /^SYMBOLS:\s*(\d+)/,
		REG_CLOSED_CONTOURS = /^CLOSED_CONTOURS:\s*(\d+)/,
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
	//先初始化面积，方便排序
	var items_area = content_info.areas.items;
	var new_items = [];
	items_area.forEach(function(v, i){
		if(v.symbols){ //对没有标识的面进行过滤
			var items = v.items;
			v.area = _get_acreage(items);
			new_items.push(v);
		}
	});
	content_info.areas.len = new_items.length;
	content_info.areas.items = new_items;
	// content_info.areas.items = content_info.areas.items.splice(5, 1);
	// content_info.areas.len = content_info.areas.items.length;
	// // // console.log(content_info.areas.len , content_info.line_symbols.len);
	// // // 当有特殊的线分割面的情况时进行处理
	// // // console.log(content_info.areas);
	// // // content_info.areas = {len: 1, items: [content_info.areas.items[0]]};
	if(content_info.areas.len > 0 && content_info.line_symbols.len > 0){
		_parseArea(content_info);
		// console.log('get '+ content_info.areas.items.length+' areas!');
	}
	_sort_areas(content_info.areas);
	// 格式化数据
	_format(content_info);
	/*这里基于数据层的clip操作会影响整个数据的读取时间，暂时去掉*/
	// _doclip(content_info, _options);
	return content_info;
}

var CODE_SNOW = 23, 	//雪
	CODE_RAIN = 26,		//雨
	CODE_RAIN_SNOW = 24,//雨夹雪
	CODE_MORE = 48;		//更高一个等级

/*对面进行解析入口*/
function _parseArea(content_info){
	// 得到所含特殊线的面
	var include_relation = {};
	var line_symbols = content_info.line_symbols.items.filter(function(v){
		return v.code == 0;
	});
	_sort_areas(content_info.areas);
	_add_area_code(content_info);
	var items_area = content_info.areas.items;
	items_area.forEach(function(v, i){
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
	// console.log('include_relation', include_relation);
	// include_relation = {'2': [3, 4, 5]};
	// console.log('include_relation', include_relation);
	var _cache_area = {};
	for(var i in include_relation){
		var line_indexs = include_relation[i];
		var _area = items_area[i];
		var code_list = _area.code_list;
		var is_use_line_area = code_list.length == 0 || code_list.indexOf(CODE_RAIN) == -1 && code_list.indexOf(CODE_SNOW) == -1;
		
		var new_areas = [];
		while(line_indexs.length > 0){
			var c_line_index = line_indexs.shift();
			var line_items = line_symbols[c_line_index].items.slice();
			var len_new_areas = new_areas.length;
			if(len_new_areas > 0){
				for(var i_new_area = 0; i_new_area < len_new_areas; i_new_area++){
					var _item_new_areas = new_areas[i_new_area];
					var _items = _item_new_areas.items;
					if(lineIsInsidePolygon(_items, line_items, true)){
						new_areas.splice(i_new_area, 1);
						var _areas_splited = _split_area(_item_new_areas, line_items, content_info, is_use_line_area);
						new_areas = new_areas.concat(_areas_splited);
						// console.log(i, 'init02', _areas_splited.length, new_areas.length, c_line_index);
						break;
					}
				}
			}else{
				var _areas_splited = _split_area(_area, line_items, content_info, is_use_line_area);
				new_areas = new_areas.concat(_areas_splited);
				// console.log(i, 'init01', _areas_splited.length, new_areas.length, i, c_line_index,_area.items.length, line_items.length);
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
}
function getArea(points){
	var len = points.length;
	if(len > 0){
		var S = 0;
		for(var i = 0, j = len - 1; i<j; i++){
			var p_a = points[i],
				p_b = points[i + 1];
			S += p_a.x * p_b.y - p_b.x*p_a.y;
		}
		var p_a = points[j],
			p_b = points[0];
		S += p_a.x * p_b.y - p_b.x*p_a.y;
		return S/2;
	}
	return 0;
}
/*得到多边形所在矩形的面积*/
function _get_acreage(area_items){
	return Math.abs(getArea(area_items));
}

/*对面数据进行排序*/
function _sort_areas(areas){
	// areas.items.forEach(function(area){
	// 	area.area = _get_acreage(area.items);
	// });
	areas.items.sort(function(a,b){
		return a.area < b.area? 1: -1;
	});
	// areas.items.forEach(function(area){
	// 	delete area.area;
	// });
}
/*线分割面成多个面*/
function _split_area(area, line_items, content_info, is_use_line_area){
	var area_items = area.items.slice();
	var code_list = area.code_list;
	var return_areas = [];
	var len = line_items.length;
	var start_line_index = 0;
	while( start_line_index < len){
		var len_return = return_areas.length;
		if(len_return > 0){
			for(var i = 0; i< len_return; i++){
				var _items = return_areas[i].items;
				var info = _split_area2two(_items, line_items, content_info, start_line_index, code_list, is_use_line_area);

				if(info){
					var areas = info.areas;
					if(areas && areas.length > 0){
						return_areas.splice(i, 1);
						for(var i_area = 0, j_area = return_areas.length; i_area < j_area; i_area++){
							var test_area = return_areas[i_area];
							var test_area_kind = test_area.kind;
							var test_area_public_line = test_area.public_line;
							var is_a = lineIsInsidePolygon(areas[0].items, test_area_public_line);
							if(is_a){
								areas[0].kind = !test_area_kind;
								areas[1].kind = test_area_kind;
							}else if((is_a = lineIsInsidePolygon(areas[1].items, test_area_public_line))){
								areas[0].kind = test_area_kind;
								areas[1].kind = !test_area_kind;
							}
							if(is_a){
								break;
							}
						}
						
						return_areas = return_areas.concat(areas);
					}
					start_line_index = info.start_line_index;
					// console.log('init2', start_line_index, areas.length, return_areas.length);
					break;
				}
			}
			if(i == len_return){
				break;
			}
		}else{
			var info = _split_area2two(area_items, line_items, content_info, start_line_index, code_list, is_use_line_area);
			if(info){
				var areas = info.areas;
				if(areas && areas.length > 0){
					areas[0].kind = true;
					areas[1].kind = false;
					return_areas = return_areas.concat(areas);
					// console.log('init1', start_line_index, areas.length, return_areas.length);
				}
				start_line_index = info.start_line_index;
			}else{
				break;
			}
		}
	}
	
	//利用分割得到的面的共同特征对面的编码进行填充（只对没有编码强对应关系的面进行同类填充）
	var special_area_index = [];
	return_areas.forEach(function(v, i){
		var code_new = [];
		v.code_list.forEach(function(v_code){
			var type = v_code.type;
			if(v_code.is_split && v_code.is_in && type != CODE_MORE && code_new.indexOf(type) == -1){
				code_new.push(type);
			}
		});
		var len = code_new.length;
		if(len == 1){
			v.code = code_new[0];
		}else if(len == 0){
			special_area_index.push(i);
		}
	});
	special_area_index.forEach(function(v){
		var kind = return_areas[v].kind;
		for(var i = 0, j = return_areas.length; i<j; i++){
			if(i != v){
				var test_area = return_areas[i];
				if(test_area.kind === kind && test_area.code){
					return_areas[v].code = test_area.code;
					break;
				}
			}
		}
	});
	return return_areas;
}

/*线段把面分割成两部分*/
function _split_area2two(area_items, line_items, content_info, start_line_index, code_list, is_use_line_area){
	start_line_index || (start_line_index = 0); //检测线上点的开始索引
	var areas = []; //存储分割后的面
	var new_line_items = [];
	// 开头点的准确率很高，结尾点的准确率很低
	var _items_len = line_items.length;

	// 重写得到四个端点逻辑，！！！暂时不考虑开头点不在面外面情况
	// 得到四个端点
	// console.log('start_line_index', start_line_index , _items_len);
	var start_x1,start_y1,
		start_x2,start_y2,
		start_item_1,start_item_2;
	var end_x1,end_y1,
		end_x2,end_y2,
		end_item_1,end_item_2;

	/*这里暂时不考虑线在面外没有两头问题*/
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

	// 添加方便在前端显示的有交点的四个顶点
	// content_info.symbols.items.push({
	// 	x: start_item_1.x,
	// 	y: start_item_1.y,
	// 	z: 0,
	// 	type: 3
	// });
	// content_info.symbols.items.push({
	// 	x: start_item_2.x,
	// 	y: start_item_2.y,
	// 	z: 0,
	// 	type: 3
	// });
	// content_info.symbols.items.push({
	// 	x: end_item_1.x,
	// 	y: end_item_1.y,
	// 	z: 0,
	// 	type: 4
	// });
	// content_info.symbols.items.push({
	// 	x: end_item_2.x,
	// 	y: end_item_2.y,
	// 	z: 0,
	// 	type: 4
	// });
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

		var k = b = undefined;
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
			// console.log('->x1 = ',x1,', x2= ',x2,', y1=',y1,',y2=',y2,',start_k=',start_k,',start_b=',start_b,'end_k=',end_k,'end_b=',end_b,'k=',k);
			if(k == 0){
				if(end_k != undefined){
					var _x = (b - end_b)/end_k;
    				var _y = y1;
				}else{
					var _x = end_x1,
						_y = b;
				}
			}else if(end_k == 0){
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
			// if(i == 36 || i == 37)
			// console.log(i,j,_x,x1,x2,_x >= Math.min(x1,x2) && _x <= Math.max(x1,x2));
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
		areas = [new_line_items.concat(add_items), new_line_items.concat(add_items_other)];
	}

	// var new_areas = [];
	areas.forEach(function(v, i){
		var new_code_list = [];
		code_list.forEach(function(code_v, code_i){
			var is_in = isInsidePolygon(v, code_v.x, code_v.y);	
			new_code_list.push({
				type: code_v.type,
				x: code_v.x,
				y: code_v.y,
				is_in: is_in,
				is_split: true
			});
		});
		new_code_list.push(_getCodeByLine(v, new_line_items));
		// console.log(new_code_list, _getCodeByLine(v, new_line_items));
		// if(new_code_list.length == 0 && is_use_line_area){
		// 	new_code_list = [_getCodeByLine(v, new_line_items)];
		// }
		areas[i] = {
			public_line: new_line_items,
			area: _get_acreage(v),
			code_list: new_code_list, //原始面被分割后，对分分割后的面进行code填充
			len: v.length,
			items: v,
			type: 'add'
		}
	});
	
	return {
		public_line: new_line_items,
		areas: areas,
		start_line_index: start_line_index
	};
}

/*用雨雪分割线分割面得到状态码*/
/*这里的检验只针对简单的分割是有效的，但如果一条把面分割成多个面时，检测小面和小线关系的时候就可能会出现误差，这个结果只供特定环境下参考*/
function _getCodeByLine(area, public_line){
	var point_start = public_line[0],
		point_end = public_line[public_line.length-1],
		x_start = point_start.x,
		y_start = point_start.y,
		x_end = point_end.x,
		y_end = point_end.y;
	var angle = Math.atan2(point_end.y - point_start.y, point_end.x - point_start.x);
	if(angle < 0){
		angle += PI;
	}
	area = area.filter(function(v){
		if(public_line.indexOf(v) == -1){
			return v;
		}
	});
	var CODE_SNOW_ADD = {
		type: CODE_SNOW,
		is_add: 1
	}, CODE_RAIN_ADD = {
		type: CODE_RAIN,
		is_add: 1
	};
	var len = area.length;
	if(angle == PI/2){
		var in_num = 0;
		for(var i = 0; i<len; i++){
			if(area[i].x < x_start){
				in_num++;
			}
		}
		return (in_num/len > 0.5)? CODE_SNOW_ADD: CODE_RAIN_ADD;
	}else{
		var k = (y_end - y_start)/(x_end - x_start);
			b = (x_start*y_end - x_end*y_start)/(x_start - x_end);

		/*(0, PI/2) 左上为雪；(PI/2, PI)左下为雪*/
		var snow_num = 0;
		var flag = angle >= 0 && angle < PI/2;
		for(var i = 0; i<len; i++){
			var item = area[i],
				x = item.x,
				y = item.y;
			var v = k * x + b;
			if(flag){
				if(y > v){
					snow_num++;
				}
			}else{
				if(y < v){
					snow_num++;
				}
			}
		}
		return (snow_num/len > 0.5)? CODE_SNOW_ADD: CODE_RAIN_ADD;
	}
}
/*给初始状态的面添加状态码*/
function _add_area_code(content_info){
	var special_area_index = [];
	var areas = content_info.areas.items;
	var symbols = content_info.symbols.items;
	areas.forEach(function(area, area_index){
		var area_items = area.items;
		var symbols_index = [];
		symbols.forEach(function(symbol_item, symbol_index){
			var type = symbol_item.type;
			if(CODE_SNOW == type || CODE_RAIN == type || CODE_RAIN_SNOW == type || CODE_MORE == type){
				var flag = isInsidePolygon(area_items, symbol_item.x, symbol_item.y);
				if(flag){
					symbols_index.push(symbol_item);
				}
			}
		});

		//把面里不包括雨、雪、雨夹雪标识的面添加到special_are_index
		var len = symbols_index.length;
		area.code_list = symbols_index;
		for(var i = 0; i < len; i++){
			if(symbols_index[i].type != CODE_MORE){
				break;
			}
		}
		if(len > 0 && i == len){
			special_area_index.push(area_index);
		}
	});
	for(var i = 0, j = special_area_index.length; i < j; i++){
		var special_index = special_area_index[i];
		var sub_area = areas[special_index],
			sub_area_items = sub_area.items;
		for(var start_index = special_index - 1; start_index >= 0; start_index--){
			var p_area = areas[start_index];
			if(polygonIsInsidePolygon(p_area.items, sub_area_items)){
				sub_area.code_list = sub_area.code_list.concat(p_area.code_list.slice());
				break;
			}
		}
	}
}


/*处理各面的code*/
function _deal_code_list_after_parsearea(content_info){
	var areas = content_info.areas;
	_sort_areas(areas);
	areas = areas.items;
	var special_index = [];
	
	if(areas){
		for(var i = 0, j = areas.length; i < j; i++){
			var current_area = areas[i],
				current_items = current_area.items;
			var code_list = current_area.code_list;
			if(!code_list || current_area.code){ // 当code_list不存在时不处理
				continue;
			}
			var toCode = null;
			var code_in_area = [];
			var code_p = [];
			// var code_split = [];
			var code_add = [];
			var is_have_more = false;
			code_list.forEach(function(code){
				var type = code.type;
				var is_in_polygon = false;

				// code.is_add 是当面没有状态码时用线进行分割得到
				if(type !== CODE_MORE && (code.is_add || (is_in_polygon = isInsidePolygon(current_items, code.x, code.y)) || code.is_split)){
					if(is_in_polygon){
						code_in_area.indexOf(type) == -1 && code_in_area.push(type);
						toCode = type;
					// }else if(code.is_split){
					// 	code_split.push(type == CODE_RAIN? CODE_SNOW: CODE_RAIN);
					}else if(code.is_add){
						code_add.push(type);
					}
				}
			});
			// 修复在同一个面中出现多个不同的code, 如：tv042814.024.json
			if(code_in_area.length > 1){
				toCode = null;
			}
			
			if(!toCode){
				var len_items = current_items.length;
				for(var start_index = i - 1; start_index >= 0; start_index--){
					var p_area = areas[start_index];
					var p = polygonIsInsidePolygon(p_area.items, current_items, true);
					if(p >= len_items - 6){// 由于线分割面时可能出现误差，这里先送去６个交点
						var code_p = p_area.code;
						if(code_p){
							toCode = code_p;
							code_list = p_area.code_list;
						}
						break;
					}
				}
				if(!toCode){
					var code_obj = {};
					code_add.forEach(function(c_v, c_i){
						code_obj[c_v] = 1;
					});
					if(code_obj[CODE_RAIN]){
						toCode = code_obj[CODE_SNOW]? CODE_RAIN_SNOW: CODE_RAIN;
					}else{
						if(code_obj[CODE_SNOW]){
							toCode = CODE_SNOW;
						}
					}
				}
				if(!toCode){
					toCode = CODE_RAIN;
				}
			}
			current_area.code = toCode;
			current_area.code_list = code_in_area;
			var code_include = [];
			if(!toCode && code_in_area.length == 0){
				special_index.push(i);
				continue;
			}
		}
		var area_len = areas.length;
		// // 对已经填充的面进行修正(这种情况暂时发现在初始分割后的子面特别小且在雨夹雪和不是雨夹雪区域内情况)
		// // 对在雨夹雪区域内的不是雨夹雪的区域code进行重围
		for(var i = 0, j = area_len; i < j; i++){
			var area = areas[i];
			var area_items = area.items;
			if(area.code == CODE_RAIN_SNOW){
				for(var start_i = i + 1; start_i < area_len; start_i++){
					var area_after = areas[start_i];
					var _items = area_after.items;
					var _len_items = _items.length;
					if(area_after.code != CODE_RAIN_SNOW && 
						polygonIsInsidePolygon(area_items, _items) //这里的包含用强包含  
					){
						area_after.code = CODE_RAIN_SNOW;
					}
				}
			}
		}
	}
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
	var areas = content_info.areas;
	_deal_code_list_after_parsearea(content_info);
	var areas_items = areas.items;
	areas_items.forEach(function(v){
		delete v.len;
		var _symbols = v.symbols;
		if(_symbols){
			delete _symbols.len;
		}
		delete v.kind;
		// delete v.public_line;
		delete v.code_list;
		delete v.area;
		delete v.public_line;
		delete v.type;
	});
	content_info.areas = areas_items;
	if(content_info.line_symbols){
		var line_symbols_items = content_info.line_symbols.items;
		line_symbols_items.forEach(function(v){
			var items = v.items;
			var p_start = items[0],
				p_end = items[items.length - 1];
			// 根据起始点的位置关系判断线的画向（保证从左向右画）
			// if(p_start.x > p_end.x && p_start.y > p_end.y){
			// 	v.items.reverse();
			// }
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
function _doclip(content_info, option){
	if(option){
		var clip_china = option.clip_china;
		if(clip_china){
			var time_start = new Date();
			var GeoClipper = require('../utils/geoclipper');
			new GeoClipper(null, null, function(){
				var geoClipper = this;
				var areas_new = [];
				content_info.areas.forEach(function(area){
					var result = geoClipper.doClip(area.items);
					// console.log(result);
					var scale = result.scale || 1;
					var paths = result.paths;
					for(var i = 0, j = paths.length; i<j; i++){
						var area_new = {};
						for(var attr in area){
							area_new[attr] = area[attr];
						}
						var path = paths[i];
						var items_new = [];
						for(var i_p = 0, j_p = path.length; i_p < j_p; i_p++){
							var item = path[i_p];
							items_new.push({
								x: item.X / scale,
								y: item.Y /scale
							});
						}
						area_new.items = items_new;
						areas_new.push(area_new);
					}
				});
				content_info.areas = areas_new;
			});
			console.log(new Date() - time_start);
		}
	}
}
exports.parse = _parse_file;