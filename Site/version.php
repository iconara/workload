<?php
header("Content-type: application/xml");

$CURRENT_BUILD_N = 6;

if ( isset($_REQUEST["n"]) && preg_match('/^\d+$/', $_REQUEST["n"]) ) {
	$n = intval($_REQUEST["n"]);
	
	if ( $n < $CURRENT_BUILD_N ) {
?>
<update url="http://developer.iconara.net/products/Workload/Workload-1.0b6.wdgt.zip"/>
<?php 
	} else {
?>
<ok/>
<?php		
	}
} else {
?>
<error/>
<?php
}
?>