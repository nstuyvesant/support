<?php
header("HTTP/1.1 200 OK");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Connection: keep-alive");
header("Access-Control-Allow-Origin: *");

// Function to get the client IP address
function get_client_ip() {
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
function validate_ip($ip) {
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
$netInfo->remoteAddr = $_SERVER["REMOTE_ADDR"];
$netInfo->forwardedFor = $_SERVER["HTTP_X_FORWARDED_FOR"];
$netInfo->proxy = get_proxy_info($ip);

$arr = json_decode(file_get_contents("http://ip-api.com/json//$ip"), true);
$netInfo->city = $arr["city"];
$netInfo->region = $arr["region"];
$netInfo->country = $arr["countryCode"];
$netInfo->isp = $arr["isp"];
$netInfo->timezone = $arr["timezone"];

$arr = json_decode(file_get_contents("http://proxycheck.io/v2/$ip?key=u188a3-680b4p-38550a-06w364&vpn=1"), true);
echo json_encode($arr[$ip], JSON_UNESCAPED_SLASHES);

//echo json_encode($netInfo, JSON_UNESCAPED_SLASHES);
?>