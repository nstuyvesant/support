<?php
header( "HTTP/1.1 200 OK" );
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Connection: keep-alive");
header("Access-Control-Allow-Origin: *");

// Function to get the client IP address
function get_client_ip() {
  $ipaddress = '';
  if (getenv('HTTP_CLIENT_IP'))
      $ipaddress = getenv('HTTP_CLIENT_IP');
  else if(getenv('HTTP_X_FORWARDED_FOR'))
      $ipaddress = getenv('HTTP_X_FORWARDED_FOR');
  else if(getenv('HTTP_X_FORWARDED'))
      $ipaddress = getenv('HTTP_X_FORWARDED');
  else if(getenv('HTTP_FORWARDED_FOR'))
      $ipaddress = getenv('HTTP_FORWARDED_FOR');
  else if(getenv('HTTP_FORWARDED'))
      $ipaddress = getenv('HTTP_FORWARDED');
  else if(getenv('REMOTE_ADDR'))
      $ipaddress = getenv('REMOTE_ADDR');
  else
      $ipaddress = 'UNKNOWN';

  return $ipaddress;
}

// Function to get proxy info
function get_proxy_info() {
  $proxy_headers = array(
    'HTTP_VIA',
    'HTTP_X_FORWARDED_FOR',
    'HTTP_FORWARDED_FOR',
    'HTTP_X_FORWARDED',
    'HTTP_FORWARDED',
    'HTTP_CLIENT_IP',
    'HTTP_FORWARDED_FOR_IP',
    'VIA',
    'X_FORWARDED_FOR',
    'FORWARDED_FOR',
    'X_FORWARDED',
    'FORWARDED',
    'CLIENT_IP',
    'FORWARDED_FOR_IP',
    'HTTP_PROXY_CONNECTION'
  );

  $text = "";
  foreach($proxy_headers as $x) {
    if (isset($_SERVER[$x])) {
      if ($text == "")
        $text = "Proxy traffic detected. Headers: ";
      else
        $text .= ", ";
        $text .= $x;
      }
  }

  if ($text == "") {
    $text = "No proxy detected";
  }
  return $text;
}

$netInfo->country = $_SERVER['HTTP_CF_IPCOUNTRY'];
$netInfo->ip = get_client_ip();
$netInfo->proxy = get_proxy_info();
echo json_encode($netInfo);
?>