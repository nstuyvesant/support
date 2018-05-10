<?php
  //phpinfo();
  echo('Your IP address is: ' + $_SERVER['REMOTE_ADDR']);
  echo('Seems like your real IP is: ' + $_SERVER['HTTP_CF_CONNECTING_IP']);
  echo('Forwarding address is:' + $_SERVER['HTTP_X_FORWARDED_FOR']);
  echo('Country is: ' + $_SERVER['HTTP_CF_IPCOUNTRY']);
?>