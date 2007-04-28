var SQLITE_PATH = "lib/sqlite3";
var SQLITE_SEPARATOR = "|";
var SQLITE_NULLVALUE = "NULL";
var SQLITE_ARGUMENTS = "-header -separator '" + SQLITE_SEPARATOR + "' -nullvalue '" + SQLITE_NULLVALUE + "'";
var SENTINEL = "--end--";
var TEMP_FILE_PATH = "/private/tmp/workload-sqlite-%identifier%.out";


var createSQLite = function( databasePath ) {
	var sqlite = { };

	sqlite.query = function( sql ) {
		var d = exec(sql);
		
		return d;
	}
	
	var exec = function( sql ) {
		var d = new Deferred();
		
		var tmpfile = TEMP_FILE_PATH.replace("%identifier%", widget.identifier + "-" + Math.floor(100 * Math.random()));
	
		var command = "" +
			SQLITE_PATH + " " + SQLITE_ARGUMENTS + " \"" + databasePath + "\" \"" + sql + "\" > " + tmpfile + 
			" && echo '" + SENTINEL + "' >> " + tmpfile;
		
		// first filer: determine sqlite status and fetch the output
		d.addCallback(function( sys ) {
			if ( sys.status == 0 ) {
				return doSimpleXMLHttpRequest("file://" + tmpfile);
			} else {
				var e = new Error("There was an error while querying the database");
				
				e.userData = {
					status: sys.status,
					errorString: sys.errorString
				}
				
				throw e;
			}
		});
		
		// second filter: get the sqlite output data from the request object
		d.addCallback(function( response ) {
			if ( response.responseText.indexOf(SENTINEL) > -1 ) {
				return response.responseText.replace(SENTINEL, "");
			} else {
				throw new Error("Data truncated");
			}
			
			widget.system("rm -f " + tmpfile, function( ) { });
		});
		
		// third filter: parse the sqlite output
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