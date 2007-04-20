function createChart( chartNode, max ) {
	var c = { };


	var series;

	
	c.clear = function( ) {
		series = [ ];
	}
	
	c.addSeries = function( values, color ) {
		if ( color == undefined ) {
			color = "black";
		}
	
		series.push({
			v: values,
			c: color
		});
		
		redraw();
	}
	
	var redraw = function( ) {
		var context = chartNode.getContext("2d");
		
		context.clearRect(0, 0, chartNode.width, chartNode.height);
		
		for ( var i = 0; i < series.length; i++ ) {
			draw(context, series[i]);
		}
	}
	
	var draw = function( context, item ) {
		context.save();

		//context.translate(1, 0);
		context.scale(1, -1);
		context.scale(chartNode.width/7, chartNode.height/max);
		context.translate(0, -max);
	
		context.fillStyle = item.c;
	
		for ( var i = 0; i < item.v.length; i++ ) {
			context.fillRect(i, 0, 1, item.v[i]);
		}
		
		context.restore();
	}
	
	c.clear();
	
	return c;
}