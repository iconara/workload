function createBackController( versionManager ) {
	var bc = { };
	
	
	var init = function( ) {
		connect("showGoal",      "onchange", update);
		connect("weekendGoal",   "onchange", update);
		connect("averageSource", "onchange", update);
		connect("showAverages",  "onchange", update);
		
		connect("goalHours",     "oninput",  update);
		
		connect("showGoalLabel",     "onclick", createBoxClicker("showGoal"));
		connect("showAveragesLabel", "onclick", createBoxClicker("showAverages"));
		connect("weekendGoalLabel",  "onclick", createBoxClicker("weekendGoal"));
	
		replaceChildNodes(
			"averageSource",
			OPTION({"value": "forever"},   localizedStrings["forever"]),
			OPTION({"value": "year"},      localizedStrings["lastYear"]),
			OPTION({"value": "sixMonths"}, localizedStrings["sixMonths"]),
			OPTION({"value": "twoMonths"}, localizedStrings["twoMonths"]),
			OPTION({"value": "oneMonth"},  localizedStrings["oneMonth"])
		);
		
		replaceChildNodes("infoText", localizedStrings["infoText"].replace("%version%", versionManager.getCurrentVersionString()));
		
		replaceChildNodes("infoUrl", A({href: "#"}, scrapeText("infoUrl")));
		
		connect("infoUrl", "onclick", goToHomepage);
		connect("iconara", "onclick", goToHomepage);
	
		update();
	
		return bc;
	}
	
	var update = function( ) {
		var weekendGoal        = getElement("weekendGoal");
		var averageSource      = getElement("averageSource");
		var goalHours          = getElement("goalHours");
	
		weekendGoal.disabled   = ! showGoal.checked;
		goalHours.disabled     = ! showGoal.checked;
		averageSource.disabled = ! showAverages.checked;
		
		replaceChildNodes("hoursLabel", localizedStrings["hoursLabel"].replace("%hours%", goalHours.value));
	}
	
	var createBoxClicker = function( boxName ) {
		return function( ) {
			var box = getElement(boxName);
		
			if ( ! box.disabled ) {
				box.checked = ! box.checked;
				
				signal(box, "onchange");
			}
		}
	}
	
	var goToHomepage = function( ) {
		widget.openURL("http://developer.iconara.net/");
	}
	
	return init();
}