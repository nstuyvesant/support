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

// Get the user's public IP address
$ip = get_client_ip(); // Use 72.95.128.78 for testing
$netInfo->ip = $ip;

// Determine whether there's a proxy and what type
$proxyCheckIo = json_decode(file_get_contents("http://proxycheck.io/v2/$ip?key=u188a3-680b4p-38550a-06w364&vpn=1"), true);
$proxyResult = "No proxy detected";
if ($proxyCheckIo[$ip]["proxy"] === "yes") {
    $proxyResult = $proxyCheckIo[$ip]["type"] . " detected";
}
$netInfo->proxy = $proxyResult;

// Get location, ISP and time zone
$ipApiCom = json_decode(file_get_contents("http://ip-api.com/json/$ip"), true);
$netInfo->location = $ipApiCom["city"] . ", " . $ipApiCom["region"] . " (" . $ipApiCom["countryCode"] . ")";
$netInfo->isp = $ipApiCom["isp"];
$netInfo->timezone = $ipApiCom["timezone"];
// Write JSON to response stream
echo json_encode($netInfo, JSON_UNESCAPED_SLASHES);
?>