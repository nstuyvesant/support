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
function get_proxy_info($ipAddress) {
  $message = "No proxy detected";
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
  foreach($proxy_headers as $x) {
    if (isset($_SERVER[$x])) $message = "Proxy detected ($x)";
  }
  // $ports = array(8080,80,81,1080,6588,8000,3128,553,554,4480);
  // foreach($ports as $port) {
  //   if (@fsockopen($ipAddress, $port, $errno, $errstr, 30)) {
  //     $message = "Proxy detected";
  //   }
  // }
  return $message;
}

$ip = get_client_ip();
$netInfo->ip = $ip;
$netInfo->proxy = get_proxy_info($ip);

$arr = json_decode(file_get_contents("http://ip-api.com/json//$ip"), true);
$netInfo->city = $arr['city'];
$netInfo->region = $arr['region'];
$netInfo->country = $arr['countryCode'];
$netInfo->isp = $arr['isp'];
$netInfo->timezone = $arr['timezone'];
echo json_encode($netInfo);
?>