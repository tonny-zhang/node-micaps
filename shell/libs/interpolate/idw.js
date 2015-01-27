
function _interpolate(lnglat_arr, data){
	lnglat_arr.forEach(function(v_lnglat){
		var sum0 = 0, sum1 = 0;
		data.forEach(function(v_data){
			var x = v_data.x,
				y = v_data.y,
				v = v_data.v;
			var dis = Math.sqrt(Math.pow(v_lnglat.x-x, 2)+Math.pow(v_lnglat.y-y, 2));
			sum0 += v/dis;
			sum1 += 1/dis;
		});
		if(sum1 != 0){
			v_lnglat.v = sum0 / sum1;
		}else{
			v_lnglat.v = 0;
		}
	});
	return lnglat_arr;
}

// function Interpolation_IDW_Neighbor(lnglat_arr, data, NumberOfNearestNeighbors, unDefData){
// 	var numArray = [];
// 	var len_data = data.length;
// 	var numArray2 = [];
// 	var objArray = [];
// 	lnglat_arr.forEach(function(v_lnglat, num4){
// 		v_lnglat.forEach(function(v_lat, num5){
// 			if(!numArray[num4]){
// 				numArray[num4] = [];
// 			}
// 			numArray[num4][num5] = unDefData;
// 			var index = 0;
// 			var num14 = 0;
// 			var num9;
// 			var num10 = num11 = 0;
// 			while(index < len_data){//遍历站点
// 				var d = data[index];

