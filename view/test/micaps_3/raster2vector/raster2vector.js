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
	var SPACE_ADD = -0.1;
	var utils = global.utils;
	if(typeof utils == 'undefined'){
		utils = require('../utils');
	}
	var data_parsing,
		data_parsing_new, //处理数据
		color_novalue_parsing, //正在处理的数据集里默认数据的颜色
		width_data, height_data;
	
	var _index_arc = 0;
	var _index_polygon = 0;
	var _index_arcdir = 0;
	var points_endpoint = [], //所有端点
		points_node = [];//所有结点
	var arcs = [],//存储端点连续的弧段
		arcs_node = [];
	var point_arcs = {}; //存储点和弧段关系
	var polygons = []; //存储多边形
	var smoothSpline = (function(){
		var vector = {
			distance: function distance(p1, p2){
				return Math.sqrt(Math.pow(p1.lng - p2.lng, 2), Math.pow(p1.lat - p2.lat, 2));
			}
		};
		
		/**
         * @inner
         */
        function interpolate(p0, p1, p2, p3, t, t2, t3) {
            var v0 = (p2 - p0) * 0.5;
            var v1 = (p3 - p1) * 0.5;
            return (2 * (p1 - p2) + v0 + v1) * t3 
                    + (-3 * (p1 - p2) - 2 * v0 - v1) * t2
                    + v0 * t + p1;
        }
		return function (points, isLoop, gap) {
            var len = points.length;
            if(len <= 1){
            	return points;
            }
            gap || (gap = 5);
            var ret = [];

            var distance = 0;
            for (var i = 1; i < len; i++) {
                distance += vector.distance(points[i - 1], points[i]);
            }
            
            var segs = distance / gap;
            segs = segs < len ? len : segs;
            for (var i = 0; i < segs; i++) {
                var pos = i / (segs - 1) * (isLoop ? len : len - 1);
                var idx = Math.floor(pos);

                var w = pos - idx;

                var p0;
                var p1 = points[idx % len];
                var p2;
                var p3;
                if (!isLoop) {
                    p0 = points[idx === 0 ? idx : idx - 1];
                    p2 = points[idx > len - 2 ? len - 1 : idx + 1];
                    p3 = points[idx > len - 3 ? len - 1 : idx + 2];
                }
                else {
                    p0 = points[(idx - 1 + len) % len];
                    p2 = points[(idx + 1) % len];
                    p3 = points[(idx + 2) % len];
                }

                var w2 = w * w;
                var w3 = w * w2;

                ret.push({
                    lng: interpolate(p0.lng, p1.lng, p2.lng, p3.lng, w, w2, w3),
                    lat: interpolate(p0.lat, p1.lat, p2.lat, p3.lat, w, w2, w3)
                });
            }
            return ret;
        };
	})();
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
		    	lng: this.getInterpol(this.seqAt('lng'),t).toFixed(4),
		    	lat: this.getInterpol(this.seqAt('lat'),t).toFixed(4)
		    };
		    // if(this.dimension == 2){
		    //     return [this.getInterpol(this.seqAt(0),t),this.getInterpol(this.seqAt(1),t)];
		    // }else if(this.dimension == 3){
		    //     return [this.getInterpol(this.seqAt(0),t),this.getInterpol(this.seqAt(1),t),this.getInterpol(this.seqAt(2),t)];
		    // }else{
		    //     var res = [];
		    //     for(var i = 0;i<this.dimension;i++){
		    //         res.push(this.getInterpol(this.seqAt(i),t));
		    //     }
		    //     return res;
		    // }
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
		this.id = _index_arcdir++;
	}
	// 多边形
	function Polygon(){
		this.id = _index_polygon++;
		this.arcDirs = [];
	}
	// 角
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
	var cache_color_sort = {};
	// 处理所有点,得到端点和结点
	function make_point(x, y, is_peak){
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
		point._dir_arr = dir_arr.slice();
		point.lng = item_left_top.x + (item_right_bottom.x - item_left_top.x)/2;
		point.lat = item_left_top.y + (item_right_bottom.y - item_left_top.y)/2;

		if(len > 2 || is_peak){
			if(len == 4){
				point.is_special = true;
				point._color = [left_top, right_bottom, right_top, left_bottom];
			}
			point.type = TYPE_ENDPOINT;
			points_endpoint.push(point);
		}else if(len == 2){
			point.type = TYPE_NODEPOINT;
			points_node.push(point);
		}
		return point;
	}
	// 解析数据，确定端点及结点
	var num_loop = 0;
	var color_arr = []; //存储所有颜色值及个数
	function _parseData(){
		points_endpoint = [];
		points_node = [];
		cache_color_sort = {};
		color_arr = [];
		for(var i = 0; i< width_data-1; i++){
			var is_break = false;
			for(var j = 0; j< height_data-1; j++){
				var is_peak = (i == 0 && (j == 0 || j == height_data-2)) || (i == width_data - 2 && (j == 0 || j == height_data-2));
				var p = make_point(i, j, is_peak);

				var p_val = data_parsing[i][j];
				if(!cache_color_sort[p_val.c]){
					cache_color_sort[p_val.c] = 0;
				}
				cache_color_sort[p_val.c]++;
			}
		}
		
		for(var i in cache_color_sort){
			color_arr.push({
				c: i,
				n: cache_color_sort[i]
			});
		}
		color_arr.sort(function(a, b){
			return b.n - a.n;
		});

		// 对有四个方向的端点进行处理
		for(var i = color_arr.length-1; i>=0; i--){
			_dealPointByColor(color_arr[i].c);
		}
		
		points_endpoint = [];
		points_node = [];
		for(var i = 0; i< width_data-1; i++){
			var is_break = false;
			for(var j = 0; j< height_data-1; j++){
				var is_peak = (i == 0 && (j == 0 || j == height_data-2)) || (i == width_data - 2 && (j == 0 || j == height_data-2));
				var p = make_point(i, j, is_peak);
			}
		}

		// if(num_loop++ < 1){
		// 	 _parseData();
		// }else{
		// 	_showEndpoint();
		// }
	}
	// function _showEndpoint(){
	// 	// var html = '';
	// 	// $.each(color_arr, function(i, v){
	// 	// 	html += '<li style="width: 100px;height:30px;line-height:30px;text-align:center;background:'+v.c+'">'+v.n+'</li>';
	// 	// });
	// 	// $('<ul>').html(html).appendTo('body').attr('style', 'position:absolute;left: 0; top:0; z-index:9999;');
	// 	var num_special = 0;
	// 	for(var i = 0, j = points_endpoint.length; i<j; i++){
	// 		var point = points_endpoint[i];
	// 		if(point.min_color){
	// 			num_special++;
				
	// 		}
	// 	}
	// }
	// 得到所有颜色中的索引（用在大致判断是不是极值点）
	function _getColorIndex(c){
		for(var i = color_arr.length-1; i>=0; i--){
			if(color_arr[i].c === c){
				return i;
			}
		}
		return 0;
	}
	function _dealPointByColor(c){
		var dealing_points = points_endpoint.filter(function(point){
			if(point.is_special){
				var index = -1;
				var min_color;
				var c_p = point._color;
				for(var i = 0, j = c_p.length; i<j; i++){
					var c_check = c_p[i];
					var _index = _getColorIndex(c_check);
					if(_index > index){
						index = _index;
						min_color = c_check;
					}
				}
				if(min_color){
					point.min_color = min_color;
					return point;
				}
			}
		});
		for(var i = 0, j = dealing_points.length; i<j; i++){
			var point = dealing_points[i];
			var x = point.x,
				y = point.y,
				min_color = point.min_color;
			var left_top = data_parsing[x][y],
				left_bottom = data_parsing[x+1][y],
				right_top = data_parsing[x][y+1],
				right_bottom = data_parsing[x+1][y+1];

			var checking_points = [];
			var toColor;
			if(left_top.c == right_bottom.c){
				toColor = left_top.c;
				if(left_bottom.c == right_top.c){// 暂时不考虑

				}else{
					checking_points = [{
						p: left_bottom,
						x: x+1,
						y: y
					}, {
						p: right_top,
						x: x,
						y: y+1
					}];
				}
			}else{
				toColor = left_bottom.c;
				checking_points = [{
					p: left_top,
					x: x,
					y: y
				}, {
					p: right_bottom,
					x: x+1,
					y: y+1
				}];
			}
			if(checking_points.length > 0){
				var p_1 = checking_points[0],
					p_2 = checking_points[1];
				_replace_data(_getColorIndex(p_1.c) > _getColorIndex(p_2.c)? p_2: p_1, toColor);
				
			}
		}
	}
	function _replace_data(point, toColor){
		data_parsing[point.x][point.y].c = toColor;
	}
	function _replace_data1(point){
		var x = point.x,
			y = point.y,
			min_color = point.min_color;
		var left_top = data_parsing[x][y],
			left_bottom = data_parsing[x+1][y],
			right_top = data_parsing[x][y+1],
			right_bottom = data_parsing[x+1][y+1];

		var replacing_points = [];
		if(left_top.c !== min_color){
			replacing_points.push({
				x: x,
				y: y,
				p: left_top
			});
		}
		if(left_bottom.c !== min_color){
			replacing_points.push({
				x: x+1,
				y: y,
				p: left_bottom
			});
		}
		if(right_top.c !== min_color){
			replacing_points.push({
				x: x,
				y: y+1,
				p: right_top
			});
		}
		if(right_bottom.c !== min_color){
			replacing_points.push({
				x: x+1,
				y: y+1,
				p: right_bottom
			});
		}
		var min_num_same_color = Number.MAX_VALUE, 
			min_num_same_color_pos;
		// if(test_num++ == 0){
			for(var i = 0, j = replacing_points.length; i<1; i++){
				var item = replacing_points[i];
				var point = item.p;
				var x_p = item.x,
					y_p = item.y;
				var top_p = data_parsing[x_p-1][y_p],
					left_p = data_parsing[x_p][y_p-1],
					right_p = data_parsing[x_p][y_p+1],
					bottom_p = data_parsing[x_p+1][y_p];	
				var num = 0;
				// console.log( min_color, top_p, left_p, right_p, bottom_p);
				if(top_p.c === min_color){
					num++;
				}
				if(left_p.c === min_color){
					num++;
				}
				if(right_p.c === min_color){
					num++;
				}
				if(bottom_p.c === min_color){
					num++;
				}
				if(min_num_same_color > num){
					min_num_same_color = num;
					min_num_same_color_pos = item;
				}

				// var circle = new BMap.Circle(new BMap.Point(point.x, point.y), 70000, {
	   //              strokeColor: 'black', 
	   //              strokeWeight: 0.3, 
	   //              strokeOpacity: 1,
	   //              fillOpacity: 1,
	   //              fillColor: point.c
	   //          });
	   //          map.addOverlay(circle);

	            // var circle1 = new BMap.Circle(new BMap.Point(top_p.x, top_p.y), 70000, {
	            //     strokeColor: 'black', 
	            //     strokeWeight: 0.3, 
	            //     strokeOpacity: 1,
	            //     fillOpacity: 1,
	            //     fillColor: top_p.c
	            // });
	            // map.addOverlay(circle1);
	            // var circle2 = new BMap.Circle(new BMap.Point(left_p.x, left_p.y), 70000, {
	            //     strokeColor: 'black', 
	            //     strokeWeight: 0.3, 
	            //     strokeOpacity: 1,
	            //     fillOpacity: 1,
	            //     fillColor: left_p.c
	            // });
	            // map.addOverlay(circle2);
	            // var circle3 = new BMap.Circle(new BMap.Point(right_p.x, right_p.y), 70000, {
	            //     strokeColor: 'black', 
	            //     strokeWeight: 0.3, 
	            //     strokeOpacity: 1,
	            //     fillOpacity: 1,
	            //     fillColor: right_p.c
	            // });
	            // map.addOverlay(circle3);
	            // var circle4 = new BMap.Circle(new BMap.Point(bottom_p.x, bottom_p.y), 70000, {
	            //     strokeColor: 'black', 
	            //     strokeWeight: 0.3, 
	            //     strokeOpacity: 1,
	            //     fillOpacity: 1,
	            //     fillColor: bottom_p.c
	            // });
	            // map.addOverlay(circle4);
			}
			data_parsing[min_num_same_color_pos.x][min_num_same_color_pos.y].c = min_color;
			// console.log(x, y, min_color, replacing_points, min_num_same_color_pos, min_num_same_color);
			var point1 = min_num_same_color_pos.p;
			var circle0 = new BMap.Circle(new BMap.Point(point1.x, point1.y), 7000, {
                strokeColor: 'black', 
                strokeWeight: 0.3, 
                strokeOpacity: 1,
                fillOpacity: 1,
                fillColor: 'point1.c'
            });
            map.addOverlay(circle0);
		// }
	}
	// 得到端点或结点周围原始点在多边形内的颜色
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

	global._getEndPoints = function(){
		return points_endpoint;
	}	
	global._getNodePoints = function(){
		return points_node;
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
	
	function _build_point_arcs(arc){
		var points = arc.points;
		for(var i = 0, j = points.length; i<j; i++){
			var id_point = points[i].id;
			(point_arcs[id_point] || (point_arcs[id_point] = [])).push(arc);
		}
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
				_cutArc(arc);
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
			_cutArc(arc);
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
		var ids_arc = [];
		var arc_dir = new ArcDir(arc, arc.dir);
		ids_arc.push(arc.id);
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
				ids_arc.push(arc_dir_new.id);
				arc_next = _getNextArc(arc_next);
			}else{
				break;
			}
		}

		arc.numOfUsed += 1;
		ids_arc.sort(function(a, b){
			return a - b;
		});
		polygon.key = ids_arc.join(',');
		return polygon;
	}
	
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
		var fn_return = function(items){
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
		fn_return.reset = function(){
			_cache = {};
			_cache_index = 0;
		}
		return fn_return;
	})();
	function _cutArc(arc){
		var points = arc.points.slice();
		var len = points.length;
		var dir_x, dir_y;
		var points_new = [];
		var point, point_prev;
		while((point = points.shift())){
			if(!point_prev){
				points_new.push(point);
			}else{
				var dir_x_new = !!(point.x - point_prev.x);
				var dir_y_new = !!(point.y - point_prev.y);
				if(dir_x_new == dir_x && dir_y_new == dir_y){
					points_new.pop();
				}
				points_new.push(point);
				dir_x = dir_x_new;
				dir_y = dir_y_new;
			}
			point_prev = point;
		}
		arc.points = points_new;
	}
	var smooth = (function(){
		var arc_cache = {};
	    var dis_squre = Math.pow(0.05 ,2);
	    var percent_new_point = 0.2;
	    var fn_return = function (points, items, is_peak){
	    	// 对边缘直线进行处理
	    	if(is_peak){
	    		return points;
	    	}
	        var len = points.length;
	        //对只有两个点的直线添加外侧点再进行插值
	        if(len == 2){
	            var p1 = points[0],
	                p2 = points[1];
	            var x_p1 = p1.x, y_p1 = p1.y,
	                x_p2 = p2.x, y_p2 = p2.y;
	            var lng_p1 = p1.lng, lat_p1 = p1.lat,
	                lng_p2 = p2.lng, lat_p2 = p2.lat;

	            var p_new1, p_new2;
	            if(x_p1 == x_p2){
	            	if(y_p1 == y_p2){
	            		return points;
	            	}
	                // var p = (y_p1 - y_p2)*percent_new_point;
	                var x_add = (x_p1 - x_p2)*percent_new_point;
	                var lng_add = (lat_p1 - lat_p2)*percent_new_point;
	                var y_midd = y_p1 + (y_p2 - y_p1)/2;
	                var lat_midd = lat_p1 + (lat_p2 - lat_p1)/2;
	                p_new1 = {
	                    x: x_p1 + x_add,
	                    y: y_midd,
	                    lng: lng_p1-lng_add,
	                    lat: lat_midd
	                };
	                p_new2 = {
	                    x: x_p1 - x_add,
	                    y: y_midd,
	                    lng: lng_p1+lng_add,
	                    lat: lat_midd
	                };
	            }else{
	                var y_add = (y_p1 - y_p2)*percent_new_point;
	                var lat_add = (lng_p1 - lng_p2)*percent_new_point;
	                var x_midd = x_p1 + (x_p2 - x_p1)/2;
	                var lng_midd = lng_p1 + (lng_p2 - lng_p1)/2;
	                p_new1 = {
	                    x: x_midd,
	                    y: y_p1 + y_add,
	                    lng: lng_midd,
	                    lat: lat_p1 + lat_add
	                };
	                p_new2 = {
	                    x: x_midd,
	                    y: y_p1 - y_add,
	                    lng: lng_midd,
	                    lat: lat_p1 - lat_add
	                };
	            }
	            var p_new = utils.isInsidePolygon(items, p_new1.x, p_new1.y)? p_new2: p_new1;
	            points = [p1, p_new, p2];
	            len = 3;
	        }
	        if(len >= 3){
	            var id_s = points[0].id,
	                id_e = points[len - 1].id;
	            var key_flag = len;
	            // 对只有三个点，在同一个有四个点的面里的对立面加强缓存处理
	            if(len == 3){
	            	key_flag += ',' + points[1].id;
	            }
	            var key = id_s + ',' + id_e+','+key_flag;
	            var val_cache = arc_cache[key];
	            if(val_cache){
	                return val_cache;
	            }else{
	                var key_reserve = id_e + ',' + id_s+','+key_flag;
	                val_cache = arc_cache[key_reserve];
	                if(val_cache){
	                    val_cache.reverse();
	                    return val_cache;
	                }else{
	                    var result = smoothBSpline(points, 5);
	                    // var prev_point = result.shift();
	                    // var result_new = [prev_point];
	                    // for(var i = 1, j = result.length; i<j; i++){
	                    //     var p = result[i];
	                    //     if(Math.pow(prev_point.lng - p.lng, 2) + Math.pow(prev_point.lat - p.lat, 2) >= dis_squre){
	                    //         result_new.push(p);
	                    //         prev_point = p;
	                    //     }
	                    // }
	                    // // result_new.push(result.pop());
	                    // var first_point = result_new[0],
	                    //     last_point = result_new[result_new.length-1];
	                    // if(Math.pow(first_point.lng - last_point.lng, 2) + Math.pow(first_point.lat - last_point.lat, 2) < dis_squre){
	                    //     result_new.pop();
	                    // }

	                    (arc_cache[key] = result);
	                    return result;
	                }
	            }                        
	        }
	        return points;                    
	    }
	    fn_return.reset = function(){
	    	arc_cache = {};
	    }
	    return fn_return;
	})();
	// 对描完的边进行平滑处理
	function _dealItems(items){
		// if(items.length == 4){
		// 	return smoothSpline(items, true, 0.03);
		// }
        // return [items];
        var items_new = [];
        var arr_index = [];
        for(var i = 0, j = items.length; i<j; i++){
            if(items[i].type == 1){
                arr_index.push(i);
            }
        }

        if(arr_index.length <= 1){
        	items_new.push(items);
        }else{
            var last_index = arr_index[0];
            if(last_index != 0){
                items_new.push(items.slice(0, last_index));
            }
            for(var i = 0, j = arr_index.length; i<j && i+1<j; i++){
                last_index = arr_index[i+1];
                items_new.push(items.slice(arr_index[i], last_index));
            }
            if(last_index < items.length){
                items_new.push(items.slice(last_index));
            }
        }
        var items_return = [];
        for(var i = 0, j = items_new.length; i<j; i++){
            var flag_islast = i == j-1;
            var p_add = null;
            if(i+1 < j){
                p_add = items_new[i+1][0];
            }else{
                p_add = items_new[0][0];;
            }
            // var result = _smoothSpline(items_new[i]);
            items_new[i].push(p_add);
            var _item = items_new[i];
            var _first_item = _item[0];
            
            var x_s = _first_item.x,
            	y_s = _first_item.y;
            var isequal_x = x_s == 0 || x_s == width_data-2,
            	isequal_y = y_s == 0 || y_s == height_data-2;

            // 对边缘的直线进行过滤
            var is_peak = true;
            for(var i_test = 1, j_test = _item.length; i_test<j_test; i_test++){
            	var item_test = _item[i_test],
            		x_test = item_test.x,
            		y_test = item_test.y;

            	var flag = (x_s == x_test && isequal_x) || (y_s == y_test && isequal_y);
            	if(!flag){
            		is_peak = false;
            		break;
            	}
            }
            var result = smooth(_item, items, is_peak);
            var l = result.length;
            if(l > 0){
                var p_last = result[l-1];
                if(p_add && p_last.lng == p_add.lng && p_last.lat == p_add.lat){
                    result.pop();
                }
            }
            items_return = items_return.concat(result);
        }
        return items_return;
    }
    function _smoothPolygons(){
    	for(var i = polygons.length-1; i>=0; i--){
    		var polygon = polygons[i];
    		polygon.items = _dealItems(polygon.items);
    	}
    }
    var cache_polygons_arc = {};
	// 解析polygon
	function _parsePolygons(){
		var polygons_new = [];
		var polygon;
		while((polygon = polygons.shift())){
			var items = [];
			var arcDirs = polygon.arcDirs;
			cache_polygons_arc[polygon.id] = arcDirs;
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
		_sort(polygons_new);
		polygons_new.shift();// 去掉面积最大的
		
		polygons = polygons_new;
		return polygons_new;
	}
	function _sort(_polygons){
		(_polygons || polygons).sort(function(a, b){
			return Math.abs(b.area) - Math.abs(a.area) || a.id - b.id;
		});
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
	// 生成不重复的多边形数组
	function unique_polygons(polygons){
		var polygons_new = [];
		var obj = {};
		for(var i = 0, j = polygons.length; i<j; i++){
			var p = polygons[i];
			if(!obj[p.key]){
				obj[p.key] = 1;
				polygons_new.push(p);
			}
		}
		return polygons_new;
	}
	// 给多边形添加颜色
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
	// 预处理数据
	var _pretreatmentData = function(data, color_novalue){
		var data_new = [];
    	width_data = data.length;
    	height_data = data[0].length;

    	for(var i = 0; i<width_data; i++){
    		var item_arr = data[i];
    		var arr = [];
    		for(var j = 0; j<height_data; j++){
    			var item = item_arr[j];
    			if(i == 0 || j == 0|| i == width_data - 1 || j == height_data - 1){
    				item.c = color_novalue;
    			}
    			arr.push(item);
    		}
    		data_new.push(arr);
    	}
    	data_parsing_new = data_new;
		data_parsing = data;
		color_novalue_parsing = color_novalue;
		_parseData();
	}
	// 重置操作
	function _reset(){
		_index_arc = 0;
		_index_polygon = 0;
		points_endpoint = [], //所有端点
		points_node = [];//所有结点
		arcs = [],//存储端点连续的弧段
		arcs_node = [];
		point_arcs = {}; //存储点和弧段关系
		polygons = []; //存储多边形

		_cache_area.reset();
		smooth.reset();
	}

	function _getEqualArc(arc_dirs_a, arc_dirs_b){
		var result = [];
		for(var i_a = 0, j_a = arc_dirs_a.length; i_a<j_a; i_a++){
			var arc_a = arc_dirs_a[i_a];
			var arc_a_id = arc_a.arc.id;
			for(var i_b = 0, j_b = arc_dirs_b.length; i_b<j_b; i_b++){
				var arc_b = arc_dirs_b[i_b];
				if(arc_a_id == arc_b.arc.id){
					result.push(arc_a);
					break;
				}
			}
		}
		return result;
	}
	function _getNeighborPolygon(polygon, polygons_small){
		var result = [];
		var id = polygon.id;
		var arc_dirs = cache_polygons_arc[id];
		for(var i = 0, j = polygons_small.length; i<j; i++){
			var p_check = polygons_small[i];
			var id_check = p_check.id;
			if(id_check == id){
				continue;
			}
			var arc_same = _getEqualArc(arc_dirs, cache_polygons_arc[id_check]);
			if(arc_same.length > 0){
				result.push({
					p: p_check,
					arc: arc_same
				});
				polygons_small.splice(i, 1);
				i--;
				j--;
			}
		}
		if(result.length > 0){
			for(var i = 0, j = result.length; i<j; i++){
				var r = _getNeighborPolygon(result[i].p, polygons_small);
				result = result.concat(r);
			}
		}
		return result;
	}
	function _clipItems(items, same_points){
		same_points = same_points.slice();
		// var p_start = same_points.shift();
		// var p_end = same_points.pop();
		var items_new = [];
		var items_tmp ;
		var flag_change = false;
		var add_index = -1;
		
		for(var i = 0, j = items.length; i<j; i++){
			var flag_in = false;
			var p = items[i],
				id = p.id;
			for(var i_c = 0, j_c = same_points.length; i_c<j_c; i_c++){
				if(same_points[i_c].id == id){
					flag_in = true;
					break;
				}
			}
			
			if(!flag_in){
				if(i == 0){
					flag_change = true;
				}
				items_new.push(p);
			}else{
				if(flag_change && !items_tmp){
					items_tmp = items_new.splice(0);
				}
			}
		}
		if(items_tmp){
			items_new = items_new.concat(items_tmp);
		}
		return items_new;
	}
	// 对多面进行聚合处理
	function _mergePolygon(){
		var polygons_small = polygons.filter(function(v, i){
			if(v.area < 3 && cache_polygons_arc[v.id]){
				return v;
			}
		});
		// polygons = polygons_small.slice();
		var polygons_new = [];
		var polygon;
		while((polygon = polygons_small.shift())){
			var neighbor = _getNeighborPolygon(polygon, polygons_small);
			if(neighbor.length > 0){
				var c = polygon.color;
				var arc_new = cache_polygons_arc[polygon.id];

				var items_new = polygon.items.slice();
				// if(polygon.area < -1){
				// 	items_new.reverse();
				// }
				var tmp;
				// neighbor = [neighbor[0]];
				while((tmp = neighbor.shift())){
					var p_tmp = tmp.p;
					var same_arc = _getEqualArc(arc_new, cache_polygons_arc[p_tmp.id]);

					for(var i_tmp = 0, j_tmp = same_arc.length; i_tmp < j_tmp; i_tmp++){
						var points_same = same_arc[i_tmp].arc.points;
						var p_start = points_same[0],
							p_end = points_same[points_same.length - 1];
						var result = _clipItems(items_new, points_same);
						// result.unshift(p_start);
						// result.push(p_start);
						var result_new = _clipItems(p_tmp.items, points_same);
						// if(p_tmp.area < -1){
						// 	result_new.reverse();
						// }
						items_new = result.concat(result_new);
					}
					// polygons_new.push(tmp.p);
				}
				polygons.push({
					items: items_new,
					color: c,
					area: getArea(items_new)
				});

				// polygons_new.push(polygon);
				// for(var i = 0, j = neighbor.length; i<j; i++){
				// 	polygons_new.push(neighbor[i].p);
				// }
			}else{

			}
		}
		// console.log(polygons_new);
		// polygons = polygons_new;
		
	}
	global._smooth = smooth;
	global._dealItems = _dealItems;
	global.utils = utils;
	global._smoothSpline = smoothSpline;
	global._smoothBSpline = smoothBSpline;
	global._pretreatmentData = _pretreatmentData;
	global._makeArcs = _makeArcs;
	global._makePolygons = _makePolygons;
	global._parsePolygons = _parsePolygons;
	global._addColor = _addColor;
	global._smoothPolygons = _smoothPolygons;
	global.raster2vector = function(data, color_novalue){
		_reset();
		_pretreatmentData(data, color_novalue);
		_makeArcs();
	    _makePolygons();
	    _parsePolygons();

		_addColor(polygons);
	    // _mergePolygon();
		_smoothPolygons();
		_sort();
	    return polygons;
	}
}(typeof __dirname == 'undefined'? this: exports);