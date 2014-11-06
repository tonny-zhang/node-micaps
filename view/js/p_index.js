$(function(){
	// 百度地图API功能
	var map = new BMap.Map("allmap");
	map.centerAndZoom(new BMap.Point(116.404, 39.915), 5);
	map.enableScrollWheelZoom();

	$.getJSON('../data/micaps/14/14110514.000.json',function(data){
		var lines = data.lines;
		
		$.each(lines.items,function(i,v){
			var point_arr = [];
			var points = v.point.items;
			if(points.length > 2){
				$.each(points,function(p_i,p_v){
					point_arr.push(new BMap.Point(p_v.x, p_v.y));
				});
				var polyline = new BMap.Polyline(point_arr, {strokeColor:"#1010FF", strokeWeight: v.weight||2, strokeOpacity:1});
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
			var text = '',
				color = '#1010FF';;
			if('60' == type){
				text = 'H';
				color = 'red';
			}else if('61' == type){
				text = 'L';
			}else if('37' == type){
				text = '台';
				color = 'green';
			}
			var label = new BMap.Label(text, {
				position: new BMap.Point(v.x,v.y),
				offset: new BMap.Size(-17, -10)
			});  // 创建文本标注对象
			label.setStyle({
				 color : color,
				 fontSize : "30px",
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

		var line_symbols = data.line_symbols;
		$.each(line_symbols.items,function(i,v){
			var point_arr = [];
			draw_line_symbols_flag(v.code,v.items);
			$.each(v.items,function(v_i,v_v){
				point_arr.push(new BMap.Point(v_v.x, v_v.y));
			});
			var polyline = new BMap.Polyline(point_arr, {strokeColor:"blue", strokeWeight: 4, strokeOpacity:1});
			map.addOverlay(polyline);   //增加折线
		});
	});

	function Icon_Layer(point,radiu,cName){
		this.point = point;
		this.radiu = radiu;
		this.cName = cName;
	}

	Icon_Layer.prototype = new BMap.Overlay();
	Icon_Layer.prototype.initialize = function(map){
		this._map = map;
		var div = document.createElement('div');
		this._div = div;
		div.className = this.cName;
		div.innerHTML = '<div></div>';

		map.getPanes().labelPane.appendChild(div);
		$(div).find('div').css({
			transform: 'rotate('+this.radiu+'deg)'
		});
		return div;
	}
	Icon_Layer.prototype.draw = function(){
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
				console.log(radiu);
				map.addOverlay(new Icon_Layer(new BMap.Point((two.x + one.x)/2,(two.y + one.y)/2),-radiu,code == 2?'cool':'warm'));
			});
		}
	}
});