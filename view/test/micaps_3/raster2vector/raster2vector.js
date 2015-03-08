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
			S += p_a.x * p_b.y - p_b.x*p_a.y;
		}
		var p_a = points[j],
			p_b = points[0];
		S += p_a.x * p_b.y - p_b.x*p_a.y;
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
		// console.log(x, y, len, dir_arr, point.lng, point.lat, '('+points_endpoint.length+','+points_node.length+')');
	}

	var points_endpoint = [], //所有端点
		points_node = [];//所有结点

	var arcs = [];
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
	// 生成弧段
	function _makeArcs(){
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

				// points.length > 1 && 
				arcs.push(arc);
				_build_point_arcs(arc);
			}
		}
		// 生成闭合弧段
		// var nodepoint;
		// while((nodepoint = points_node.shift())){
		// 	var arc = new Arc(TYPE_ARC_CLOSE);
		// 	var points = arc.points;
		// 	var dir = nodepoint.dir[0];
		// 	var next_x = nodepoint.x,	
		// 		next_y = nodepoint.y;
		// 	if(dir == DIR_ABOVE){
		// 		next_y--;
		// 	}else if(dir == DIR_RIGHT){
		// 		next_x++;
		// 	}else if(dir == DIR_BELOW){
		// 		next_y++;
		// 	}else if(dir == DIR_LEFT){
		// 		next_x--;
		// 	}

		// 	points.push(nodepoint);
		// 	var point_next;
		// 	while((point_next = _get_next_arc_point(next_x, next_y))){
		// 		points.push(point_next);
		// 		var dir_arr = point_next.dir;
		// 		dir = dir_arr[dir_arr[0] == -dir?1:0];
		// 		next_x = point_next.x;
		// 		next_y = point_next.y;

		// 		if(dir == DIR_ABOVE){
		// 			next_y--;
		// 		}else if(dir == DIR_RIGHT){
		// 			next_x++;
		// 		}else if(dir == DIR_BELOW){
		// 			next_y++;
		// 		}else if(dir == DIR_LEFT){
		// 			next_x--;
		// 		}
		// 		if(nodepoint.is(next_x, next_y)){
		// 			// points.push(nodepoint);
		// 			break;
		// 		}
		// 	}
		// 	_build_point_arcs(arc);
		// 	arcs.push(arc);
		// }
		console.log(arcs);
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

		var arc_next = _getNextArc(arc);
		var arc_prev;
		while(1){
			if(arc_next.id != arc.id){// && (arc_prev && arc_prev.id != arc_next.id)){
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
		console.log(polygons.length);
		return polygon;
	}
	var polygons = [];
	// 产生多个polygon
	function _buildPolygons(arc){
		var polygon = _buildOnePolygon(arc);

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
	function _parsePolygons(){
		var areas = [];
		for(var i = 0, j = polygons.length; i<j; i++){
			var items = [];
			var arcDirs = polygons[i].arcDirs;
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
			areas.push({
				area: getArea(items),
				items: items
			});
		}
		areas.sort(function(a, b){
			return Math.abs(b.area) - Math.abs(a.area);
		});
		// areas.shift();
		console.log(areas);
		return areas;
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

		console.log('polygons', polygons);
		
	}
	global._makeArcs = _makeArcs;
	global._makePolygons = _makePolygons;
	global._parsePolygons = _parsePolygons;
	global.raster2vector = function(data){
		data_parsing = data;
		width_data = data.length,
		height_data = data[0].length;
		_parseData();
		// _makeArcs();
	}
}(this);