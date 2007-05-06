function createFrontController( preferencesController ) {
	var fc = { };
	
	
	var chart;
	var sheet;
	
	
	var init = function( ) {
		chart = createChart(getElement("chart"), MAX_HOURS_PER_DAY);
			
		sheet = createSheet(getElement("sheet"));
	
		return fc;
	}
	
	fc.setLoading = function( isLoading ) {
		if ( isLoading ) {
			showElement("loadingIndicator");
			hideElement("errorMessage");
		} else {
			hideElement("loadingIndicator");
		}
	}

	fc.showError = function( errorString, reportCallback ) {
		var reportLink = A({href: "#"}, createDOM("em", {}, localizedStrings["reportError"]));
	
		sheet.setContents([
			P({}, localizedStrings["errorDataLoad"]),
			P({}, reportLink)
		]);
		sheet.setVisible(true);
	
		connect(reportLink, "onclick", function( ) {
			reportCallback(errorString);
			
			sheet.setVisible(false);
		});
	
		hideElement("loadingIndicator");
	}
	
	fc.showNewVersion = function( downloadUrl ) {
		var downloadLink = A({href: "#"}, localizedStrings["newVersionAvailable"]);
		
		sheet.setContents(downloadLink);
		sheet.setVisible(true);
		
		connect(downloadLink, "onclick", function( ) {
			sheet.setVisible(false);
			
			widget.openURL(downloadUrl);
			
			return false;
		});
	}
	
	fc.updateChart = function( dayNames, weekHours, weekGoals, weekAverages ) {
		chart.clear();

		chart.addSeries(weekHours, "#B30000");

		if ( preferencesController.shouldShowGoal() ) {
			chart.addSeries(weekGoals, "rgba(255, 255, 255, 0.1)");
		}

		if ( preferencesController.shouldShowAverages() ) {
			chart.addSeries(weekAverages, "rgba(0, 0, 0, 0.25)");
		}
			
		// update day names
		for ( var i = 0; i < 7; i++ ) {
			replaceChildNodes("day" + i, dayNames[i].substring(0, 1).toUpperCase());
		}
	}

	return init();
}