$(function(){
	var CONSTANT,
		COLOR_PRECIPITATION,
		COLOR_LINE;
	var $svg_defs;
	var map;

	var callback_data = function(data){
		console.log(data);
		// 百度地图API功能
		map = new BMap.Map("allmap");
		// map.addEventListener('addtilelayer',function(){
		// 	console.log('addtilelayer',$('svg').length);
		// });
		// map.addEventListener('addoverlay',function(){
		// 	// console.log('addoverlay',$('svg').length);
		// });
		map.centerAndZoom(new BMap.Point(116.404, 39.915), 5);
		map.enableScrollWheelZoom();
		var areas = data.areas;
		$.each(areas.items,function(i_outer,v_outer){
			(function(i,v){
				// setTimeout(function(){
					var point_arr = [];
					$.each(v.items,function(v_i,v_v){

						var point = new BMap.Point(v_v.x,v_v.y);
						point_arr.push(point);
						// if(v.type != 'add'){
						// 	setTimeout(function(){
						// 		var marker = new BMap.Marker(point);
						// 		marker.addEventListener("click",function(){
						// 			var p = marker.getPosition();  //获取marker的位置
						// 			alert(v_i+' flag = '+v_v.flag+" marker的位置是" + p.lng + "," + p.lat);    
						// 		});
						// 		map.addOverlay(marker);
						// 	},v_i*200);
						// }
					});
					var symbols = v.symbols;
					// var Color = ['red','blue','green','#123','#f26','#ccc','#333'];
					// var radom_color = Color[Math.floor(Math.random()*Color.length)];
					var color = getPrecipitationColor(v.code,symbols?symbols.text:0);
					var polygon = new BMap.Polygon(point_arr, {strokeColor: color, fillColor: color,fillOpacity: 0.8, strokeWeight: 1, strokeOpacity:1});
					map.addOverlay(polygon);   //增加面
					setTimeout(_add_svg_pattern,10);
					// if(symbols){
					// 	var text = symbols.text;
					// 	if(text > 0){
					// 		$.each(symbols.items,function(i_text,v_text){
					// 			var label = new BMap.Label(text, {
					// 				position: new BMap.Point(v_text.x,v_text.y),
					// 				offset: new BMap.Size(-17, -10)
					// 			});  // 创建文本标注对象
					// 			label.setStyle({
					// 				 color : "#000",
					// 				 fontSize : "16px",
					// 				 height : "20px",
					// 				 lineHeight : "20px",
					// 				 fontFamily:"微软雅黑",
					// 				 width: '34px',
					// 				 textAlign: 'center',
					// 				 border: 'none',
					// 				 background: 'none',
					// 				 fontWeight: 'bold',
					// 				 textShadow: '0 0 5px white'
					// 			 });
					// 			map.addOverlay(label);
					// 		});
					// 	}
					// }
				// },i*300);
			})(i_outer,v_outer);
		});
		var lines = data.lines;		
		$.each(lines.items,function(i,v){
			var point_arr = [];
			var points = v.point.items;
			if(points.length >= 2){
				$.each(points,function(p_i,p_v){
					var point = new BMap.Point(p_v.x, p_v.y);
					point_arr.push(point);
					// if(i == 0)
					// setTimeout(function(){
					// 	var marker = new BMap.Marker(point);
					// 	marker.addEventListener("click",function(){
					// 		var p = marker.getPosition();  //获取marker的位置
					// 		alert(" marker的位置是" + p.lng + "," + p.lat);    
					// 	});
					// 	map.addOverlay(marker);
					// },p_i*200);
				});
				var polyline = new BMap.Polyline(point_arr, {strokeColor:"#1010FF", strokeWeight: v.weight||1, strokeOpacity:1});
				map.addOverlay(polyline);   //增加折线
			}
			var flags = v.flags;
			if(flags.len > 0){
				var text = flags.text;
				$.each(flags.items,function(i,v){
					var label = new BMap.Label(text, {
						position: new BMap.Point(v.x,v.y),
						offset: new BMap.Size(-17, -10)
					});  // 创建文本标注对象
					label.setStyle({
						 color : "#1010FF",
						 fontSize : "12px",
						 height : "20px",
						 lineHeight : "20px",
						 fontFamily:"微软雅黑",
						 width: '34px',
						 textAlign: 'center',
						 border: 'none',
						 background: 'none'
					 });
					map.addOverlay(label);
				});
			}
		});

		var symbols = data.symbols;
		$.each(symbols.items,function(i,v){
			var type = v.type;
			if(type == 3 || type == 4){

				var marker = new BMap.Marker(new BMap.Point(v.x,v.y));
				marker.addEventListener("click",function(){
					var p = marker.getPosition();  //获取marker的位置
					alert(v.flag+" "+" marker的位置是" + p.lng + "," + p.lat);    
				});
				map.addOverlay(marker);
				return ;
			}
			var text = '',
				color = '#1010FF';
			var style = {
				 color : color,
				 fontSize : "30px",
				 height : "20px",
				 lineHeight : "20px",
				 fontFamily:"微软雅黑",
				 width: '34px',
				 textAlign: 'center',
				 border: 'none',
				 background: 'none'
			};
			if('60' == type){
				text = 'H';
				color = 'red';
			}else if('61' == type){
				text = 'L';
			}else if('37' == type){
				text = '台';
				color = 'green';
			}else if(23 == type || 24 == type || 26 == type || 48 == type){// 处理雨雪的极值
				text = v.text;
				if(text == 0){
					return;
				}
				style.fontSize = '20px';
				style.fontShadow = '0 0 3px white';
				color = 'black';
			}
			style.color = color;
			var label = new BMap.Label(text, {
				position: new BMap.Point(v.x,v.y),
				offset: new BMap.Size(-17, -10)
			});  // 创建文本标注对象
			label.setStyle(style);
			map.addOverlay(label);
		});

		var line_symbols = data.line_symbols;
		$.each(line_symbols.items,function(i,v){
			var point_arr = [];
			draw_line_symbols_flag(v.code,v.items);
			$.each(v.items,function(v_i,v_v){
				var point = new BMap.Point(v_v.x, v_v.y);
				point_arr.push(point);
				// setTimeout(function(){
				// 	var marker = new BMap.Marker(point);
				// 	marker.addEventListener("click",function(){
				// 		var p = marker.getPosition();  //获取marker的位置
				// 		alert(" marker的位置是" + p.lng + "," + p.lat);    
				// 	});
				// 	map.addOverlay(marker);
				// },v_i*200);
			});
			var polyline = new BMap.Polyline(point_arr, {strokeColor: getLineColor(v.code), strokeWeight: v.weight || 1, strokeOpacity:0.5});
			map.addOverlay(polyline);   //增加折线
		});
	};

	function Icon_Layer(point,radiu,cName){
		BMap.Overlay.apply(this,arguments);
		this.point = point;
		this.radiu = radiu;
		this.cName = cName;
		var div = document.createElement('div');
		this._div = div;
		div.className = this.cName;
		div.innerHTML = '<div></div>';

		$(div).find('div').css({
			transform: 'rotate('+this.radiu+'deg)'
		});
	}
	Icon_Layer.constructor = Icon_Layer;
	Icon_Layer.prototype = new BMap.Overlay();
	Icon_Layer.prototype.initialize = function(map){
		this._map = map;
		map.getPanes().labelPane.appendChild(this._div);
		return this._div;
	}
	Icon_Layer.prototype.getDiv = function(){
		return this._div;
	}
	Icon_Layer.prototype.draw = function(){consol
		var map = this._map;
		var pixel = map.pointToOverlayPixel(this.point);
		this._div.style.left = pixel.x + "px";
		this._div.style.top  = pixel.y + "px";
	}

	function draw_line_symbols_flag(code,items){
		if(code == 2 || code == 3){
			var points = [];
			var i = 5;
			while(i < items.length){
				var one = items.slice(i,i+1);
				i+=10;
				var two = items.slice(i,i+1);
				i+= 30;
				if(one.length == 1 && two.length == 1){
					points.push([one,two]);
				}
			}
			$.each(points,function(i,v){
				var one = v[0][0],
					two = v[1][0];
				var radiu = Math.atan((two.y - one.y)/(two.x - one.x)) / Math.PI * 180;
				map.addOverlay(new Icon_Layer(new BMap.Point((two.x + one.x)/2,(two.y + one.y)/2),-radiu,code == 2?'cool':'warm'));
			});
		}else if(code == 38){
			var SPACE_NUM = 6;
			var color = getLineColor(38);
			$.each(items.slice(0,items.length-SPACE_NUM),function(i,v){
				if(i > 0 && i % SPACE_NUM == 0){
					var point_before = items[i-1],
						point_current = v;
					var radiu = Math.atan((point_current.y - point_before.y)/(point_current.x - point_before.x)) / Math.PI * 180 ;
					if(point_current.x < point_before.x){
						radiu += 180;
					}
					var icon_Layer = new Icon_Layer(new BMap.Point((point_current.x + point_before.x)/2,(point_current.y + point_before.y)/2),-radiu,'frost_line');
					$(icon_Layer.getDiv()).find('div').css({
						'background-color': color
					});
					map.addOverlay(icon_Layer);
					
				}
			});
		}
	}
	var getPrecipitationColor = (function(){
		var index = 0;
		return function (code,val){
			// code 默认处理成降雨（如台湾地区就得到具体code值）
			var colors = COLOR_PRECIPITATION[code||CONSTANT.AREA.RAIN];
			if(colors){
				for(var i = 0,j=colors.length;i<j;i++){
					var color = colors[i];
					var condition = color[0];
					if(val >= condition[0] && val < condition[1]){
						var c = color[1];
						if(code == 24){
							c = 'url(#rain_snow_'+(index++)+')';
						}
						return c;
					}
				}
			}
		}
	})();
	
	function getLineColor(code){
		console.log(COLOR_LINE,code);
		return COLOR_LINE[code]
	}
	var data_url = '../../../data/micaps/14/rr111308.024.json';
	var data_url = '../../../data/micaps/14/rr112108.048.json';
	var data_url = '../../../data/micaps/14/14110508.000.json';
	var ajax_data = $.getJSON(data_url),
		ajax_constant = $.getJSON('../../../config/constant.json'),
		ajax_color_precipitation = $.getJSON('../../../config/precipitation.json'),
		ajax_color_line = $.getJSON('../../../config/line.json');


	var _flag_is_added_svg_pattern = false;
	function _add_svg_pattern(){

	}
	$.when(ajax_data,ajax_constant,ajax_color_precipitation,ajax_color_line).done(function(a,b,c,d){
		CONSTANT = b[0];
		COLOR_PRECIPITATION = c[0];
		for(var i in COLOR_PRECIPITATION){
			var val = COLOR_PRECIPITATION[i];
			$.each(val,function(i,v){
				var condition = v[0];
				if(isNaN(condition[0])){
					v[0] = Number.MIN_VALUE;
				}
				if(isNaN(condition[1])){
					v[1] = Number.MAX_VALUE;
				}
			});
		}
		COLOR_LINE = d[0];
		var rain_snow_color = COLOR_PRECIPITATION[24];
		if(rain_snow_color){
			_add_svg_pattern = function(){
				if(_flag_is_added_svg_pattern){
					return;
				}
				mySvg = $('#allmap svg').get(0);
				if(!mySvg){
					return;
				}
				_flag_is_added_svg_pattern = true;

				// https://github.com/tonny-zhang/node-micaps/issues/3
				var css_text = '';
				var svg_pattern = '';
				var svgNS = mySvg.namespaceURI;

				var defs = document.createElementNS(svgNS,'defs');
				mySvg.appendChild(defs);
				$.each(rain_snow_color,function(i,v){
					var name = 'rain_snow_'+i;	
					var pattern = document.createElementNS(svgNS, 'pattern');
					pattern.setAttribute('id', name);
				    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
				    pattern.setAttribute('width', 1000);
				    pattern.setAttribute('height', 4);
				    pattern.setAttribute('x', 12);
				    pattern.setAttribute('y', 12);
				    pattern.setAttribute('patternTransform', 'rotate(-45)');

				    var rect = document.createElementNS(svgNS, 'rect');
				    rect.setAttribute('x', 0);
				    rect.setAttribute('y', 0);
				    rect.setAttribute('width', 9999);
				    rect.setAttribute('height', 1);
				    rect.setAttribute('style', 'stroke: '+v[1]);
				    pattern.appendChild(rect);

				    defs.appendChild(pattern);
				});
			}
		}
		callback_data.apply(null,a);
	});
});