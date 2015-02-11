! function() {
	var global = typeof exports == 'undefined' ? window : exports;

	var global_data //存储外界传进来的数据，方便全局使用
		, global_data_width //数据width
		, global_data_height //数据height
		, obj_flag = {} //存储标记后的结果，第个对象形如：{x: 2, y: 2, n: 2, n_u: 0}, n 为和自身颜色不一样的其它颜色个数, n_u 为已经参与了几个多边形的描边
		,
		arr_eara = [] //存储描完边的多边形，形如： {items: [{x: 110.11, y: 30.25}], color: '#ff0000', clip: [{x: 111.12, y: 23.2}]} , clip 是要对本多边形进行的挖空操作

	function _get_around(x, y) {
		var current_point = global_data[x][y]; // 得到当前点
		var obj_return = {
			left: null,
			right: null,
			above: null,
			below: null,
			n: 0
		};
		var color_current = current_point.color;
		var int_num_different = 0;
		try {
			var color_left = global_data[x - 1][y]; // 左
			if (color_left.color != color_current) {
				int_num_different++;
			}
			obj_return.left = color_left;
		} catch (e) {}
		try {
			var color_right = global_data[x + 1][y]; // 右
			if (color_right.color != color_current) {
				int_num_different++;
			}
			obj_return.right = color_right;
		} catch (e) {}
		try {
			var color_above = global_data[x][y - 1]; // 上
			if (color_above.color != color_current) {
				int_num_different++;
			}
			obj_return.above = color_above;
		} catch (e) {}
		try {
			var color_below = global_data[x][y + 1]; // 下
			if (color_below.color != color_current) {
				int_num_different++;
			}
			obj_return.below = color_below;
		} catch (e) {}

		obj_return.n = int_num_different;

		return obj_return;
	}

	function _get_flag(x, y) {
		var key = x + '_' + y;
		return obj_flag[key];
	}
	/*得到点周围被标记的点数组*/
	function _get_around_flag(x, y, is_return_next) {
		var arr_return = [];
		var obj_above = _get_flag(x, y - 1);
		if (obj_above) {
			arr_return.push(obj_above);
		}
		var obj_above_right = _get_flag(x + 1, y - 1);
		if (obj_above_right) {
			arr_return.push(obj_above_right);
		}
		var obj_right = _get_flag(x + 1, y);
		if (obj_right) {
			arr_return.push(obj_right);
		}
		var obj_below_right = _get_flag(x + 1, y + 1);
		if (obj_below_right) {
			arr_return.push(obj_below_right);
		}
		var obj_below = _get_flag(x, y + 1);
		if (obj_below) {
			arr_return.push(obj_below);
		}
		var obj_below_left = _get_flag(x - 1, y + 1);
		if (obj_below_left) {
			arr_return.push(obj_below_left);
		}
		var obj_left = _get_flag(x - 1, y);
		if (obj_left) {
			arr_return.push(obj_left);
		}
		var obj_above_left = _get_flag(x - 1, y - 1);
		if (obj_above_left) {
			arr_return.push(obj_above_left);
		}
		if (is_return_next) {
			var color_current = _get_flag(x, y).color;
			var obj_tmp;
			while ((obj_tmp = arr_return.shift())) {
				if (obj_tmp.color == color_current && obj_tmp.area.indexOf(int_global_area_index) == -1) {
					return obj_tmp;
				}
			}
			return;
		}
		return arr_return;
	}
	/*标记边界点，并初始化每个点可能要使用的情况*/
	function _flag() {
		for (var i = 0; i < global_data_width; i++) {
			for (var j = 0; j < global_data_height; j++) {
				var obj_info_around = _get_around(i, j);
				if (obj_info_around.n > 0 || i == 0 || j == 0 || i == global_data_width - 1 || j == global_data_height - 1) {
					obj_flag[i + '_' + j] = {
						x: i,
						y: j,
						n: obj_info_around.n,
						n_u: 0,
						around: obj_info_around,
						area: [],
						color: (global_data[i][j]).color
					};
				}
			}
		}
	}
	/*得到没有被使用的标记点*/
	function _get_no_used_item() {
		for (var i in obj_flag) {
			var obj_item = obj_flag[i];
			if (obj_item.n_u == 0) {
				obj_item.n_u++;
				return obj_item;
			}
		}
	}
	var arr_fork_info = []; //存储有分岔的点
	var obj_last_next_point_global; //记录最后一个操作点
	// 对当前点进行替换（主要处理已经使用的边界）
	function _replace_current(x, y, arr_around_flag) {
		if (!arr_around_flag) {
			arr_around_flag = _get_around_flag(x, y);
		}
		var obj_current_point = _get_flag(x, y); // 得到当前点
		var color_current_point = obj_current_point.color;

		var arr_replaced_flag = [],
			int_fork_num = 0;
		for (var i = 0, j = arr_around_flag.length; i < j; i++) {
			var obj_item = arr_around_flag[i];
			var int_n_u = obj_item.n_u;
			if (int_n_u > 0 && obj_item.color != color_current_point) {
				arr_replaced_flag.push(obj_item);
			}
			if (obj_last_next_point_global != obj_item && obj_item.color == color_current_point) {
				int_fork_num++;
			}
		}
		if (int_fork_num > 1) {
			arr_fork_info.push(obj_current_point); //有分岔
		}
		// 对格点边界点进行填充
		// if(x == 0 || y == global_data_width-1){
		// 	arr_replaced_flag.unshift(obj_current_point);
		// }
		// if(x == global_data_width-1 || y == 0){
		// 	arr_replaced_flag.push(obj_current_point);
		// }
		obj_last_next_point_global = obj_current_point;
		for (var i = 0, j = arr_replaced_flag.length; i < j; i++) {
			arr_replaced_flag[i].area.push(int_global_area_index);
		}
		obj_current_point.area.push(int_global_area_index);
		if (arr_replaced_flag.length == 0) {
			arr_replaced_flag.push(obj_current_point);
		}

		return arr_replaced_flag;
	}

	function _next_is_first(x, y, obj_first_items) {
		var arr_arround = _get_around_flag(x, y);
		for (var i = 0, j = obj_first_items.length; i < j; i++) {
			if (arr_arround.indexOf(obj_first_items[i]) > -1) {
				return true;
			}
		}
	}
	/*得到下一个最优点*/
	function _get_next_put_items(x, y, obj_first_items) {
		var obj_current_point = _get_flag(x, y); // 得到当前点
		var color_current_point = obj_current_point.color;
		var obj_next = _get_around_flag(x, y, true);

		var arr_return_items = [];
		if (obj_next) {
			console.log(1, obj_next);
			var arr_next_items;
			while ((arr_next_items = _replace_current(obj_next.x, obj_next.y)) && arr_next_items.length > 0) {
				arr_return_items = arr_return_items.concat(arr_next_items);
				obj_next = _get_around_flag(obj_next.x, obj_next.y, true);
				if (obj_next) {
					console.log(2, obj_next);
					arr_return_items = arr_return_items.concat(_replace_current(obj_next.x, obj_next.y));
					var arr_get = _get_next_put_items(obj_next.x, obj_next.y, obj_first_items);
					if (arr_get.length == 0) {
						break;
					} else {
						arr_return_items = arr_return_items.concat(arr_get);
					}
				} else {
					break;
				}

			}
			return arr_return_items;
		}
	}
	var int_global_area_index = 0;
	/*把已经标记的点进行描边操作*/
	function _stroke() {
		var obj_item;
		while ((obj_item = _get_no_used_item())) {
			arr_fork_info = []; //重置分岔点记录信息
			var arr_area_items = [];
			var color_current_area = obj_item.color;
			var obj_first_items = _replace_current(obj_item.x, obj_item.y);
			arr_area_items = arr_area_items.concat(obj_first_items);
			var arr_next_items = _get_next_put_items(obj_item.x, obj_item.y, obj_first_items);
			if (arr_next_items.length > 0) {
				arr_area_items = arr_area_items.concat(arr_next_items);
			}
			int_global_area_index++;
			arr_eara.push({
				items: arr_area_items,
				color: color_current_area
			});
			if (int_global_area_index == 1) {
				break;
			}
		}
	}
	// 这里的data是外界格式好的，是插值后的结果根据值添加颜色字段后的数组
	function _init(data) {
		try {
			global_data_width = data.length;
			global_data_height = data[0].length;
			global_data = data;
			console.log(global_data)
		} catch (e) {
			global_data = global_data_width = global_data_height = null; //对不合法的数据进行清空处理
		}
		if (global_data && global_data_width > 0 && global_data_height > 0) {
			_flag();
			_stroke();
		}
	}

	// 对个提供接口
	global.Stroker = {
		init: _init,
		_get_flag: function() {
			return obj_flag;
		},
		_get_erea: function() {
			return arr_eara;
		}
	}
}()