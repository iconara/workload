function createVersionManager( url, buildNumber ) {
	var um = { };
	
	
	var version;
	var major;
	var minor;
	var build;
	
	
	var init = function( ) {
		try {
			version = readDefault("CFBundleVersion");
			build   = readDefault("CFBundleShortVersionString").replace(/b(\d+)/, "$1");
			major   = version.replace(/^(\d+)\.\d+$/, "$1");
			minor   = version.replace(/^\d+\.(\d+)$/, "$1");
		} catch ( e ) {
		}
	
		return um;
	}
	
	var readDefault = function( name ) {
		return widget.system("defaults read $PWD/Info " + name, null).outputString.replace(/\s*(.*)\s*/, "$1");
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
	
	um.getCurrentVersion = function( ) {
		return {
			major: major,
			minor: minor,
			build: build
		};
	}
	
	um.getCurrentVersionString = function( ) {
		return major + "." + minor + "b" + build;
	}
	
	return init();
}