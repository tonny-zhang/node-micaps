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
    function getColorByCondition(val, range, _is_get_isoline_value){
        for(var i = 0,j=range.length;i<j;i++){
            var case_range = range[i];
            if(case_range.is_checked){
                var val_range = case_range.val;
                if(val >= val_range[0] && val < val_range[1]){
                    if(_is_get_isoline_value){
                        return [case_range.color, (val_range[0] + val_range[1])/2];
                    }
                    return case_range.color;
                }
            }
        }
        if(_is_get_isoline_value){
            return [COLOR_TRANSPANT];
        }
        return COLOR_TRANSPANT;
    }
    function getColor(val, code, _is_get_isoline_value){
        if(blendent > 1){
            for(var i = 0;i<len_blendent;i++){
                var v = blendent[i];
                if(code == v.val.v){
                    return getColorByCondition(val, v.colors, _is_get_isoline_value);
                }
            }
        }
        return getColorByCondition(val, blendent[0].colors, _is_get_isoline_value);
    }
    var COLOR_TRANSPANT = 'rgba(0,0,0,0)';
    function _getColor(v, _is_get_isoline_value){return getColor(v, null, _is_get_isoline_value);
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

    function predealData (data, _is_get_isoline_value){
    	var data_new = [];
    	var width = data.length,
    		height = data[0].length;
// var c = {};
        var isoline = [];
    	for(var i = 0; i<width; i++){
    		var item_arr = data[i];
    		for(var j = 0; j<height; j++){
    			var item = item_arr[j];
    			// if(i == 0 || j == 0|| i == width - 1 || j == height - 1){
    			// 	item.v = DEFAULT_VAL;
    			// 	item.c = COLOR_TRANSPANT;
    			// }else{
                    var result = _getColor(item.v, true);
                    var i_v = result[1];
    				item.c = result[0];
                    // c[result[0]] = 1;
                    item.i_v = i_v;
                    if(isoline.indexOf(i_v) == -1){
                        isoline.push(i_v);
                    }
    			// }
    		}
    	}
        // console.log(c);
        if(_is_get_isoline_value){
            return [data, isoline];
        }
    	return data;
    }
    global.DEFAULT_VAL = DEFAULT_VAL;
    global.COLOR_TRANSPANT = COLOR_TRANSPANT;
    // global.color2rgba = color_normal2rgba;
    global.getColor = _getColor;
    global.predealData = predealData;
	g.global = global;
}(this);