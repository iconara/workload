<?php

$d = opendir(".");

$newest = null;

while ( ($file = readdir($d)) !== false ) {
	if ( preg_match('/^Workload-(\d+)\.(\d+)b(\d+)\.wdgt\.zip$/', $file, $matches) ) {
		$major = intval($matches[1]);
		$minor = intval($matches[2]);
		$build = intval($matches[3]);
		
		if ( $newest == null ) {
			$newest = array(
				"build" => 0,
				"file"  => ""
			);
		}
		
		if ( $build > $newest["build"] ) {
			$newest = array(
				"build" => $build,
				"file"  => $file
			);
		}
	}
}

closedir($d);

header("Location: $newest[file]");

?>