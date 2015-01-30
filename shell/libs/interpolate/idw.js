function Interpolation_IDW_Neighbor(SCoords, lnglat_arr, NumberOfNearestNeighbors, unDefData, bCalAllGrids){
	var num4,num5;
	var length = lnglat_arr.length,	//获取X数组大小
		num = lnglat_arr[0].length,	//获取Y数组大小
		num3 = SCoords.length,		//获取SCoords二维数组第二维长度
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
					numArray2[index] = -1;
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
						for(var i = 1; i<num13; i++){
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
		});
	});
	return lnglat_arr;
}
var GRID_SPACE = 0.5,
	DIS_POINTS = 0.5;
function genLngLatArr(x0, y0, x1, y1, x_num, y_num){
	var arr = [];
	var x_num = Math.ceil((x1 - x0)/GRID_SPACE),
		y_num = Math.ceil((y1 - y0)/GRID_SPACE);
	
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
exports.interpolate = Interpolation_IDW_Neighbor;
exports.genLngLatArr = genLngLatArr;