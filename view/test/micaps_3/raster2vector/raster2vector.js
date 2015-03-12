!function(global){
	var PI = Math.PI;
	var DIR_ABOVE = 1,
		DIR_RIGHT = 2,
		DIR_BELOW = -1,
		DIR_LEFT = -2;
	var TYPE_ENDPOINT = 1,
		TYPE_NODEPOINT = 2;
	var TYPE_ARC_CLOSE = 1,
		TYPE_ARC_OPEN = 2;
	var DIR_CW = 1,//顺时针
		DIR_CCW = 2;//逆时针

	var data_parsing,
		width_data, height_data;
	var Raster2Vector = function(){

	}

	// B样条插值平滑算法
	var smoothBSpline = (function(){
		// https://github.com/Tagussan/BSpline
		var BSpline = function(points,degree,copy){
		    if(copy){
		        this.points = []
		        for(var i = 0;i<points.length;i++){
		            this.points.push(points[i]);
		        }
		    }else{
		        this.points = points;
		    }
		    this.degree = degree;
		    this.dimension = points[0].length;
		    if(degree == 2){
		        this.baseFunc = this.basisDeg2;
		        this.baseFuncRangeInt = 2;
		    }else if(degree == 3){
		        this.baseFunc = this.basisDeg3;
		        this.baseFuncRangeInt = 2;
		    }else if(degree == 4){
		        this.baseFunc = this.basisDeg4;
		        this.baseFuncRangeInt = 3;
		    }else if(degree == 5){
		        this.baseFunc = this.basisDeg5;
		        this.baseFuncRangeInt = 3;
		    } 
		};

		BSpline.prototype.seqAt = function(dim){
		    var points = this.points;
		    var margin = this.degree + 1;
		    return function(n){
		        if(n < margin){
		            return points[0][dim];
		        }else if(points.length + margin <= n){
		            return points[points.length-1][dim];
		        }else{
		            return points[n-margin][dim];
		        }
		    };
		};

		BSpline.prototype.basisDeg2 = function(x){
		    if(-0.5 <= x && x < 0.5){
		        return 0.75 - x*x;
		    }else if(0.5 <= x && x <= 1.5){
		        return 1.125 + (-1.5 + x/2.0)*x;
		    }else if(-1.5 <= x && x < -0.5){
		        return 1.125 + (1.5 + x/2.0)*x;
		    }else{
		        return 0;
		    }
		};

		BSpline.prototype.basisDeg3 = function(x){
		    if(-1 <= x && x < 0){
		        return 2.0/3.0 + (-1.0 - x/2.0)*x*x;
		    }else if(1 <= x && x <= 2){
		        return 4.0/3.0 + x*(-2.0 + (1.0 - x/6.0)*x);
		    }else if(-2 <= x && x < -1){
		        return 4.0/3.0 + x*(2.0 + (1.0 + x/6.0)*x);
		    }else if(0 <= x && x < 1){
		        return 2.0/3.0 + (-1.0 + x/2.0)*x*x;
		    }else{
		        return 0;
		    }
		};

		BSpline.prototype.basisDeg4 = function(x){
		    if(-1.5 <= x && x < -0.5){
		        return 55.0/96.0 + x*(-(5.0/24.0) + x*(-(5.0/4.0) + (-(5.0/6.0) - x/6.0)*x));
		    }else if(0.5 <= x && x < 1.5){
		        return 55.0/96.0 + x*(5.0/24.0 + x*(-(5.0/4.0) + (5.0/6.0 - x/6.0)*x));
		    }else if(1.5 <= x && x <= 2.5){
		        return 625.0/384.0 + x*(-(125.0/48.0) + x*(25.0/16.0 + (-(5.0/12.0) + x/24.0)*x));
		    }else if(-2.5 <= x && x <= -1.5){
		        return 625.0/384.0 + x*(125.0/48.0 + x*(25.0/16.0 + (5.0/12.0 + x/24.0)*x));
		    }else if(-1.5 <= x && x < 1.5){
		        return 115.0/192.0 + x*x*(-(5.0/8.0) + x*x/4.0);
		    }else{
		        return 0;
		    }
		};

		BSpline.prototype.basisDeg5 = function(x){
		    if(-2 <= x && x < -1){
		        return 17.0/40.0 + x*(-(5.0/8.0) + x*(-(7.0/4.0) + x*(-(5.0/4.0) + (-(3.0/8.0) - x/24.0)*x)));
		    }else if(0 <= x && x < 1){
		        return 11.0/20.0 + x*x*(-(1.0/2.0) + (1.0/4.0 - x/12.0)*x*x);
		    }else if(2 <= x && x <= 3){
		        return 81.0/40.0 + x*(-(27.0/8.0) + x*(9.0/4.0 + x*(-(3.0/4.0) + (1.0/8.0 - x/120.0)*x)));
		    }else if(-3 <= x && x < -2){
		        return 81.0/40.0 + x*(27.0/8.0 + x*(9.0/4.0 + x*(3.0/4.0 + (1.0/8.0 + x/120.0)*x)));
		    }else if(1 <= x && x < 2){
		        return 17.0/40.0 + x*(5.0/8.0 + x*(-(7.0/4.0) + x*(5.0/4.0 + (-(3.0/8.0) + x/24.0)*x)));
		    }else if(-1 <= x && x < 0){
		        return 11.0/20.0 + x*x*(-(1.0/2.0) + (1.0/4.0 + x/12.0)*x*x);
		    }else{
		        return 0;
		    }
		};

		BSpline.prototype.getInterpol = function(seq,t){
		    var f = this.baseFunc;
		    var rangeInt = this.baseFuncRangeInt;
		    var tInt = Math.floor(t);
		    var result = 0;
		    for(var i = tInt - rangeInt;i <= tInt + rangeInt;i++){
		        result += seq(i)*f(t-i);
		    }
		    return result;
		};

		BSpline.prototype.calcAt = function(t){
		    t = t*((this.degree+1)*2+this.points.length);//t must be in [0,1]
		    return {
		    	lng: this.getInterpol(this.seqAt('lng'),t),
		    	lat: this.getInterpol(this.seqAt('lat'),t)
		    };
		    if(this.dimension == 2){
		        return [this.getInterpol(this.seqAt(0),t),this.getInterpol(this.seqAt(1),t)];
		    }else if(this.dimension == 3){
		        return [this.getInterpol(this.seqAt(0),t),this.getInterpol(this.seqAt(1),t),this.getInterpol(this.seqAt(2),t)];
		    }else{
		        var res = [];
		        for(var i = 0;i<this.dimension;i++){
		            res.push(this.getInterpol(this.seqAt(i),t));
		        }
		        return res;
		    }
		};
		// degree = [2, 5]; factor = [2, 10]
		return function(points, degree, factor){
			degree = degree || 4;
			var len = points.length;
			var num = len * (factor || 5);
			num < 20 && (num = 20);
			var spline = new BSpline(points, degree, true);
			var points_return = [];
			var space = 1/num;
			// points_return.push(points[0]);
			for(var t = 0; t <= 1; t += space){
				var interpol = spline.calcAt(t);
				points_return.push(interpol);
			}
			// points_return.push(points[len-1]);
			return points_return;
		}
	})();
	/*数据结构*/
	// 点
	function Point(x, y, dir){
		this.id = x+'_'+y;
		this.x = x;
		this.y = y;
		this.dir = dir;
	}
	Point.prototype.is = function(x, y){
		return this.id == x+'_'+y;
	}
	var _index_arc = 0;
	// 弧段
	function Arc(type){
		this.id = _index_arc++;
		this.points = [];
		this.type = type || TYPE_ARC_OPEN;
		this.numOfUsed = 0;
		this.dir = 1;
	}
	// 放到polygon里的关系对象
	function ArcDir(arc, dir){
		this.arc = arc;
		this.dir = dir;
	}
	// 多边形
	var _index_polygon = 0;
	function Polygon(){
		this.id = _index_polygon++;
		this.arcDirs = [];
	}
	function Angle(arc, angle, dir){
		this.arc = arc;
		this.angle = angle;
		this.dir = dir;
	}

	/*
	*函数功能：	计算两条直线逆时针方向的夹角
	*参数信息：	point_start：起始点；point_inflexion：拐点；point_end：终止点
	*返回值：	两条直线之间的夹角（弧度）；10则表示计算错误
	*/
	function getAngleOfTwoArcs(point_start, point_inflexion, point_end){
		var x_start = point_start.x, y_start = point_start.y,
			x_inflexion = point_inflexion.x, y_inflexion = point_inflexion.y,
			x_end = point_end.x, y_end = point_end.y;

		var aa = Math.pow(x_start - x_inflexion, 2) + Math.pow(y_start - y_inflexion, 2);
		var bb = Math.pow(x_inflexion - x_end, 2) + Math.pow(y_inflexion - y_end, 2);
		var cc = Math.pow(x_start - x_end, 2) + Math.pow(y_start - y_end, 2);
		var cosValue = ( aa + bb - cc ) / ( 2 * Math.sqrt( aa ) * Math.sqrt( bb ) );
		var angle = Math.acos( cosValue );
		var angle_2 = 2*PI - angle;

		var coeff1 = 0, coeff2 = 0;
		if(y_start != y_inflexion){
			coeff1 = (x_inflexion - x_start)/(y_start - y_inflexion);
			coeff2 = (x_start * y_inflexion - x_inflexion * y_start)/(y_start - y_inflexion);
			if(y_start > y_inflexion){
				return (x_end + coeff1*y_end + coeff2 <= 0)? angle: angle_2;
			}else if(y_start < y_inflexion){
				return (x_end + coeff1*y_end + coeff2 <= 0)? angle_2: angle;
			}
		}else{
			if(x_inflexion > x_start){
				return (y_end < y_start)? angle: angle_2;
			}else if(x_inflexion < x_start){
				return (y_end < y_start)? angle_2: angle;
			}
		}
		return 10;
	}
	//面积为正可以判断多边型正面，面积为负表示多边形背面
	function getArea(points){
		var S = 0;
		for(var i = 0, j = points.length - 1; i<j; i++){
			var p_a = points[i],
				p_b = points[i + 1];
			S += p_a.lng * p_b.lat - p_b.lng*p_a.lat;
		}
		var p_a = points[j],
			p_b = points[0];
		S += p_a.lng * p_b.lat - p_b.lng*p_a.lat;
		return S/2;
	}

	function make_point(x, y){
		var item_left_top = data_parsing[x][y];
		var item_right_bottom = data_parsing[x+1][y+1];
		var left_top = item_left_top.c;
		var right_top = data_parsing[x+1][y].c;
		var left_bottom = data_parsing[x][y+1].c;
		var right_bottom = item_right_bottom.c;

		var dir_arr = [];
		if(left_top != right_top){
			dir_arr.push(DIR_ABOVE);//上
		}
		if(right_bottom != right_top){
			dir_arr.push(DIR_RIGHT);//右
		}
		if(right_bottom != left_bottom){
			dir_arr.push(DIR_BELOW);//下
		}
		if(left_top != left_bottom){
			dir_arr.push(DIR_LEFT);//左
		}
		var len = dir_arr.length;
		var point = new Point(x, y, dir_arr);
		point.lng = item_left_top.x + (item_right_bottom.x - item_left_top.x)/2;
		point.lat = item_left_top.y + (item_right_bottom.y - item_left_top.y)/2;
		if(len > 2){
			point.type = TYPE_ENDPOINT;
			points_endpoint.push(point);
		}else if(len == 2){
			point.type = TYPE_NODEPOINT;
			points_node.push(point);
		}
	}
	// 得到端点或结点周围原始点在多边形内的颜色
	var SPACE_ADD = -0.1;
	function getPointOfSourceInPolygon(x, y, items){
		var colors = [];
		if(utils.isInsidePolygon(items, x+SPACE_ADD, y+SPACE_ADD)){
			colors.push(data_parsing[x][y].c);
		}
		if(utils.isInsidePolygon(items, x+1+SPACE_ADD, y+SPACE_ADD)){
			colors.push(data_parsing[x+1][y].c);
		}
		if(utils.isInsidePolygon(items, x+SPACE_ADD, y+1+SPACE_ADD)){
			colors.push(data_parsing[x][y+1].c);
		}
		if(utils.isInsidePolygon(items, x+1+SPACE_ADD, y+1+SPACE_ADD)){
			colors.push(data_parsing[x+1][y+1].c);
		}
		return colors;
	}

	var points_endpoint = [], //所有端点
		points_node = [];//所有结点

	var arcs = [],//存储端点连续的弧段
		arcs_node = [];
	global._getEndPoints = function(){
		return points_endpoint;
	}	
	global._getNodePoints = function(){
		return points_node;
	}

	// 解析数据，确定端点及结点
	function _parseData(){
		var top_arr = [];
		for(var i = 0; i< width_data-1; i++){
			for(var j = 0; j< height_data-1; j++){
				make_point(i, j);
			}
		}
	}
	// 找到弧段的下一个点
	function _get_next_arc_point(x, y){
		var point_node;
		for(var i = 0, j = points_node.length; i<j; i++){
			var p = points_node[i];
			if(p.x == x && p.y == y){
				var arr = points_node.splice(i, 1);
				return arr[0];
			}
		}
		for(var i = 0, j = points_endpoint.length; i<j; i++){
			var p = points_endpoint[i];
			if(p.x == x && p.y == y){
				return p;
			}
		}
	}
	function _remoteDirofEndpoing(endpoint, dir_pre){
		var dir = endpoint.dir;
		for(var i = 0, j = dir.length; i<j; i++){
			if(dir[i] == -dir_pre){
				dir.splice(i, 1);
				return;
			}
		}
	}
	var point_arcs = {};
	function _build_point_arcs(arc){
		var points = arc.points;
		for(var i = 0, j = points.length; i<j; i++){
			var id_point = points[i].id;
			(point_arcs[id_point] || (point_arcs[id_point] = [])).push(arc);
		}
	}
	function smoothArc(arc){
		var points = arc.points;

		var points_new = [];
		for(var i = 0, j = points.length; i<j; i++){
			var p = points[i];
			points_new.push(p);
		}
		// points_new = smoothSpline(points_new);

		// var points_new = [];
		// for(var i = 0, j = points.length; i<j; i++){
		// 	var p = points[i];
		// 	points_new.push([p.lng, p.lat]);
		// }
		points_new = smoothBSpline(points_new);
		arc.points = points_new;
		arc.points_old = points;
	}
	// 生成弧段
	function _makeArcs(is_smooth){
		var endpoint;
		while((endpoint = points_endpoint.shift())){
			var dir_arr = endpoint.dir;
			var dir;
			while((dir = dir_arr.shift())){
				var next_x = endpoint.x,	
					next_y = endpoint.y;
				var arc = new Arc();
				var points = arc.points;

				if(dir == DIR_ABOVE){
					next_y--;
				}else if(dir == DIR_RIGHT){
					next_x++;
				}else if(dir == DIR_BELOW){
					next_y++;
				}else if(dir == DIR_LEFT){
					next_x--;
				}
				points.push(endpoint);
				var point_next;
				var _x_next = next_x,
					_y_next = next_y,
					_dir_next = dir;
				while(point_next = _get_next_arc_point(_x_next, _y_next)){
					points.push(point_next);
					if(point_next.type == TYPE_ENDPOINT){
						_remoteDirofEndpoing(point_next, _dir_next);
						break;
					}else{
						// points.push(point_next);
						var next_dir = point_next.dir;
						next_dir = next_dir[next_dir[0] == -_dir_next?1:0];

						_x_next = point_next.x,
						_y_next = point_next.y;

						if(next_dir == DIR_ABOVE){
							_y_next--;
						}else if(next_dir == DIR_RIGHT){
							_x_next++;
						}else if(next_dir == DIR_BELOW){
							_y_next++;
						}else if(next_dir == DIR_LEFT){
							_x_next--;
						}
						_dir_next = next_dir;
						if(endpoint.is(_x_next, _y_next)){ //这里会生成包含端点的闭合弧段
							points.push(endpoint);
							_remoteDirofEndpoing(endpoint, _dir_next);
							arc.type = TYPE_ARC_CLOSE;
							break;
						}
					}
				}
				is_smooth && smoothArc(arc);
				if(arc.type == TYPE_ARC_CLOSE){
					arcs_node.push(arc);
				}else{
					arcs.push(arc);
					_build_point_arcs(arc);
				}
			}
		}
		// 生成闭合弧段
		var nodepoint;
		while((nodepoint = points_node.shift())){
			var arc = new Arc(TYPE_ARC_CLOSE);
			var points = arc.points;
			var dir = nodepoint.dir[0];
			var next_x = nodepoint.x,	
				next_y = nodepoint.y;
			if(dir == DIR_ABOVE){
				next_y--;
			}else if(dir == DIR_RIGHT){
				next_x++;
			}else if(dir == DIR_BELOW){
				next_y++;
			}else if(dir == DIR_LEFT){
				next_x--;
			}

			points.push(nodepoint);
			var point_next;
			while((point_next = _get_next_arc_point(next_x, next_y))){
				points.push(point_next);
				var dir_arr = point_next.dir;
				dir = dir_arr[dir_arr[0] == -dir?1:0];
				next_x = point_next.x;
				next_y = point_next.y;

				if(dir == DIR_ABOVE){
					next_y--;
				}else if(dir == DIR_RIGHT){
					next_x++;
				}else if(dir == DIR_BELOW){
					next_y++;
				}else if(dir == DIR_LEFT){
					next_x--;
				}
				if(nodepoint.is(next_x, next_y)){
					// points.push(nodepoint);
					break;
				}
			}
			is_smooth && smoothArc(arc);
			// _build_point_arcs(arc);
			arcs_node.push(arc);
		}
	}

	var angles = [], angle_min;
	// 得到下一个弧段
	function _getNextArc(arc){
		angles = [];
		var arc_next = arc;
		var point_start, point_start0;
		var pointsOfArc = arc.points;
		var id_arc = arc.id;
		if(arc.dir == 1){
			point_start0 = pointsOfArc.slice(-2)[0];
			point_start = pointsOfArc.slice(-1)[0];
		}else{
			point_start0 = pointsOfArc[1];
			point_start = pointsOfArc[0];
		}

		var id_startpoint = point_start.id;
		var arcs = point_arcs[point_start.id];
		// if(!arcs){debugger}
		for(var i = 0, j = arcs.length; i<j; i++){
			var arc_item = arcs[i];
			if(arc_item.id != id_arc && arc_item.numOfUsed <= 2){
				var point_arc_item = arc_item.points;

				var hudu;
				var point_e;
				var dir;
				// 确认扩展弧段
				if(point_arc_item[0].id == id_startpoint){
					point_e = point_arc_item[1];
					dir = 1;
				}else{
					point_e = point_arc_item.slice(-2)[0];
					dir = -1;
				}
				hudu = getAngleOfTwoArcs(point_start0, point_start, point_e);
				angles.push(new Angle(arc_item, hudu, dir));
			}
		}
		if(angles.length == 0){
			return arc_next;
		}

		angle_min = angles[0];
		var min_val = angle_min.angle;

		for(var i = 1, j = angles.length; i<j; i++){
			var item = angles[i];
			var _angle = item.angle;
			if(_angle < min_val){
				min_val = _angle;
				angle_min = item;
			}
		}
		return angle_min.arc;
	}
	// 产生一个polygon
	function _buildOnePolygon(arc){
		var polygon = new Polygon();
		var arcDirs = polygon.arcDirs;
		var arc_dir = new ArcDir(arc, arc.dir);
		arcDirs.push(arc_dir);

		var isHavePolygon = true;
		var arc_next = _getNextArc(arc);
		var arc_prev = null;
		while(1){
			if(arc_next.id != arc.id){// && (arc_prev && arc_prev.id != arc_next.id)){
				if(arc_prev && arc_prev.id == arc_next.id){
					for(var i = 0, j = arcDirs.length; i<j; i++){
						arcDirs[i].arc.numOfUsed--;
					}
					return null;
				}
				arc_prev = arc_next
				arc_next.dir = angle_min.dir;
				arc_next.numOfUsed += 1;

				var arc_dir_new = new ArcDir(arc_next, arc_next.dir);
				arcDirs.push(arc_dir_new);

				arc_next = _getNextArc(arc_next);
			}else{
				break;
			}
		}

		arc.numOfUsed += 1;
		return polygon;
	}
	var polygons = [];
	// 产生多个polygon
	function _buildPolygons(arc){
		var polygon = _buildOnePolygon(arc);
		if(!polygon){
			return;
		}
		polygons.push(polygon);
		for(var i = 0, j = arcs.length; i<j; i++){
			var arc_item = arcs[i];
			if(arc_item.numOfUsed == 1){
				arc_item.dir *= -1;
				polygon = _buildOnePolygon(arc_item);
				if(!polygon){
					return;
				}
				polygons.push(polygon);
				i = 0; //每次都从0开始
			}
		}
	}
	// 得到polygon的颜色
	// function getColorOfPolygon(items){
	// 	var color = '', color_num = 0;
	// 	var items_new = [];
	// 	for(var i = 0, j = items.length; i<j; i++){
	// 		var item = items[i];
	// 		items_new.push({
	// 			x: item.lng,
	// 			y: item.lat,
	// 			index_x: item.x,
	// 			index_y: item.y
	// 		});
			
	// 	}
	// 	for(var i = 0, j = items.length; i<j; i++){
	// 		var item = items_new[i];
	// 		var colors = getPointOfSourceInPolygon(item, items_new);
	// 		var flag_many_color = false;
	// 		for(var i_c = 0, j_c = colors.length; i_c < j_c; i_c++){
	// 			var c = colors[i_c];
	// 			if(color && color != c){
	// 				flag_many_color = true;
	// 				break;
	// 			}else{
	// 				color = c;
	// 			}
	// 		}
	// 		if(flag_many_color){
	// 			return null;
	// 		}
	// 	}
	// 	return color || null;
	// }
	function getColorOfPolygon(items){
		var colors_return = {};
		var color_points = {};
		for(var i = 0, j = items.length; i<j; i++){
			var item = items[i];
			var colors = getPointOfSourceInPolygon(item.x, item.y, items);
			var flag_many_color = false;
			for(var i_c = 0, j_c = colors.length; i_c < j_c; i_c++){
				var c = colors[i_c];
				if(!colors_return[c]){
					colors_return[c] = 0;
				}
				colors_return[c]++;
				(color_points[c] || (color_points[c] = [])).push(item);
			}
		}
		var arr = [];
		for(var i in colors_return){
			arr.push({
				c: i,
				n: colors_return[i],
				p: color_points[i]
			});
		}
		return arr;
	}
	var _cache_area = (function(){
		var _cache = {};
		var _cache_index = 0;
		return function(items){
			var len = items.length;
			var area = getArea(items);
			var key = len + '_' + Math.abs(area);
			// var color = getColorOfPolygon(items);
			// // if(null === color){ //当没有颜色时表示多边形里包含多个颜色的多边形，应该舍去
			// // 	return null;
			// // }
			var return_val = {
				items: items,
				area: area,
				id: _cache_index++
				// color: color
			};
			if(!_cache[key]){
				_cache[key] = [return_val];
			}else{
				var itemsInCache = _cache[key];
				var idOfLastPoint = items.slice(-1)[0].id;
				var idOfFirstPoint = items[0].id;
				for(var i = 0, j = itemsInCache.length; i<j; i++){
					var item = itemsInCache[i];
					if(item.area == -area){
						var itemsOfChecking = item.items;
						var index = itemsOfChecking.indexOf(idOfFirstPoint);
						var index_next = index == itemsOfChecking.length - 1? 0: index+1;
						if(itemsOfChecking[index_next].id == idOfLastPoint.id){
							return null;
						}
					}
				}
				_cache[key].push(return_val);
			}
			return return_val;
		}
	})();
	// 解析polygon
	function _parsePolygons(){
		var polygons_new = [];
		var polygon;
		while((polygon = polygons.shift())){
			var items = [];
			var arcDirs = polygon.arcDirs;
			for(var i_ad = 0, j_ad = arcDirs.length; i_ad < j_ad; i_ad++){
				var p = arcDirs[i_ad];
				var points = p.arc.points.slice();

				if(p.dir == -1){
					points.reverse();
				}
				try{
					if(items[items.length-1].id == points[0].id){
						points.shift();
					}
				}catch(e){}
				items = items.concat(points);
			}
			items.pop();
			var area = _cache_area(items);
			if(area !== null){
				polygons_new.push(area);
			}
		}
		for(var i = 0, j = arcs_node.length; i<j; i++){
			var items = arcs_node[i].points;
			var area = _cache_area(items);
			if(area !== null){
				polygons_new.push(area);
			}
		}
		polygons_new.sort(function(a, b){
			return Math.abs(b.area) - Math.abs(a.area);
		});
		polygons_new.shift();// 去掉面积最大的
		
		polygons = polygons_new;
		return polygons_new;
	}
	// 生成多边形
	function _makePolygons(){
		for(var i = 0, j = arcs.length; i<j; i++){
			var arc = arcs[i];
			//if(i == 29){debugger;}
			if(arc.numOfUsed == 0){
				_buildPolygons(arc);
			}
		}
	}
	// 根据点得到点所在所有polygon
	function getPolygonsByPoint(point){
		var id = point.id;
		var polygons_return = [];
		for(var i = 0, j = polygons.length; i<j; i++){
			var polygon = polygons[i];
			for(var i_item = 0, items = polygon.items, j_item = items.length; i_item<j_item; i_item++){
				var id_item = items[i_item].id;
				if(id_item == id){
					polygons_return.push(polygon);
					break;
				}
			}
		}
		return polygons_return;
	}
	function unique_polygons(polygons){
		var polygons_new = [];
		var obj = {};
		for(var i = 0, j = polygons.length; i<j; i++){
			var p = polygons[i];
			if(!obj[p.id]){
				obj[p.id] = 1;
				polygons_new.push(p);
			}
		}
		return polygons_new;
	}
	var _addColor = function(polygons){
		var polygons_island = [];
		for(var i = 0, j = polygons.length; i<j; i++){
			var polygon = polygons[i];
			var colors = getColorOfPolygon(polygon.items);
			if(colors.length == 1){
				polygon.color = colors[0].c
			}else{
				colors.sort(function(a, b){
					return a.n - b.n;
				});
				var max_color = colors.pop();
				polygon.color = max_color.c;
				polygons_island.push({
					i: i,
					p: polygon,
					colors: colors
				});
			}
		}
		for(var i = 0, j = polygons_island.length; i<j; i++){
			var polygon = polygons_island[i];
			var itemsOfPolygon = polygon.p.items;
			var id = polygon.p.id;
			var colorOfPolygon = polygon.p.color;
			var colors = polygon.colors;
			var polygons_clip = [];
			for(var i_c = 0, j_c = colors.length; i_c<j_c; i_c++){
				var item_color = colors[i_c];
				var points = item_color.p;
				var polygons_bypoint = [];
				for(var i_p = 0, j_p = points.length; i_p < j_p; i_p++){
					polygons_bypoint = polygons_bypoint.concat(getPolygonsByPoint(points[i_p], id));
				}
				polygons_clip = polygons_clip.concat(unique_polygons(polygons_bypoint));
			}
			polygons_clip = unique_polygons(polygons_clip);

			var polygons_result = [];
			for(var i_pp = 0, j_pp = polygons_clip.length; i_pp<j_pp; i_pp++){
				var polygon_item = polygons_clip[i_pp];
				if(polygon_item.id != id && colorOfPolygon != polygon_item.color && utils.polygonIsInsidePolygon(itemsOfPolygon, polygon_item.items)){
					polygons_result.push(polygon_item);
				}
			}
			if(polygons_result.length > 0){
				polygon.p.clip = polygons_result;
			}
		}
	}
	var _pretreatmentData = function(data){
		data_parsing = data;
		width_data = data.length,
		height_data = data[0].length;
		_parseData();
	}
	global._smoothBSpline = smoothBSpline;
	global._pretreatmentData = _pretreatmentData;
	global._makeArcs = _makeArcs;
	global._makePolygons = _makePolygons;
	global._parsePolygons = _parsePolygons;
	global._addColor = _addColor;
	global.raster2vector = function(data){
		_pretreatmentData(data);
		_makeArcs();
	    _makePolygons();
	    _parsePolygons();

		_addColor(polygons);
	    return polygons;
	}
}(this);