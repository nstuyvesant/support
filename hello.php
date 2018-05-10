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
  $ip = get_client_ip();
  $proxyDetect = file_get_contents("https://www.ip-check.net/api/proxy-detect.php?ip=$ip");
  if ($proxyDetect == "TRUE") {
    return "Proxy Detected";
  } else if ($proxyDetect == "FALSE") {
    return "Proxy Not Detected";
  } else {
    return "Invalid IP Address";
}
  // $proxy_headers = array(
  //   'HTTP_VIA',
  //   'HTTP_X_FORWARDED_FOR',
  //   'HTTP_FORWARDED_FOR',
  //   'HTTP_X_FORWARDED',
  //   'HTTP_FORWARDED',
  //   'HTTP_CLIENT_IP',
  //   'HTTP_FORWARDED_FOR_IP',
  //   'VIA',
  //   'X_FORWARDED_FOR',
  //   'FORWARDED_FOR',
  //   'X_FORWARDED',
  //   'FORWARDED',
  //   'CLIENT_IP',
  //   'FORWARDED_FOR_IP',
  //   'HTTP_PROXY_CONNECTION'
  // );

  // $text = "";
  // foreach($proxy_headers as $x) {
  //   if (isset($_SERVER[$x])) {
  //     if ($text == "")
  //       $text = "Proxy detected";
  //     else
  //       $text .= ", ";
  //       $text .= $x;
  //     }
  // }

  // if ($text == "") {
  //   $text = "No proxy detected";
  // }
  // return $text;
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
$netInfo->proxy = get_proxy_info();
$json = file_get_contents("https://freegeoip.net/json/$ip");
$json = json_decode($json ,true);
$netInfo->country = $json['country_name'];
$netInfo->region = $json['region_name'];
$netInfo->city = $json['city'];

$netInfo->isp = get_isp();
echo json_encode($netInfo);
?>