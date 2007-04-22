/**
 * Returns a function which for each call returns a
 * date representing a day earlier (24h) than the last date
 * returned. The first date returned is the current date.
 */
function createReverseDateGenerator( referenceDate ) {
	var d = referenceDate == null ? new Date() : referenceDate;

	return {
		next: function( ) {
			var dd = d;
		
			d = new Date(d.getTime() - (1000 * 60 * 60 *24));
		
			return dd;
		}
	}
}
