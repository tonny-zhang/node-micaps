$(function(){
	// 百度地图API功能
	var map = new BMap.Map("allmap");
	// map.addEventListener('addtilelayer',function(){
	// 	console.log('addtilelayer',$('svg').length);
	// });
	// map.addEventListener('addoverlay',function(){
	// 	// console.log('addoverlay',$('svg').length);
	// });
	map.centerAndZoom(new BMap.Point(116.404, 39.915), 5);
	map.enableScrollWheelZoom();
	var isInitedDefs = false;

	$.getJSON('../data/micaps/14/rr112108.048.json',function(data){
		console.log(data);
		var areas = data.areas;
		$.each(areas.items,function(i,v){
			var point_arr = [];
			
			$.each(v.items,function(v_i,v_v){
				var point = new BMap.Point(v_v.x,v_v.y);
				point_arr.push(point);
				if(v.type == 1){
					// setTimeout(function(){
					// 	var marker = new BMap.Marker(point);
					// 	marker.addEventListener("click",function(){
					// 		var p = marker.getPosition();  //获取marker的位置
					// 		alert(v_i+' flag = '+v_v.flag+" marker的位置是" + p.lng + "," + p.lat);    
					// 	});
					// 	map.addOverlay(marker);
					// },v_i*200);
				}
			});
			var polygon = new BMap.Polygon(point_arr, {strokeColor:"", fillColor: "url(#myClass)"||v.color || (v.precipitation == 1?'rgba(0,0,255,0.5)':'red'),strokeWeight: 1, strokeOpacity:1});
			map.addOverlay(polygon);   //增加面
			var symbols = v.symbols;
			if(symbols){
				var text = symbols.text;
				if(text > 0){
					$.each(symbols.items,function(i_text,v_text){
						var label = new BMap.Label(text, {
							position: new BMap.Point(v_text.x,v_text.y),
							offset: new BMap.Size(-17, -10)
						});  // 创建文本标注对象
						label.setStyle({
							 color : "#000",
							 fontSize : "16px",
							 height : "20px",
							 lineHeight : "20px",
							 fontFamily:"微软雅黑",
							 width: '34px',
							 textAlign: 'center',
							 border: 'none',
							 background: 'none',
							 fontWeight: 'bold',
							 textShadow: '0 0 5px white'
						 });
						map.addOverlay(label);
					});
				}
			}
		});
		var lines = data.lines;		
		$.each(lines.items,function(i,v){
			var point_arr = [];
			var points = v.point.items;
			if(points.length >= 2){
				$.each(points,function(p_i,p_v){
					var point = new BMap.Point(p_v.x, p_v.y);
					point_arr.push(point);
					
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
					alert(" marker的位置是" + p.lng + "," + p.lat);    
				});
				map.addOverlay(marker);
				return ;
			}
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
			}else{
				text = type;
				color = 'blue';
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
		// line_symbols.items = [{
		// 	items: [ { x: 102.077, y: 30.455, z: 1 },
  //    { x: 102.081, y: 30.351, z: 0 },
  //    { x: 102.084, y: 30.248, z: 0 },
  //    { x: 102.084, y: 30.146, z: 0 },
  //    { x: 102.079, y: 30.044, z: 0 },
  //    { x: 102.067, y: 29.944, z: 0 },
  //    { x: 102.047, y: 29.845, z: 0 },
  //    { x: 102.018, y: 29.748, z: 0 },
  //    { x: 102.014, y: 29.736, z: 0 },
  //    { x: 102.009, y: 29.724, z: 0 },
  //    { x: 102.004, y: 29.712, z: 0 },
  //    { x: 102, y: 29.7, z: 0 },
  //    { x: 101.995, y: 29.689, z: 0 },
  //    { x: 101.99, y: 29.677, z: 0 },
  //    { x: 101.985, y: 29.665, z: 0 },
  //    { x: 101.942, y: 29.583, z: 0 },
  //    { x: 101.891, y: 29.505, z: 0 },
  //    { x: 101.832, y: 29.431, z: 0 },
  //    { x: 101.823, y: 29.421, z: 0 },
  //    { x: 101.814, y: 29.411, z: 0 },
  //    { x: 101.805, y: 29.401, z: 0 },
  //    { x: 101.796, y: 29.391, z: 0 },
  //    { x: 101.786, y: 29.382, z: 0 },
  //    { x: 101.777, y: 29.372, z: 0 },
  //    { x: 101.767, y: 29.363, z: 0 },
  //    { x: 101.714, y: 29.319, z: 0 },
  //    { x: 101.655, y: 29.281, z: 0 },
  //    { x: 101.591, y: 29.247, z: 0 },
  //    { x: 101.525, y: 29.217, z: 0 },
  //    { x: 101.455, y: 29.191, z: 0 },
  //    { x: 101.383, y: 29.167, z: 0 },
  //    { x: 101.311, y: 29.145, z: 0 },
  //    { x: 101.179, y: 29.109, z: 0 },
  //    { x: 101.048, y: 29.076, z: 0 },
  //    { x: 100.915, y: 29.049, z: 0 },
  //    { x: 100.783, y: 29.029, z: 0 },
  //    { x: 100.651, y: 29.016, z: 0 },
  //    { x: 100.52, y: 29.011, z: 0 },
  //    { x: 100.389, y: 29.015, z: 0 },
  //    { x: 100.249, y: 29.031, z: 0 },
  //    { x: 100.11, y: 29.055, z: 0 },
  //    { x: 99.97, y: 29.084, z: 0 },
  //    { x: 99.831, y: 29.114, z: 0 },
  //    { x: 99.691, y: 29.142, z: 0 },
  //    { x: 99.55, y: 29.165, z: 0 },
  //    { x: 99.408, y: 29.179, z: 0 },
  //    { x: 99.164, y: 29.177, z: 0 },
  //    { x: 98.92, y: 29.15, z: 0 },
  //    { x: 98.675, y: 29.108, z: 0 },
  //    { x: 98.432, y: 29.064, z: 0 },
  //    { x: 98.191, y: 29.027, z: 0 },
  //    { x: 97.956, y: 29.008, z: 0 },
  //    { x: 97.725, y: 29.018, z: 0 },
  //    { x: 97.572, y: 29.046, z: 0 },
  //    { x: 97.422, y: 29.09, z: 0 },
  //    { x: 97.274, y: 29.146, z: 0 },
  //    { x: 97.127, y: 29.213, z: 0 },
  //    { x: 96.981, y: 29.288, z: 0 },
  //    { x: 96.835, y: 29.368, z: 0 },
  //    { x: 96.69, y: 29.45, z: 0 } ]
		// }];
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
			var polyline = new BMap.Polyline(point_arr, {strokeColor:v.color||"red", strokeWeight: 1, strokeOpacity:0.5});
			map.addOverlay(polyline);   //增加折线
		});

		// setTimeout(function(){

		// 	if(!isInitedDefs){
		// 		console.log($('defs'),$('svg'));
		// 		$('defs').prependTo($('svg'));
		// 		isInitedDefs = true;
		// 	}
		// },1000);
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
				map.addOverlay(new Icon_Layer(new BMap.Point((two.x + one.x)/2,(two.y + one.y)/2),-radiu,code == 2?'cool':'warm'));
			});
		}
	}
});