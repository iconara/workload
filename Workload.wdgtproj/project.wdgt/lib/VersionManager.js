function createVersionManager( url, buildNumber ) {
	var um = { };
	
	var init = function( ) {
		return um;
	}
	
	um.check = function( ) {
		var d = doSimpleXMLHttpRequest(url + buildNumber);
		
		d.addCallback(function( request ) {
			var updateNodes = request.responseXML.getElementsByTagName("update");
		
			if ( updateNodes.length == 1 ) {
				var url = getNodeAttribute(updateNodes[0], "url");
				
				signal(um, "update", url);
			}
		});
	}
	
	return init();
}