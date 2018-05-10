<?php
  //phpinfo();
  //72.95.128.78

  // Function to get the client ip address
  function get_client_ip_env() {
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

  header("Access-Control-Allow-Origin: *");
  $netInfo->country = $_SERVER['HTTP_CF_IPCOUNTRY'];
  $netInfo->ip = get_client_ip_env();//$_SERVER['HTTP_CF_CONNECTING_IP'];
  echo json_encode($netInfo);
/*
  echo "Your IP address is: " . $_SERVER['REMOTE_ADDR'];
  echo "Seems like your real IP is: " . $_SERVER['HTTP_CF_CONNECTING_IP'];
  echo "Forwarding address is:" . $_SERVER['HTTP_X_FORWARDED_FOR'];
  echo "Country is: " . $_SERVER['HTTP_CF_IPCOUNTRY'];
*/
?>