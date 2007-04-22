function createPreferencesController( ) {
	var pc = { };
	
	
	var init = function( ) {
		restorePreferences();
	
		return pc;
	}

	pc.update = function( ) {
		var showAverages          = getElement("showAverages");
		var showGoal              = getElement("showGoal");
		var weekendGoal           = getElement("weekendGoal");
		var goalHours             = getElement("goalHours");
		var averageSource         = getElement("averageSource");

		widget.setPreferenceForKey(showAverages.checked,        "showAverages");
		widget.setPreferenceForKey(showGoal.checked,            "showGoal");
		widget.setPreferenceForKey(weekendGoal.checked,         "weekendGoal");
		widget.setPreferenceForKey(parseFloat(goalHours.value), "goalHours");
		widget.setPreferenceForKey(averageSource.value,         "averageSource");

		// this flags that the preferences have been set manually
		widget.setPreferenceForKey(true, "preferencesSet");
		
		signal(pc, "update");
	}

	var restorePreferences = function( ) {
		if ( widget.preferenceForKey("preferencesSet") ) {
			// if there are preferences saved restore these
		
			getElement("showAverages").checked = widget.preferenceForKey("showAverages");
			getElement("showGoal").checked     = widget.preferenceForKey("showGoal");
			getElement("weekendGoal").checked  = widget.preferenceForKey("weekendGoal");
			getElement("goalHours").value      = widget.preferenceForKey("goalHours");
			getElement("averageSource").value  = widget.preferenceForKey("averageSource");
		}
	}

	pc.getAverageSource = function( ) {
		return widget.preferenceForKey("averageSource");
	}
	
	pc.getGoalHours = function( ) {
		return widget.preferenceForKey("goalHours");
	}
	
	pc.shouldShowGoal = function( ) {
		return widget.preferenceForKey("showGoal");
	}
	
	pc.shouldShowAverages = function( ) {
		return widget.preferenceForKey("showAverages");
	}
	
	pc.hasWeekendGoal = function( ) {
		return widget.preferenceForKey("weekendGoal");
	}

	return init();
}