




<?php
	if ( !empty($_POST["message"]) ) {
		$address = "datacollection37@gmail.com";
		$msg = $_POST["message"];

		mail($address, "User data", $msg);
	}
?>