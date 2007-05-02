function createSheet( sheetNode ) {
	var s = { };
	

	var sheetTopNode;
	var sheetMiddleNode;
	var sheetBottomNode;
	
	var sheetContentsNode;
	
	var closeXNode;
	
	
	var init = function( ) {
		sheetContentsNode = DIV({"class": "sheetContents"});
	
		sheetTopNode    = DIV({"class": "sheetTop"}, "");
		sheetMiddleNode = DIV({"class": "sheetMiddle"}, sheetContentsNode);
		sheetBottomNode = DIV({"class": "sheetBottom"}, "");
		
		closeXNode = IMG({"class": "closeX", "src": "Images/x.png"});
	
		replaceChildNodes(
			sheetNode,
			sheetTopNode,
			sheetMiddleNode,
			sheetBottomNode,
			closeXNode
		);
		
		setElementClass(sheetNode, "sheet");
		
		hideElement(sheetTopNode);
		hideElement(sheetBottomNode);
		hideElement(sheetMiddleNode);
		
		connect(closeXNode, "onclick", onClose);
	
		return s;
	}
	
	var onClose = function( ) {
		s.setVisible(false);
		
		signal(s, "close");
	}
	
	s.setVisible = function( visible ) {
		if ( visible ) {
			showElement(
				sheetNode,
				sheetTopNode,
				sheetBottomNode,
				closeXNode
			);

			blindDown(sheetMiddleNode, {duration: 0.3});
		} else {
			hideElement(closeXNode);
		
			blindUp(sheetMiddleNode, {duration: 0.3});
			
			setTimeout(partial(hideElement, sheetNode, sheetTopNode, sheetBottomNode), 400);
		}
	}
	
	s.setContents = function( contents ) {
		replaceChildNodes(sheetContentsNode, contents);
	}
	
	return init();
}