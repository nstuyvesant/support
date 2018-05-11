<?php
header("HTTP/1.1 200 OK");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Connection: keep-alive");
header("Access-Control-Allow-Origin: *");

// Function to get the client IP address
function get_client_ip() {
  $ipaddress = "";
  if (getenv("HTTP_CLIENT_IP"))
      $ipaddress = getenv("HTTP_CLIENT_IP");
  else if(getenv("HTTP_X_FORWARDED_FOR"))
      $ipaddress = getenv("HTTP_X_FORWARDED_FOR");
  else if(getenv("HTTP_X_FORWARDED"))
      $ipaddress = getenv("HTTP_X_FORWARDED");
  else if(getenv("HTTP_FORWARDED_FOR"))
      $ipaddress = getenv("HTTP_FORWARDED_FOR");
  else if(getenv("HTTP_FORWARDED"))
      $ipaddress = getenv("HTTP_FORWARDED");
  else if(getenv("REMOTE_ADDR"))
      $ipaddress = getenv("REMOTE_ADDR");
  else
      $ipaddress = "UNKNOWN";

  return $ipaddress;
}

function get_true_ip() {
    $ip_keys = array('HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED', 'HTTP_X_CLUSTER_CLIENT_IP', 'HTTP_FORWARDED_FOR', 'HTTP_FORWARDED', 'REMOTE_ADDR');
    foreach ($ip_keys as $key) {
        if (array_key_exists($key, $_SERVER) === true) {
            foreach (explode(',', $_SERVER[$key]) as $ip) {
                // trim for safety measures
                $ip = trim($ip);
                // attempt to validate IP
                if (validate_ip($ip)) {
                    return $ip;
                }
            }
        }
    }
    return isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : false;
}
/**
 * Ensures an ip address is both a valid IP and does not fall within
 * a private network range.
 */
function validate_ip($ip)
{
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
        return false;
    }
    return true;
}

// Function to get proxy info
function get_proxy_info($ipAddress) {
  $message = "No proxy detected";
  $proxy_headers = array(   
    "HTTP_VIA",   
    "HTTP_X_FORWARDED_FOR", // mine
    "HTTP_FORWARDED_FOR",
    "HTTP_X_FORWARDED",
    "HTTP_FORWARDED",
    "HTTP_CLIENT_IP",
    "HTTP_FORWARDED_FOR_IP",
    "VIA",
    "X_FORWARDED_FOR",
    "FORWARDED_FOR",
    "X_FORWARDED",
    "FORWARDED",
    "CLIENT_IP",
    "FORWARDED_FOR_IP",
    "HTTP_PROXY_CONNECTION"
  );
  foreach($proxy_headers as $header) {
    if (isset($_SERVER[$header])) $message = "Proxy detected ($header)";
  }
  // $ports = array(8080,80,81,1080,6588,8000,3128,553,554,4480);
  // foreach($ports as $port) {
  //   if (@fsockopen($ipAddress, $port, $errno, $errstr, 30)) {
  //     $message = "Proxy detected";
  //   }
  // }
  return $message;
}

$ip = get_client_ip(); //72.95.128.78
$netInfo->ip = $ip;
$netInfo->remoteAddr = $_SERVER['REMOTE_ADDR'];
$netInfo->trueIp = get_true_ip();
$netInfo->proxy = get_proxy_info($ip);

$arr = json_decode(file_get_contents("http://ip-api.com/json//$ip"), JSON_UNESCAPED_SLASHES);
$netInfo->city = $arr["city"];
$netInfo->region = $arr["region"];
$netInfo->country = $arr["countryCode"];
$netInfo->isp = $arr["isp"];
$netInfo->timezone = $arr["timezone"];
echo json_encode($netInfo, JSON_UNESCAPED_SLASHES);
?>