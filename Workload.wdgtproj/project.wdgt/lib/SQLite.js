var SQLITE_PATH = "lib/sqlite3";
var SQLITE_SEPARATOR = "|";
var SQLITE_NULLVALUE = "NULL";
var SQLITE_ARGUMENTS = "-header -separator '" + SQLITE_SEPARATOR + "' -nullvalue '" + SQLITE_NULLVALUE + "'";
var SENTINEL = "--end--";


var createSQLite = function( databasePath ) {
	var sqlite = { };

	sqlite.query = function( sql ) {
		var d = exec(sql);
		
		return d;
	}
	
	var exec = function( sql ) {
		var d = new Deferred();
	
		var command = SQLITE_PATH + " " + SQLITE_ARGUMENTS + " \"" + databasePath + "\" \"" + sql + "\" && echo '" + SENTINEL + "'";
		
		d.addCallback(function( sys ) {
			if ( sys.status == 0 && sys.outputString.indexOf(SENTINEL) > -1 ) {
				return sys.outputString.replace(SENTINEL + "\n", "");
			} else {
				throw new Error("Sentinel not found");
			}
		});
		
		d.addCallback(parseSQLiteOutput);
		
		widget.system(command, bind(d.callback, d));
		
		return d;
	}
	
	var parseSQLiteOutput = function( output ) {
		var lines = output.split("\n");
		
		var header = lines.shift().split(SQLITE_SEPARATOR);
		
		lines.pop(); // last line is empty, remove it
	
		var data = map(
			function( line ) {
				var values = map(valueOrNull, line.split(SQLITE_SEPARATOR));
				
				var obj = { };
				
				for ( var i = 0; i < values.length; i++ ) {
					obj[header[i]] = values[i];
				}
				
				return obj;
			},
			lines
		);
		
		return data;
	}
	
	var valueOrNull = function( value ) {
		return value == SQLITE_NULLVALUE ? null : value;
	}

	return sqlite;
}