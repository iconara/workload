function createSheet( sheetNode ) {
	var s = { };
	
	
	var sheetContentsNode;
	
	
	var init = function( ) {
		sheetContentsNode = DIV({"class": "sheetContents"}, "");
	
		replaceChildNodes(
			sheetNode,
			DIV({"class": "sheetTop"}, ""),
			DIV({"class": "sheetMiddle"}, sheetContentsNode),
			DIV({"class": "sheetBottom"}, "")
		);
		
		setElementClass(sheetNode, "sheet");
	
		return s;
	}
	
	
	return init();
}