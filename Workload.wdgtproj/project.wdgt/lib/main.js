var widgetController;
var preferencesController;
var backController;


function main( ) {
	backController        = createBackController();
	preferencesController = createPreferencesController();
	widgetController      = createWidgetController(preferencesController);

	connect(widget, "show",      widgetController, widgetController.start);
	connect(widget, "hide",      widgetController, widgetController.stop);
	connect(widget, "showBack",  widgetController, widgetController.stop);
	connect(widget, "showFront", widgetController, widgetController.start);
	connect(widget, "showFront", preferencesController, preferencesController.update);	
}
