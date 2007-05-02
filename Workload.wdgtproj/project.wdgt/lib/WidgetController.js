var BUILD_NUMBER = 6;

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
			
			versionManager = createVersionManager(VERSION_URL, BUILD_NUMBER);
			
			connect(versionManager, "update", onNewVersionAvailable);
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
		showElement("loadingIndicator");
		hideElement("errorMessage");

		modelManager.update();

		updateDayNames();		
	}
	
	var onModelUpdated = function( ) {
		updateWeekChart();
	}
	
	var onModelError = function( e ) {
		var errorString = "";
		
		if ( e.userData != null && e.userData.errorString != null) {
			errorString = e.userData.errorString;
		} else {
			errorString = e.message;
		}
	
		var reportLink = A({href: "#"}, createDOM("em", {}, localizedStrings["reportError"]));
	
		replaceChildNodes(
			"errorMessage", 
			P({}, localizedStrings["errorDataLoad"]),
			P({}, reportLink)
		);
		
		connect(reportLink, "onclick", partial(sendErrorReport, errorString));
	
		hideElement("loadingIndicator");
		showElement("errorMessage");
	}
	
	var sendErrorReport = function( errorString ) {
		var processorType;
		var osVersion;
		
		try {
			processorType = widget.system("system_profiler SPHardwareDataType | grep 'Processor Name'", null).outputString.replace(/Processor Name:\s*(.*)\s*$/, "$1");
			osVersion = widget.system("system_profiler SPSoftwareDataType | grep 'System Version'", null).outputString.replace(/System Version:\s*(.*)\s*$/, "$1");
		} catch ( e ) {
			processorType = "(error)";
			osVersion     = "(error)";
		}
	
		var bugReportBody =
			BUG_REPORT_BODY
			.replace("%buildNumber%", BUILD_NUMBER)
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
		url;
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