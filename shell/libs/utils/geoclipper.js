! function() {
	var SCALE = 10000;
	var ClipperLib = require('./clipper');

	var TYPE_CLIP = ClipperLib.ClipType.ctIntersection,
		TYPE_FILL = ClipperLib.PolyFillType.pftNonZero,
		TYPE_POLY_CLIP = ClipperLib.PolyType.ptClip,
		TYPE_POLY_SUBJECT = ClipperLib.PolyType.ptSubject;

	function numFormat(num, digit) {
		return num.toFixed(digit || 4);
	}

	function load_default(src, callback) {
		var data = require(src);
		callback(data);
	}

	function _getCoordinates(coordinates) {
		var arr = [];
		for (var i = 0, j = coordinates.length; i < j; i++) {
			var v = coordinates[i];
			arr.push({
				X: numFormat(v[0]) * SCALE,
				Y: numFormat(v[1]) * SCALE
			});
		}
		return arr;
	}

	function getGeoItems(geoData) {
		var items = [];
		var features = geoData.features;
		for (var i = 0, j = features.length; i < j; i++) {
			var v = features[i];
			var geometry = v.geometry;
			var coordinates = geometry.coordinates[0];
			if (geometry.type == 'Polygon') {
				items.push(_getCoordinates(coordinates));
			} else {
				for (var i_c = 0, j_c = coordinates.length; i_c < j_c; i_c++) {
					items.push(_getCoordinates(coordinates[i_c]));
				}
			}
		}
		return items;
	}
	var GeoClipper = function(geo_src, loader, callback) {
		var _this = this;
		var cpr = _this.cpr = new ClipperLib.Clipper();
		loader || (loader = load_default);
		if(geo_src){
			if (({}).toString.call(geo_src) !== "[object Array]") {
				geo_src = [geo_src];
			}
		}else{
			geo_src = ['../../../data/china_b.json'];
		}
		var len = geo_src.length;
		var loadedData = [];

		function cb(data) {
			var items = getGeoItems(data);
			loadedData.push(items);
			var loadedNum = loadedData.length;
			if (loadedNum == len) {
				_this.clip_items = loadedData;
				callback && callback.call(_this);
			}
		}

		for (var i = 0; i < len; i++) {
			loader(geo_src[i], cb);
		}
	}
	var GeoClipperProp = GeoClipper.prototype;

	GeoClipper.prototype.doClip = function(subj_path, is_no_polygon) {
		var _this = this;
		var cpr = _this.cpr;
		cpr.Clear();
		var clip_items = _this.clip_items;
		for(var i = 0, j = clip_items.length; i<j; i++){
			cpr.AddPaths(clip_items[i], TYPE_POLY_CLIP, true);
		}

		var items_new = [];        
		for(var i = 0, j = subj_path.length; i<j; i++){
			var item = subj_path[i];
			items_new.push({
				X: numFormat(item.x) * SCALE,
				Y: numFormat(item.y) * SCALE
			});
		}
		cpr.AddPaths([items_new], TYPE_POLY_SUBJECT, !is_no_polygon);

		var solution_paths = new ClipperLib.Paths();
		cpr.Execute(TYPE_CLIP, solution_paths, TYPE_FILL, TYPE_FILL);
		return {
			paths: solution_paths,
			scale: SCALE
		};
	}

	"undefined" !== typeof module && module.exports ? (module.exports = GeoClipper) : (window.GeoClipper = GeoClipper);
}();