var DURATION_BY_DATE_SQL = "" +
	"SELECT " +
	"	SUM(te.endDateTime - te.startDateTime) AS duration, " +
	"	date(te.startDateTime, 'unixepoch') AS startDate " +
	"FROM TimeEntry te LEFT JOIN TimeSlip ts ON te.timeSlipID = ts._rowid " +
	"WHERE te.foreignAppUser IS NULL " +
	"GROUP BY startDate " + 
	"ORDER BY startDate " +
	"";
		
var COCOA_REFERENCE_DATE = "978303600.000"; // Cocoa NSDate reference date (Jan 1, 2001) in the Unix epoch


function createModelManager( databaseConnection, preferencesController ) {
	var mm = { };
	
	
	var dates;
	
	var updateErrorCount;
	
	
	var init = function( ) {
		return mm;
	}
	
	mm.update = function( ) {
		updateErrorCount = 0;
	
		getData();
	}
	
	var getData = function( ) {
		var sql = DURATION_BY_DATE_SQL.replace(
			new RegExp("%referenceDate%", "g"),
			COCOA_REFERENCE_DATE
		);
	
		var d = databaseConnection.query(sql);

		d.addErrback(onDataError);
		d.addCallback(onData);
	}
	
	var onDataError = function( e ) {
		signal(mm, "error", e);
	}
	
	var onData = function( result ) {
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
		
		signal(mm, "update");
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
	
	mm.getPastWeekHours = function( ) {
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

	/**
	 * Returns the average number of worked hours for each day of the week as
	 * an array where the first elements represents Sunday.
	 */
	mm.getWeekAverages = function( ) {
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

		return durationAverages;
	}

	var includeDateInAverage = function( date ) {
		var averageSource = preferencesController.getAverageSource();

		if ( averageSource == "forever" ) {
			return true;
		} else {
			var table = {"year": 12, "sixMonths": 6, "twoMonths": 2, "oneMonth": 1};

			var timeDiff = table[averageSource] * 30 * 24 * 60 * 60 * 1000;

			var include = (new Date().getTime() - timeDiff) < date.getTime();

			return include;
		}
	}
	
	return init();
}