// 				var val = d.v;
// 				if(val == unDefData){//如果站点资料为缺省值，该格点到该站点距离倒数（站点对格点的权重）设置为-1.0
// 					numArray2[index] = -1;
// 				}else{
// 					var dis = Math.pow(v_lat.x-d.x, 2)+Math.pow(v_lat.y-d.y, 2);
// 					if(dis == 0){
// 						numArray[num4][num5] = val;
// 						break;
// 					}
// 					//如果站点经纬度和该网格点经纬度不同，计算该网格点和该站点的距离倒数（站点对格点的权重），并赋值到临时站点数据
// 					num9 = 1/dis;
// 					numArray2[index] = num9;
// 					if(num14 < NumberOfNearestNeighbors){
// 						objArray[num14] = [num9, index]; // [（站点对格点的权重）在变, 序号是值不为缺省的前NumberOfNearestNeighbors个]
// 					}
// 					num14++;
// 				}
// 				index++;
// 			}
// 			if(numArray[num4][num5] == unDefData){
// 				index = 0;
// 				while(index < len_data){//遍历站点
// 					num9 = numArray2[index];
// 					if (num9 != -1){
// 						var num8 = 0;
// 						var num12 = objArray[0][0];
// 						for(var i = 1;i<NumberOfNearestNeighbors;i++){
// 							if(objArray[i][0] < num12){
// 								num12 = objArray[i][0];
// 								num8 = i;
// 							}
// 						}
// 						if(num9 > num12){
// 							objArray[num8] = [num9, index];
// 						}
// 					}
// 					index++;
// 				}
// 				for(index = 0;index<NumberOfNearestNeighbors;index++){
// 					num10 += objArray[index][0] * (data[objArray[index][1]]).v;
// 					num11 += objArray[index][0];
// 				}
// 				numArray[num4][num5] = num10 / num11;
// 			}
// 			v_lat.v = numArray[num4][num5];
// 		});
// 	});
// 	// console.log(numArray);return;
// 	//再次通过该点上下左右和自身值做加权平均重新计算每个格点的插值
// 	var num15 = 0.5/4;
// 	for(num4 = 1,len_x = lnglat_arr.length - 1;num4<len_x;num4++){
// 		var item = lnglat_arr[num4];
// 		for(num5 = 1,len_y = item.length - 1;num5<len_y;num5++){
// 			numArray[num4][num5] += num15 * (numArray[num4 + 1][num5] + numArray[num4 - 1][num5] + numArray[num4][num5 + 1] + numArray[num4][num5 - 1] - 4 * numArray[num4][num5]);
// 			item.v = numArray[num4][num5];
// 		}	
// 	}
// 	return numArray;
// }
function Interpolation_IDW_Neighbor(SCoords, lnglat_arr, NumberOfNearestNeighbors, unDefData, bCalAllGrids){
	var num4,num5;
	var length = lnglat_arr.length,
		num = lnglat_arr[0].length,
		num3 = SCoords.length,
		numArray = [],
		num13 = NumberOfNearestNeighbors,
		numArray2 = new Array(num3),
		objArray = [[],[]];
	for(num4 = 0; num4 < num; num4++){
		num5 = 0;
		while( num5 < length ){
			var num9;
			if(!numArray[num4]){
				numArray[num4] = [];
			}
			numArray[num4][num5] = unDefData;
			var num10 = num11 = 0;
			var num14 = index = 0;
			while(index < num3){
				var d = SCoords[index];
				var val = d.v;
				if(val == unDefData){
					numArray2[unDefData] = -1;
				}else{
					var lnglat = lnglat_arr[num5][num4];
					var dis = Math.pow(lnglat.x-d.x, 2)+Math.pow(lnglat.y-d.y, 2);
					if(dis == 0){
						numArray[num4][num5] = val;
						break;
					}
					num9 = 1/dis;
					numArray2[index] = num9;
					if(num14 < num13){
						objArray[0][num14] = num9;
						objArray[1][num14] = index;
					}
					num14++;
				}
				index++;
			}
			if(numArray[num4][num5] == unDefData){
				index = 0;
				while(index < num3){
					num9 = numArray2[index];
					if(num9 != -1){
						var num12 = objArray[0][0];
						var num8 = 0;
						for(var i = 1;i<num13;i++){
							if(objArray[0][i] < num12){
								num12 = objArray[0][i];
								num8 = i;
							}
						}
						if(num9 > num12){
							objArray[0][num8] = num9;
							objArray[1][num8] = index;
						}
					}
					index++;
				}
				var flag = true;
				for(index = 0;index < num13;index++){
					var v = objArray[0][index];
					if(v < DIS_POINTS){
						flag = false;
					}
					num10 += v * (SCoords[objArray[1][index]]).v;
					num11 += v;
				}
				numArray[num4][num5] = bCalAllGrids || flag? num10 / num11: unDefData;
			}
			num5++;
		}
	}
	if(bCalAllGrids){
		var num15 = 0.5;
		for(num4 = 1; num4 < num - 1; num4++){
			for(num5 = 1; num5 < length - 1; num5++){
				numArray[num4][num5] += (num15 / 4.0) * ((((numArray[num4 + 1][num5] + numArray[num4 - 1][num5])+numArray[num4][num5 + 1])+numArray[num4][num5 - 1]) - (4.0 * numArray[num4][num5]));
			}
		}
	}
	var returnArr = [];
	numArray.forEach(function(v, num4){
		v.forEach(function(item, num5){
			var lnglat = lnglat_arr[num5][num4];
			lnglat.v = item;
			// if(item != unDefData){
				// returnArr.push({
				// 	y: lnglat.y,
				// 	x: lnglat.x,
				// 	v: item
				// });
			// }
		});
	});
	// returnArr.sort(function(a, b){
	// 	return a.v > b.v;
	// });
	return lnglat_arr;
}
var GRID_SPACE = 3;//0.5,
	DIS_POINTS = 0.2;
function genLngLatArr(x0, y0, x1, y1, x_num, y_num){
	var arr = [];
	var x_num = Math.ceil((x1 - x0)/GRID_SPACE),
		y_num = Math.ceil((y1 - y0)/GRID_SPACE);
		console.log(x_num, y_num);
	for(i = 0;i<x_num;i++){
		var x = x0 + GRID_SPACE*i;
		var val = [];
		for(j = 0;j<y_num;j++){
			var y = y0 + GRID_SPACE*j;
			val.push({
				x: x,
				y: y
			});
		}
		arr.push(val);	
	}

	return arr;
}
// function genLngLatArr(x0, y0, x1, y1){
// 	var arr_x  = [],
// 		arr_y = [];
// 	var x_num = Math.ceil((x1 - x0)/GRID_SPACE),
// 		y_num = Math.ceil((y1 - y0)/GRID_SPACE);
// 	for(var i = 0;i<x_num;i++){
// 		var x = x0 + GRID_SPACE*i;
// 		arr_x.push(x);
// 	}
// 	for(var j = 0;j<y_num;j++){
// 		var y = y0 + GRID_SPACE*j;
// 		arr_y.push(y);
// 	}
// 	return [arr_x, arr_y];
// }
exports.interpolate = Interpolation_IDW_Neighbor;
exports.genLngLatArr = genLngLatArr;