var fs = require('fs'),
	path = require('path');

var format = (function(){
	function formatDir(dir,format_path_fn){
		fs.readdir(dir, function(err, files) {
			if(err){
				return console.log(err);
			}

			files.forEach(function(item) {
				var tmpPath = path.join(dir, item);
				fs.stat(tmpPath, function(err1, stats) {
					if(err1){
						console.log(err1);
					}else{
						if (stats.isDirectory()) {
							formatDir(tmpPath,format_path_fn);
						}else{
							formatFile(tmpPath,format_path_fn);
						}
					}
				})
			});
		});
	}
	/**
     * 多边形包含判断
     * 警告：下面这段代码会很难看，建议跳过~
     */
    function _isInsidePolygon(area, x, y) {
        /**
         * 射线判别法
         * 如果一个点在多边形内部，任意角度做射线肯定会与多边形要么有一个交点，要么有与多边形边界线重叠
         * 如果一个点在多边形外部，任意角度做射线要么与多边形有一个交点，
         * 要么有两个交点，要么没有交点，要么有与多边形边界线重叠。
         */
        var i;
        var j;
        var polygon = area;
        var N = polygon.length;
        var inside = false;
        var redo = true;
        var v;
        for (i = 0; i < N; ++i) {
            // 是否在顶点上
            if (polygon[i].x == x && polygon[i].y == y ) {
                redo = false;
                inside = true;
                break;
            }
        }

        if (redo) {
            redo = false;
            inside = false;
            for (i = 0,j = N - 1;i < N;j = i++) {
                if ((polygon[i].y < y && y < polygon[j].y)
                    || (polygon[j].y < y && y < polygon[i].y)
                ) {
                    if (x <= polygon[i].x || x <= polygon[j].x) {
                        v = (y - polygon[i].y) * (polygon[j].x - polygon[i].x) / (polygon[j].y - polygon[i].y) + polygon[i].x;
                        if (x < v) {          // 在线的左侧
                            inside = !inside;
                        }
                        else if (x == v) {   // 在线上
                            inside = true;
                            break;
                        }
                    }
                }
                else if (y == polygon[i].y) {
                    if (x < polygon[i].x) {    // 交点在顶点上
                        polygon[i].y > polygon[j].y ? --y : ++y;
                        //redo = true;
                        break;
                    }
                }
                else if (polygon[i].y == polygon[j].y // 在水平的边界线上
                         && y == polygon[i].y
                         && ((polygon[i].x < x && x < polygon[j].x)
                             || (polygon[j].x < x && x < polygon[i].x))
                ) {
                    inside = true;
                    break;
                }
            }
        }
        return inside;
    }

    /*是否在线的左上方*/
    function _isLeftTop(line,x,y){
    	var n = line.length;
    	var firstPoint = line[0];
    	var min_x = max_x = firstPoint.x,min_y = max_y = firstPoint.y;
    	line.forEach(function(v){
    		var _x = v.x,
    			_y = v.y;
    		if(_x < min_x){
    			min_x = _x;
    		}
    		if(_x > max_x){
    			max_x = _x;
    		}
    		if(_y < min_y){
    			min_y = _y;
    		}
    		if(_y > max_y){
    			max_y = _y;
    		}
    	});
    	// 经纬度坐标第y轴越往上越大
    	if(x < min_x || y > max_y){
    		return true;
    	}
    	if(x > max_x || y < min_y){
    		return false;
    	}
    	for(var i = 0;i<n-1;i++){
    		var x1 = line[i].x,
    			x2 = line[i+1].x,
    			y1 = line[i].y,
    			y2 = line[i+1].y;

    		if(x1 == x2){
    			if(x1 == x){
    				console.log('x ==');
    				return false;
    			}else if(x > x1){
    				if(y < Math.max(y1,y2)){
    					return false;
    				}
    			}
    		}else {
    			if(x >= Math.min(x1,x2) && x <= Math.max(x1,x2)){
    				var k = (y1-y2)/(x1-x2);
	    			var b = (x1*y2 - x2*y1)/(x1-x2);

	    			var y_v = k*x+b;
	    			if(y_v >= y){
	    				return false;
	    			}
    			}
    		}
    	}
    	return true;
    }
    var PRECIPITATION_SNOW = 1,
    	PRECIPITATION_RAIN = 2,
    	PRECIPITATION_RAIN_SNOW = 3;

	function parse14Area(content_info){
		var line_symbols = content_info.line_symbols.items.filter(function(v){
			return v.code == 0;
		});
		// 不考虑两条线相关的情况
		var line_len = line_symbols.length;
		if(line_len > 0){
			var special_line = line_symbols[0];
			if(line_len > 1){
				for(var i = 1,j=line_len;i<j;i++){
					var line = line_symbols[0];
					for(var i_inner = 0,j_inner=line.items.length;i_inner<j_inner;i_inner++){
						var v = line.items[i_inner];
						if(!_isLeftTop(special_line.items,v.x,v.y)){
							special_line = line;
							break;
						}
					}
				}
			}
		}
		if(special_line){
			special_line.color = 'green';
			var special_line_items = special_line.items;
			content_info.areas.items.forEach(function(v,i){
				var leftToNum = 0;
				v.items.forEach(function(v_inner){
					var flag = _isLeftTop(special_line_items,v_inner.x,v_inner.y);
					if(flag){
						leftToNum++;
					}
				});
				v.precipitation = leftToNum == v.items.length? PRECIPITATION_SNOW : PRECIPITATION_RAIN;
			});
		}
		// 得到所含特殊线的面
		var include_relation = [];
		content_info.areas.items.forEach(function(v,i){
			var items = v.items;
			line_symbols.forEach(function(v_line,i_line){
				var inside_num = 0;
				v_line.items.forEach(function(v_line_item){
					var flag = _isInsidePolygon(items,v_line_item.x,v_line_item.y);
					
					if(flag){
						inside_num++;
					}
				});
				if(inside_num/v_line.items.length > 0.9){
					include_relation.push([i,i_line]);
				}
			});
		});
		// 用特殊线和面的部分点组成新的面

		content_info.lines = {
			items: [{
				point: {
					items: []
				},
				flags: {
					len: 0
				}
			}]
		};
		include_relation.forEach(function(v){
			var area_items = content_info.areas.items[v[0]].items,
				line_items = line_symbols[v[1]].items;
			var new_line_items = [];
			var start_line_items = [],
				end_line_items = [];
			// 开头点的准确率很高，结尾点的准确率很低
			var _items_len = line_items.length;
			var _all_true_len = 0;
			var _flag_all_false = false;
			line_items.forEach(function(v_line_item){
				var flag = _isInsidePolygon(area_items,v_line_item.x,v_line_item.y);
				if(!flag){
					if(_all_true_len/_items_len > 0.5){
						_flag_all_false = true;
					}
				}else{
					// 当连续出现大量在面中的点后第一个出现不在面中的点后，修正后续点都不在面中
					/*暂时不考虑一条线在面内外穿梭情况*/
					if(_flag_all_false){
						flag = false;
					}
				}
				if(flag){
					_all_true_len++;
					new_line_items.push(v_line_item);
				}else{
					var _line_items = new_line_items.length > 0?end_line_items:start_line_items;
					_line_items.push(v_line_item);
				}
				v_line_item.flag = flag;
			});
			var start_x1,start_y1,
				start_x2,start_y2,
				start_item_1,start_item_2;
			var end_x1,end_y1,
				end_x2,end_y2,
				end_item_1,end_item_2;

			console.log('start_line_items',start_line_items);
			console.log('end_line_items',end_line_items);
			if(start_line_items.length > 0){
				start_item_1 = start_line_items.slice(-1)[0];
				start_item_2 = new_line_items.slice(0,1)[0];
			}else{
				start_item_1 = new_line_items.slice(0,1)[0];
				start_item_2 = new_line_items.slice(1,2)[0];
			}
			if(end_line_items.length > 0){
				end_item_1 = end_line_items.slice(0,1)[0];
				end_item_2 = new_line_items.slice(-1)[0];
			}else{
				end_item_1 = new_line_items.slice(-1)[0];
				end_item_2 = new_line_items.slice(-2,-1)[0];
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
			// 	type: 3
			// });
			// content_info.symbols.items.push({
			// 	x: end_item_2.x,
			// 	y: end_item_2.y,
			// 	z: 0,
			// 	type: 3
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
			console.log('start_x1,start_x2',start_x1,start_x2);
			if(start_x1 != start_x2){
				start_k = (start_y1-start_y2)/(start_x1-start_x2);
	    		start_b = (start_x1*start_y2 - start_x2*start_y1)/(start_x1-start_x2);
			}
			if(end_x1 != end_x2){
				end_k = (end_y1-end_y2)/(end_x1-end_x2);
	    		end_b = (end_x1*end_y2 - end_x2*end_y1)/(end_x1-end_x2);
			}
			// console.log(start_item_1,start_item_2,end_item_1,end_item_2);
			// console.log('start_x1',start_x1,'start_x2',start_x2);
			// console.log('start_k',start_k,'start_b',start_b,'end_k',end_k,'end_b',end_b);
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
	    			if(_x >= Math.min(x1,x2) && _x <= Math.max(x1,x2) && 
    				   _x >= Math.min(start_x1,start_x2) && _x <= Math.max(start_x1,start_x2) && 
    				   _y >= Math.min(y1,y2) && _y <= Math.max(y1,y2) && 
    				   _y >= Math.min(start_y1,start_y2) && _y <= Math.max(start_y1,start_y2)){
    				   	_jiaodian_start = [_x,_y,i,j];
    					// console.log('start_v_x,start_v_y',i,j,k,start_k,_x,_y);
	    	// 			content_info.symbols.items.push({
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
	    	// 			content_info.symbols.items.push({
						// 	x: _x,
						// 	y: _y,
						// 	z: 0,
						// 	type: 4
						// });
    				}
	    		}
			}
			console.log('jiaodian_info',_jiaodian_start,_jiaodian_end);
			// 根据开始和结尾的交点从面数据里截取点片段和和特殊线组合成新的面
			if(_jiaodian_start && _jiaodian_end){
				var start_index = _jiaodian_start[2],
					end_index = _jiaodian_end[2];

				// 从面数据里截取点片段
				var add_items = [];
				console.log('start_index,end_index',start_index,end_index);
				if(start_index > end_index){
					// add_items = area_items.slice(0,start_index+1).reverse();//.concat(area_items.slice(end_index).reverse());
					// add_items = area_items.slice(end_index).concat(area_items.slice(0,start_index+1));
					add_items = area_items.slice(end_index,start_index+1).reverse();
				}else{
					add_items = area_items.slice(start_index,end_index+1);
					// add_items = area_items.slice(0,2).reverse();
				}
				
				add_items[0].x = _jiaodian_start[0];
				add_items[0].y = _jiaodian_start[1];
				add_items[add_items.length-1].x = _jiaodian_end[0];
				add_items[add_items.length-1].y = _jiaodian_end[1];
				
				var first_new_line_point = new_line_items[0],
					last_new_line_point = new_line_items[new_line_items.length-1];

				// 根据四个点的距离进行追加判断
				if(Math.pow(_jiaodian_start[0]-first_new_line_point.x,2)+Math.pow(_jiaodian_start[1]-first_new_line_point.y,2) > 
				   Math.pow(_jiaodian_end[0]-first_new_line_point.x,2)+Math.pow(_jiaodian_end[1]-first_new_line_point.y,2)){
					new_line_items = new_line_items.concat(add_items);
				}else{
					new_line_items = new_line_items.concat(add_items.reverse());
				}
				// console.log('==',area_items.length,add_items.length,v);
				content_info.areas.items.push({
					len: new_line_items.length,
					type: 1,
					items: new_line_items,
					color: '#000'
				});
			}

		});
		// console.log(include_relation);
		// 对面进行排序（前端显示的时候有index的重又叠）
		content_info.areas.items.forEach(function(v){
			var x_arr = [],y_arr = [];
			v.items.forEach(function(v_item){
				x_arr.push(v_item.x);
				y_arr.push(v_item.y);
			});
			v.area = Math.pow(Math.min.apply(Math,x_arr) - Math.max.apply(Math,x_arr),2) + Math.pow(Math.min.apply(Math,y_arr) - Math.max.apply(Math,y_arr),2);
		});
		content_info.areas.items.sort(function(a,b){
			return a.area < b.area?1: -1;
		});
	}
	var file_type = {
		14: function(line_arr){
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
					console.log('1. LINES -> ',lines.len);
					return;
				}else if(reg_m = REG_LINES_SYMBOL.exec(v)){
					line_symbols.len = reg_m[1];
					reg_m = null;
					flag = FLAG_LINES_SYMBOLE;
					return;
				}else if(reg_m = REG_SYMBOLS.exec(v)){
					symbols.len = reg_m[1];
					console.log('8. SYMBOLE(len:'+reg_m[1]+')');
					reg_m = null;
					flag = FLAG_SYMBOLE_ITEM;
					return;
				}else if(reg_m = REG_CLOSED_CONTOURS.exec(v)){
					areas.len = reg_m[1];
					console.log('9. CLOSED_CONTOURS(len:'+reg_m[1]+')');
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
						console.log('2. LINES(weight:'+m[1]+',pointLen:'+m[2]+')');
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
						console.log('===',points_arr.length);
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
						console.log('3. LINES_POINT()');
						var line = lines.items[lines.items.length-1];
						// console.log(lines.items);
						line.point.items = line.point.items.concat(items);
						console.log('3. ->',items.length,line.point.items.length);
						if(line.point.len == line.point.items.length){
							flag = FLAG_READLINE_FLAG;
						}
					}else if(flag == FLAG_READLINE_FLAG_POINTS){
						console.log('5. LINES_POINT()');
						var line = lines.items[lines.items.length-1];
						line.flags.items = line.flags.items.concat(items);
						console.log('5. ->',items.length,line.flags.items.length,v);
						if(line.flags.len == line.flags.items.length){/* to step 2*/
							flag = FLAG_READLINE_WEIGHT;
						}
					}else if(flag == FLAG_LINES_SYMBOLE_POINTS){
						console.log('7. LINES_POINT()');
						var line_symbol = line_symbols.items[line_symbols.items.length-1];
						line_symbol.items = line_symbol.items.concat(items);
						if(line_symbol.items.length == line_symbol.len){
							flag = FLAG_LINES_SYMBOLE;
						}
					}else if(flag == FLAG_AREA_POINTS){
						console.log('11. AREA_POINT()');
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
						console.log('4. LINES_FLAG(text:'+m[1]+',len:'+m[2]+')');
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
						console.log('6. LINES_SYMBOLE(code:'+m[1]+',weight:'+m[2]+',len:'+m[3]+')');
					}
					
				}else if(flag == FLAG_SYMBOLE_ITEM){
					var arr = v.split(REG_BLANK);
					symbols.items.push({
						type: arr[0],
						x: Number(arr[1]),
						y: Number(arr[2]),
						z: Number(arr[3]),
						text: arr[4]
					});
					console.log('9. symbols');
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
						console.log('10. area_FLAG(weight:'+m[1]+',len:'+m[2]+')');
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
			parse14Area(content_info);
			return content_info;
			// console.log(content_info);
		}
	};
	/*同步递归创建目录*/
	var mkdirSync = function(mkPath){
		var parentPath = path.dirname(mkPath);
		if(!fs.existsSync(parentPath)){
			mkdirSync(parentPath);
		}

		if(!fs.existsSync(mkPath)){
			fs.mkdirSync(mkPath);
		}
	}
	function saveData(content_info,save_file_path){
		if(typeof content_info != 'string'){
			content_info = JSON.stringify(content_info);
		}
		mkdirSync(path.dirname(save_file_path));
		fs.writeFile(save_file_path,content_info,function(err){
			if(err){
				return console.log(err);
			}
			console.log(save_file_path,'save successfully!');
		});
	}
	function formatFile(file_path,format_path_fn){
		fs.readFile(file_path,function(err,data){
			if(err){
				console.log(err);
			}else{
				var line_arr = data.toString().split(/[\r\n]+/);
				if(line_arr.length > 0){
					var m = /diamond\s+(\d+)/.exec(line_arr[0]);
					var type;
					if(m && (type = m[1])){
						var data = file_type[type](line_arr);
						saveData(data,format_path_fn(file_path));
						return ;
					}else{
						throw new Error('no data type');
					}
				}else{
					throw new Error('no data');
				}
			}
		});
	}
	return function(data_path,format_path_fn){
		data_path = path.normalize(data_path);
		fs.stat(data_path,function(err,stats){
			if(err){
				console.log(err);
			}else{
				if(stats.isDirectory()){
					formatDir(data_path,format_path_fn);
				}else{
					formatFile(data_path,format_path_fn);
				}
			}
		});
	}
})();

var file_path = '../data/micaps_source/14/';
// file_path = '../data/micaps_source/14/14110508.000';
file_path = '../data/micaps_source/14/rr111308.024';
file_path = '../data/micaps_source/14/rr112108.048';

format(file_path,function(source_path){
	return source_path.replace('micaps_source','micaps')+'.json';
});