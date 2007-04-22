var UPDATE_INTERVAL = 1000 * 60 * 1;

var BILLINGS_DATABASE_PATH = "$HOME/Library/Application Support/Billings/Database/billings.bid";

var COCOA_REFERENCE_DATE = "978303600.000"; // Cocoa NSDate reference date: Jan 1, 2001

var MAX_HOURS_PER_DAY = 10;

var RETRIES_ON_ERROR = 3;

var DURATION_BY_DATE_SQL = "" +
	"SELECT SUM(endDateTime - startDateTime) AS duration, date(startDateTime + %referenceDate%, 'unixepoch') AS startDate " +
	"FROM TimeEntry " +
	"WHERE " + 
	"	strftime('%s', endDateTime + %referenceDate%) < strftime('%s', 'now') " +
	"	AND foreignAppUser IS NULL " +
	"GROUP BY startDate " + 
	"ORDER BY startDate " +
	"";
	

function createController( ) {
	var c = { };


	var updateInterval = null;
	
	var databaseConnection;
	
	var chartController;
	
	var updateErrorCount;
	
	var inErrorState;


	c.init = function( ) {
		inErrorState = false;
		
		if ( checkForDatabaseFile() ) {
			databaseConnection = createSQLite(BILLINGS_DATABASE_PATH);

			chartController = createChart(getElement("chart"), MAX_HOURS_PER_DAY);

			updateErrorCount = 0;

			replaceChildNodes(
				"averageSource",
				OPTION({"value": "forever"},   localizedStrings["forever"]),
				OPTION({"value": "year"},      localizedStrings["lastYear"]),
				OPTION({"value": "sixMonths"}, localizedStrings["sixMonths"]),
				OPTION({"value": "twoMonths"}, localizedStrings["twoMonths"]),
				OPTION({"value": "oneMonth"},  localizedStrings["oneMonth"])
			);

			setPreferences();

			onPreferencesChanged();
		} else {
			inErrorState = true;
			
			replaceChildNodes("errorMessage", localizedStrings["errorNoBillings"]);

			hideElement("chart");
			hideElement("dayNames");
			hideElement("loadingIndicator");
			showElement("errorMessage");
		}
		
		return c;
	}
	
	var checkForDatabaseFile = function( ) {
		return widget.system("test -e \"" + BILLINGS_DATABASE_PATH + "\"", null).status == 0;
	}
	
	c.start = function( ) {
		if ( updateInterval == null ) {
			updateInterval = setInterval(update, UPDATE_INTERVAL);
			
			update();
		} else {
			//throw new Error("The controller has already been started");
		}
	}
	
	c.stop = function( ) {
		clearInterval(updateInterval);
		
		updateInterval = null;
	}
	
	var update = function( ) {
		showElement("loadingIndicator");
		hideElement("errorMessage");

		getData();

		updateDayNames();		
	}
	
	var getData = function( ) {
		var d = databaseConnection.query(DURATION_BY_DATE_SQL.replace(new RegExp("%referenceDate%", "g"), COCOA_REFERENCE_DATE));

		d.addErrback(onDataError);
		d.addCallback(onData);
	}
	
	var onDataError = function( e ) {
		if ( updateErrorCount < RETRIES_ON_ERROR ) {
			update();
		} else {
			hideElement("loadingIndicator");
			showElement("errorMessage");
		}
	}
	
	var onData = function( result ) {
		updateErrorCount = 0;

		dates = { };

		var firstDate = isoDate(result[0].startDate);
		var lastDate  = isoDate(result[result.length - 1].startDate);

		forEach(result, function( r ) {
			dates[r.startDate] = {
				    date: isoDate(r.startDate),
				duration: parseFloat(r.duration)
			};
		});

		dates = fillInDates(dates, firstDate, lastDate);

		updateWeekChart();

		hideElement("loadingIndicator");
	}
	
	var onPreferencesChanged = function( ) {
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

		weekendGoal.disabled      = ! showGoal.checked;
		goalHours.disabled        = ! showGoal.checked;
		averageSource.disabled    = ! showAverages.checked;

		widget.setPreferenceForKey(true, "preferencesSet");
	}

	var setPreferences = function( ) {
		if ( widget.preferenceForKey("preferencesSet") ) {
			getElement("showAverages").checked = widget.preferenceForKey("showAverages");
			getElement("showGoal").checked     = widget.preferenceForKey("showGoal");
			getElement("weekendGoal").checked  = widget.preferenceForKey("weekendGoal");
			getElement("goalHours").value      = widget.preferenceForKey("goalHours");
			getElement("averageSource").value  = widget.preferenceForKey("averageSource");
		}
	}
	
	var fillInDates = function( dates, firstDate, lastDate ) {
		var currentDate = firstDate;

		while ( currentDate.getTime() < lastDate.getTime() ) {
			var dateString = toISODate(currentDate);

			if ( dates[dateString] == null ) {
				dates[dateString] = {date: currentDate, duration: 0};
			}

			// move to next day
			currentDate = new Date(currentDate.getTime() + (1000 * 60 * 60 * 24));
		}

		return dates;
	}

	var updateWeekChart = function( ) {
		chartController.clear();

		chartController.addSeries(getPastWeekHours(), "#B30000");

		if ( widget.preferenceForKey("showGoal") ) {
			chartController.addSeries(getPastWeekGoals(), "rgba(255, 255, 255, 0.1)");
		}

		if ( widget.preferenceForKey("showAverages") ) {
			chartController.addSeries(getPastWeekAverages(), "rgba(0, 0, 0, 0.25)");
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

	var getPastWeekHours = function( ) {
		//new Date(new Date().getTime() - (1000*60*60*24*7))

		var g = createReverseDateGenerator();

		var days = [ ];

		for ( var i = 0; i < 7; i++ ) {
			var dateStr = toISODate(g.next());

			if ( dates[dateStr] != null ) {
				days.push(dates[dateStr].duration/(60 * 60));
			} else {
				days.push(0);
			}
		}

		return days.reverse();
	}

	var getPastWeekAverages = function( ) {
		var durationAverages = [0, 0, 0, 0, 0, 0, 0];
		var durationSums     = [0, 0, 0, 0, 0, 0, 0];
		var days             = [0, 0, 0, 0, 0, 0, 0];

		for ( var key in dates ) {
			var date = dates[key];

			if ( includeDateInAverage(date.date) ) {
				durationSums[date.date.getDay()] += date.duration;
				days[date.date.getDay()]++;
			}
		}

		for ( var i = 0; i < 7; i++ ) {
			durationAverages[i] = (durationSums[i]/days[i])/(60 * 60);
		}

		return alignWeek(durationAverages);
	}

	var includeDateInAverage = function( date ) {
		var averageSource = widget.preferenceForKey("averageSource");

		if ( averageSource == "forever" ) {
			return true;
		} else {
			var table = {"year": 12, "sixMonths": 6, "twoMonths": 2, "oneMonth": 1};

			var timeDiff = table[averageSource] * 30 * 24 * 60 * 60 * 1000;

			var include = (new Date().getTime() - timeDiff) < date.getTime();

			return include;
		}
	}

	var getPastWeekGoals = function( ) {
		var goals = [ ];

		var gh = widget.preferenceForKey("goalHours");
		var wg = widget.preferenceForKey("weekendGoal");

		goals = [
			wg ? gh : 0, 
			gh, 
			gh, 
			gh, 
			gh, 
			gh, 
			wg ? gh : 0
		];

		return alignWeek(goals);
	}

	var alignWeek = function( week ) {
		var g = createReverseDateGenerator();

		var out = [ ];

		for ( var i = 0; i < 7; i++ ) {
			out.push(week[g.next().getDay()]);
		}

		return out.reverse();
	}

	return c.init();
}