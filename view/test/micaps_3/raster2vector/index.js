!function(g){
	var global = {};

	var DEFAULT_VAL = 999999;
    var REG_RGB = /rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/i;
    var REG_HTML = /#([\da-f]{2})([\da-f]{2})([\da-f]{2})/i;
    function color_normal2rgba(color_html,isReturnArray){
        if(color_html){
            var m = REG_HTML.exec(color_html);
            if(m){
                var arr = [parseInt(m[1],16),parseInt(m[2],16),parseInt(m[3],16)];

                if(isReturnArray){
                    return arr;
                }
                return 'rgba('+(arr.join(','))+', 255)';
            }else{
                var m = REG_RGB.exec(color_html);
                if(m){
                	m.push(255);
                    if(isReturnArray){
                        m.shift();
                        return m;
                    }else{
                        return color_html;
                    }
                }
            }
        }
    }
    var _color_arr = [
    	'rgba(255,255,255, 255)',
		'rgba(255,255,0, 255)',
		'rgba(255,0,255, 255)',
		'rgba(0,255,255, 255)',
		'rgba(255,168,0, 255)',
		'rgba(0,255,0, 255)',
		'rgba(102,51,0, 255)',
		'rgba(102,255,0, 255)',
		'rgba(204,0,51, 255)'
    ];
    var blendent = [{
        "val": {
            "n": "温度",
            "v": "102"
        },
        "color_start": "#0000ff",
        "color_end": "#ff0000",
        "is_stripe": false,
        "number_min": "-30",
        "number_max": "40",
        "number_level": "8",
        "colors": [{
            "is_checked": true,
            "color": "#1f1885",
            "color_text": "#ffffff",
            "val": [-9999, -30],
            "text": "＜-30℃",
            "order": 0
        }, {
            "is_checked": true,
            "color": "#1149d8",
            "color_text": "#ffffff",
            "val": [-30, -20],
            "text": "-30~-20",
            "order": 0
        }, {
            "is_checked": true,
            "color": "#4db4f5",
            "color_text": "#000000",
            "val": [-20, -10],
            "text": "-20~-10",
            "order": 0
        }, {
            "is_checked": true,
            "color": "#f9de46",
            "color_text": "#000000",
            "val": [-10, 0],
            "text": "-10~0",
            "order": 0
        }, {
            "is_checked": true,
            "color": "#f9f2bb",
            "color_text": "#000000",
            "val": [0, 10],
            "text": "0~10",
            "order": 0
        }, {
            "is_checked": true,
            "color": "#f9de46",
            "color_text": "#000000",
            "val": [10, 20],
            "text": "10~20",
            "order": 0
        }, {
            "is_checked": true,
            "color": "#ffa800",
            "color_text": "#000000",
            "val": [20, 30],
            "text": "20~30",
            "order": 0
        }, {
            "is_checked": true,
            "color": "#ff6c00",
            "color_text": "#000000",
            "val": [30, 35],
            "text": "30~35",
            "order": 0
        }, {
            "is_checked": true,
            "color": "#e70000",
            "color_text": "#ffffff",
            "val": [35, 40],
            "text": "35~40",
            "order": 0
        }, {
            "is_checked": true,
            "color": "#9d0000",
            "color_text": "#ffffff",
            "val": [40, 99999],
            "text": "≥40℃",
            "order": 0
        }]
    }];
    var blendent = [{
            "val": {
                "n": "雨",
                "v": 26
            },
            "color_start": "#0000ff",
            "color_end": "#ff0000",
            "is_stripe": false,
            "number_min": "0",
            "number_max": "100",
            "number_level": "2",
            "colors": [{
                "is_checked": true,
                "color": "#ff6000",
                "color_text": "#000000",
                "val": [-9999, 9.9],
                "text": "0-10%",
                "order": 0
            }, {
                "is_checked": true,
                "color": "#FFEA7D",
                "color_text": "#000000",
                "val": [9.9, 19.9],
                "text": "10-20%",
                "order": 0
            }, {
                "is_checked": true,
                "color": "#FDF2B4",
                "color_text": "#000000",
                "val": [19.9, 29.9],
                "text": "20-30%",
                "order": 0
            }, {
                "is_checked": true,
                "color": "#C9F9F3",
                "color_text": "#000000",
                "val": [29.9, 39.9],
                "text": "30-40%",
                "order": 0
            }, {
                "is_checked": true,
                "color": "#5FE4EF",
                "color_text": "#000000",
                "val": [39.9, 49.9],
                "text": "40-50%",
                "order": 0
            }, {
                "is_checked": true,
                "color": "#60BBE5",
                "color_text": "#ffffff",
                "val": [49.9, 59.9],
                "text": "50-60%",
                "order": 0
            }, {
                "is_checked": true,
                "color": "#0088E8",
                "color_text": "#ffffff",
                "val": [59.9, 69.9],
                "text": "60-70%",
                "order": 0
            }, {
                "is_checked": true,
                "color": "#0056ED",
                "color_text": "#ffffff",
                "val": [69.9, 79.9],
                "text": "70-80%",
                "order": 0
            }, {
                "is_checked": true,
                "color": "#2C29CB",
                "color_text": "#ffffff",
                "val": [79.9, 89.9],
                "text": "80-90%",
                "order": 0
            }, {
                "is_checked": true,
                "color": "#22217C",
                "color_text": "#ffffff",
                "val": [89.9, 99999],
                "text": "90-100%",
                "order": 0
            }]
        }];
    //24小时变温实况
    var blendent = [{
            "val": {
                "n": "温度",
                "v": "102"
            },
            "color_start": "#0000ff",
            "color_end": "#ff0000",
            "is_stripe": false,
            "number_min": "-8",
            "number_max": "8",
            "number_level": "9",
            "colors": [{
                "is_checked": true,
                "color": "#360b81",
                "color_text": "#ffffff",
                "val": [-9999, -8],
                "text": "<-8℃",
                "order": 0
            }, {
                "is_checked": true,
                "color": "#523fb5",
                "color_text": "#ffffff",
                "val": [-8, -6],
                "text": "-8~-6",
                "order": 0
            }, {
                "is_checked": true,
                "color": "#5776d3",
                "color_text": "#000000",
                "val": [-6, -4],
                "text": "-6~-4",
                "order": 0
            }, {
                "is_checked": true,
                "color": "#75abd1",
                "color_text": "#000000",
                "val": [-4, -2],
                "text": "-4~-2",
                "order": 0
            }, {
                "is_checked": true,
                "color": "#a9f6ee",
                "color_text": "#000000",
                "val": [-2, -1],
                "text": "-2~-1",
                "order": 0
            }, {
                "is_checked": true,
                "color": "#ecfdc7",
                "color_text": "#000000",
                "val": [-1, 1],
                "text": "-1~1",
                "order": 0
            }, {
                "is_checked": true,
                "color": "#edcf75",
                "color_text": "#000000",
                "val": [1, 2],
                "text": "1~2",
                "order": 0
            }, {
                "is_checked": true,
                "color": "#f49006",
                "color_text": "#000000",
                "val": [2, 4],
                "text": "2~4",
                "order": 0
            }, {
                "is_checked": true,
                "color": "#f15d07",
                "color_text": "#000000",
                "val": [4, 6],
                "text": "4~6",
                "order": 0
            }, {
                "is_checked": true,
                "color": "#e2000b",
                "color_text": "#ffffff",
                "val": [6, 8],
                "text": "6~8",
                "order": 0
            }, {
                "is_checked": true,
                "color": "#bc012c",
                "color_text": "#ffffff",
                "val": [8, 99999],
                "text": "≥8℃",
                "order": 0
            }]
        }];
    function getColorByCondition(val, range){
        for(var i = 0,j=range.length;i<j;i++){
            var case_range = range[i];
            if(case_range.is_checked){
                var val_range = case_range.val;
                if(val >= val_range[0] && val < val_range[1]){
                    return case_range.color;
                }
            }
        }
        return COLOR_TRANSPANT;
    }
    function getColor(val, code){
        if(blendent > 1){
            for(var i = 0;i<len_blendent;i++){
                var v = blendent[i];
                if(code == v.val.v){
                    return getColorByCondition(val, v.colors);
                }
            }
        }
        return getColorByCondition(val, blendent[0].colors);
    }
    var COLOR_TRANSPANT = 'rgba(0,0,0,0)';
    function _getColor(v){return getColor(v);
    	// if(v != DEFAULT_VAL){
	    //     var color = _color_arr[0];
	    //     if(v <= -15){
	    //         color = _color_arr[1];
	    //     }else if(v <= -10){
	    //         color = _color_arr[2];
	    //     }else if(v <= -5){
	    //         color = _color_arr[3];
	    //     }else if(v <= 0){
	    //         color = _color_arr[4];
	    //     }else if(v <= 5){
	    //         color = _color_arr[5];
	    //     }else if(v <= 10){
	    //         color = _color_arr[6];
	    //     }else if(v <= 15){
	    //         color = _color_arr[7];
	    //     }else{
	    //         color = _color_arr[8];
	    //     }
	    // }else{
	    // 	color = COLOR_TRANSPANT;
	    // }
     //    return color;
    }

    function predealData (data, is_no_deal_border){
    	var data_new = [];
    	var width = data.length,
    		height = data[0].length;

    	for(var i = 0; i<width; i++){
    		var item_arr = data[i];
    		for(var j = 0; j<height; j++){
    			var item = item_arr[j];
    			if(!is_no_deal_border && (i == 0 || j == 0|| i == width - 1 || j == height - 1)){
    				item.v = DEFAULT_VAL;
    				item.c = COLOR_TRANSPANT;
    			}else{
    				item.c = _getColor(item.v);
    			}
    		}
    	}

    	return data;
    }
    
    var _smoothData = (function(){
        var parsingData, default_val;
        function _getNewVal(x, y){
            // if(x == 0 && y == 0){
            //     debugger;
            // }
            var sum = 0, num = 0;
            for(var i = x - 1; i<x+1; i++){
                for(var j = y - 1; j < y + 1; j++){
                    var v = null;
                    try{
                        v = parsingData[i][j].v;
                    }catch(e){}
                    if(v !== default_val){
                        sum += v;
                        num ++;
                    }
                }
            }
            var item = parsingData[x][y];
            var val_new = {
                x: item.x,
                y: item.y,
                v: num > 0?sum/num: default_val
            };
            console.log(x, y, item, val_new.v, (num > 0?sum/num: default_val)+'='+ sum+'/'+ num);
            return val_new;
        }
        return function(rasterData, no_val){
            parsingData = rasterData;
            default_val = no_val || DEFAULT_VAL;
            var width = parsingData.length,
                height = parsingData[0].length;

            var data_new = [];
            for(var i = 0; i<width; i++){
                var arr = [];
                for(var j = 0; j<height; j++){
                    arr.push(_getNewVal(i, j));  
                }
                data_new.push(arr);
            }
            return data_new;
        }
    })();
    
    global.smoothData = _smoothData;
    global.DEFAULT_VAL = DEFAULT_VAL;
    global.COLOR_TRANSPANT = COLOR_TRANSPANT;
    // global.color2rgba = color_normal2rgba;
    global.getColor = _getColor;
    global.predealData = predealData;
	g.global = global;
}(this);