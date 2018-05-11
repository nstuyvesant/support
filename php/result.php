<?php
	header("Access-Control-Allow-Origin: *");
	$post = file_get_contents('php://input');
	file_put_contents("results.txt", $post, FILE_APPEND);
?>