var UPDATE_INTERVAL = 1000 * 60 * 1;

var BILLINGS_DATABASE_PATH = "$HOME/Library/Application Support/Billings/Database/billings.bid";

var MAX_HOURS_PER_DAY = 10;


	

function createWidgetController( preferencesController ) {
	var wc = { };


	var updateInterval = null;
	
	var modelManager;
	
	var chart;
	
	var updateErrorCount;
	
	var inErrorState;


	var init = function( ) {
		inErrorState = false;
		
		if ( checkForDatabaseFile() ) {
			var databaseConnection = createSQLite(BILLINGS_DATABASE_PATH);
			
			modelManager = createModelManager(databaseConnection, preferencesController);
			
			connect(modelManager, "update", onModelUpdated);
			connect(modelManager, "error",  onModelError);

			chart = createChart(getElement("chart"), MAX_HOURS_PER_DAY);

			replaceChildNodes(
				"averageSource",
				OPTION({"value": "forever"},   localizedStrings["forever"]),
				OPTION({"value": "year"},      localizedStrings["lastYear"]),
				OPTION({"value": "sixMonths"}, localizedStrings["sixMonths"]),
				OPTION({"value": "twoMonths"}, localizedStrings["twoMonths"]),
				OPTION({"value": "oneMonth"},  localizedStrings["oneMonth"])
			);
		} else {
			inErrorState = true;
			
			replaceChildNodes("errorMessage", localizedStrings["errorNoBillings"]);

			hideElement("chart");
			hideElement("dayNames");
			hideElement("loadingIndicator");
			showElement("errorMessage");
		}
		
		return wc;
	}
	
	var checkForDatabaseFile = function( ) {
		return widget.system("test -e \"" + BILLINGS_DATABASE_PATH + "\"", null).status == 0;
	}
	
	wc.start = function( ) {
		if ( ! inErrorState ) {
			if ( updateInterval == null ) {
				updateInterval = setInterval(update, UPDATE_INTERVAL);
						
				update();
			} else {
				//throw new Error("The controller has already been started");
			}
		}
	}
	
	wc.stop = function( ) {
		clearInterval(updateInterval);
		
		updateInterval = null;
	}
		
	var update = function( ) {
		showElement("loadingIndicator");
		hideElement("errorMessage");

		modelManager.update();

		updateDayNames();		
	}
	
	var onModelUpdated = function( ) {
		updateWeekChart();

		hideElement("loadingIndicator");
	}
	
	var onModelError = function( ) {
		hideElement("loadingIndicator");
		showElement("errorMessage");
	}
	
	var updateWeekChart = function( ) {
		chart.clear();

		chart.addSeries(modelManager.getPastWeekHours(), "#B30000");

		if ( preferencesController.shouldShowGoal() ) {
			chart.addSeries(alignWeek(getWeekGoals()), "rgba(255, 255, 255, 0.1)");
		}

		if ( preferencesController.shouldShowAverages() ) {
			chart.addSeries(alignWeek(modelManager.getWeekAverages()), "rgba(0, 0, 0, 0.25)");
		}
	}

	var updateDayNames = function( ) {
		var dayNames = alignWeek([
			localizedStrings["sunday"], 
			localizedStrings["monday"],
			localizedStrings["tuesday"],
			localizedStrings["wednesday"],
			localizedStrings["thursday"],
			localizedStrings["friday"],
			localizedStrings["saturday"]
		]);

		for ( var i = 0; i < 7; i++ ) {
			replaceChildNodes("day" + i, dayNames[i].substring(0, 1).toUpperCase());
		}
	}
	
	var getWeekGoals = function( ) {
		var goals = [ ];

		var gh = preferencesController.getGoalHours();
		var wg = preferencesController.hasWeekendGoal();

		goals = [
			wg ? gh : 0, 
			gh, 
			gh, 
			gh, 
			gh, 
			gh, 
			wg ? gh : 0
		];

		return goals;
	}

	var alignWeek = function( week ) {
		var g = createReverseDateGenerator();

		var out = [ ];

		for ( var i = 0; i < 7; i++ ) {
			out.push(week[g.next().getDay()]);
		}

		return out.reverse();
	}

	return init();
}