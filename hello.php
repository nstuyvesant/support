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
  foreach($proxy_headers as $x){
    if (isset($_SERVER[$x])) $message = "Proxy detected";
  }
  $ports = array(8080,80,81,1080,6588,8000,3128,553,554,4480);
  foreach($ports as $port) {
    if (@fsockopen($ipAddress, $port, $errno, $errstr, 30)) {
      $message = "Proxy detected";
    }
  }
  return $message;
}

// User ARIN's REST API to get client location info
function get_isp() {
  // Create a new cURL resource
  $ch = curl_init();
  // Set URL and other appropriate options
  curl_setopt($ch, CURLOPT_URL, "http://whois.arin.net/rest/ip/" . get_client_ip());
  curl_setopt($ch, CURLOPT_HEADER, 0);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_HTTPHEADER, array("Accept: application/json"));
  // Execute curl
  $returnValue = curl_exec($ch);
  // Close cURL resource, and free up system resources
  curl_close($ch);
  $result = json_decode($returnValue);
  return $result->net->orgRef->{'@name'};
}

$ip = get_client_ip();
$netInfo->ip = $ip;
//$netInfo->proxy = get_proxy_info($ip);
$json = file_get_contents("http://api.ipstack.com/$ip?access_key=7c21bd608096d60dbe33bcd139a3e0af");
$netInfo->city = $json['city'];
$netInfo->region = $json['region_code'];
$netInfo->country = $json['country_code'];
$netInfo->isp = get_isp();
echo json_encode($netInfo);
?>