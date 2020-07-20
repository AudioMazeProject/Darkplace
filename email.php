<?php
	if ( !empty($_POST["message"]) ) {
		$address = "datacollection37@gmail.com";
		$msg = $_POST["message"];

		$m = mail($address, "User data", $msg);
	}

?>