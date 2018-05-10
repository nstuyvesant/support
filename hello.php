<?php
  //phpinfo();
  //72.95.128.78
  header("Access-Control-Allow-Origin: *");
  $netInfo->country = $_SERVER['HTTP_CF_IPCOUNTRY'];
  $netInfo->ip = $_SERVER['HTTP_CF_CONNECTING_IP'];
  echo json_encode($netInfo);
/*
  echo "Your IP address is: " . $_SERVER['REMOTE_ADDR'];
  echo "Seems like your real IP is: " . $_SERVER['HTTP_CF_CONNECTING_IP'];
  echo "Forwarding address is:" . $_SERVER['HTTP_X_FORWARDED_FOR'];
  echo "Country is: " . $_SERVER['HTTP_CF_IPCOUNTRY'];
*/
?>