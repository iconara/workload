var UPDATE_INTERVAL = 1000 * 60 * 1;

var VERSION_URL = "http://developer.iconara.net/products/Workload/version/";

var BILLINGS_DATABASE_PATH = "$HOME/Library/Application Support/Billings/Database/billings.bid";

var MAX_HOURS_PER_DAY = 10;

var BUG_REPORT_TO      = "theo@iconara.net";
var BUG_REPORT_SUBJECT = "Workload bug report";
var BUG_REPORT_BODY    = "" +
	"If you like you may replace this text with a message. If you find that sending any of the information below to intrude on your privacy, please remove it (but please write that you have done so, so that I know it's not an error in the error reporting).\n\n" +
	"-----------------------------------\n" +
	"Build number: %buildNumber%\n" +
	"Error message: %errorMessage%\n" +
	"Processor type: %processorType%\n" +
	"OS version: %osVersion%\n" + 
	"-----------------------------------\n" +
	"\n";


function createWidgetController( preferencesController ) {
	var wc = { };


	var updateInterval = null;
	
	var modelManager;
	var versionManager;
	
	var chart;
	
	var sheet;
	
	var backController;
	var frontController;
	
	var updateErrorCount;
	
	var inErrorState;


	var init = function( ) {
		inErrorState = false;
		
		if ( checkForDatabaseFile() ) {
			var databaseConnection = createSQLite(BILLINGS_DATABASE_PATH);
			
			modelManager = createModelManager(databaseConnection, preferencesController);
			
			connect(modelManager, "update", onModelUpdated);
			connect(modelManager, "error",  onModelError);
			
			versionManager = createVersionManager(VERSION_URL);
			
			connect(versionManager, "update", onNewVersionAvailable);
			
			backController = createBackController(versionManager);
			frontController = createFrontController(preferencesController);
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
				
				versionManager.check();
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
		frontController.setLoading(true);

		modelManager.update();
	}
	
	var onModelUpdated = function( ) {
		updateWeekChart();
		
		frontController.setLoading(false);
	}
	
	var onModelError = function( e ) {
		var errorString = "";
		
		if ( e.userData != null && e.userData.errorString != null) {
			errorString = e.userData.errorString;
		} else {
			errorString = e.message;
		}
	
		frontController.showError(errorString, sendErrorReport);
	}
	
	var sendErrorReport = function( errorString ) {
		var processorType;
		var osVersion;
		
		try {
			processorType = widget.system("system_profiler SPHardwareDataType | grep 'Processor Name'", null).outputString;
			osVersion     = widget.system("system_profiler SPSoftwareDataType | grep 'System Version'", null).outputString;
			
			processorType = trim(processorType.replace(/Processor Name:(.*)/, "$1"));
			osVersion     = trim(osVersion.replace(/System Version:(.*)/, "$1"));
		} catch ( e ) {
			processorType = "(error)";
			osVersion     = "(error)";
		}
	
		var bugReportBody =
			BUG_REPORT_BODY
			.replace("%buildNumber%", versionManager.getCurrentVersionString())
			.replace("%errorMessage%", errorString)
			.replace("%processorType%", processorType)
			.replace("%osVersion%", osVersion)
		;
		
		widget.openURL(
			"mailto:" + BUG_REPORT_TO + 
			"?subject=" + escape(BUG_REPORT_SUBJECT) + 
			"&body=" + escape(bugReportBody)
		);
	}
	
	var onNewVersionAvailable = function( url ) {		
		frontController.showNewVersion(url);
	}
	
	var updateWeekChart = function( ) {
		var dayNames = alignWeek([
			localizedStrings["sunday"], 
			localizedStrings["monday"],
			localizedStrings["tuesday"],
			localizedStrings["wednesday"],
			localizedStrings["thursday"],
			localizedStrings["friday"],
			localizedStrings["saturday"]
		]);
	
		frontController.updateChart(
			dayNames,
			modelManager.getPastWeekHours(),
			alignWeek(getWeekGoals()),
			alignWeek(modelManager.getWeekAverages())
		);
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