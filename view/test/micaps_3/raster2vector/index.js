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
    var COLOR_TRANSPANT = 'rgba(0,0,0,0)';
    function _getColor(v){
    	if(v != DEFAULT_VAL){
	        var color = _color_arr[0];
	        if(v <= -15){
	            color = _color_arr[1];
	        }else if(v <= -10){
	            color = _color_arr[2];
	        }else if(v <= -5){
	            color = _color_arr[3];
	        }else if(v <= 0){
	            color = _color_arr[4];
	        }else if(v <= 5){
	            color = _color_arr[5];
	        }else if(v <= 10){
	            color = _color_arr[6];
	        }else if(v <= 15){
	            color = _color_arr[7];
	        }else{
	            color = _color_arr[8];
	        }
	    }else{
	    	color = COLOR_TRANSPANT;
	    }
        return color;
    }

    function predealData (data){
    	var data_new = [];
    	var width = data.length,
    		height = data[0].length;

    	for(var i = 0; i<width; i++){
    		var item_arr = data[i];
    		for(var j = 0; j<height; j++){
    			var item = item_arr[j];
    			if(i == 0 || j == 0|| i == width - 1 || j == height - 1){
    				item.v = DEFAULT_VAL;
    				item.c = COLOR_TRANSPANT;
    			}else{
    				item.c = _getColor(item.v);
    			}
    		}
    	}

    	return data;
    }
    global.DEFAULT_VAL = DEFAULT_VAL;
    // global.color2rgba = color_normal2rgba;
    global.getColor = _getColor;
    global.predealData = predealData;
	g.global = global;
}(this);