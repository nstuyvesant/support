

<?php

$SfConfig = parse_ini_file("conf.ini");
define(SECURITY_TOKEN, $SfConfig['token']);
define(USERNAME, $SfConfig['user']);
define(PASSWORD, $SfConfig['password']);
require_once ('soapclient/SforceEnterpriseClient.php');

$mySforceConnection = new SforceEnterpriseClient();
$mySoapClient = $mySforceConnection->createConnection("soapclient/perfectomobile.xml");
$mylogin = $mySforceConnection->login(USERNAME,PASSWORD.SECURITY_TOKEN);

#case fields 
$sObject = new stdclass();
$sObject->Subject = "some subject";
$sObject->Description ="some description";
$sObject->Priority ="low"; 
$sObject->AppURL__c ="my cloud.perfectomobile.com"; 
$sObject->SuppliedName ="first name + last name "; 
$sObject->SuppliedEmail ="fish@perfectomobile.com"; 
$sObject->SuppliedPhone ="+219829182"; 

try {
    
   $response = $mySforceConnection->create(array($sObject), 'Case');
   print_r($response); 
    exit;
}
catch (Exception $e){ 
    echo $mySforceConnection->getLastRequest();
    echo $e->faultstring;
    exit;
    
}
 ?>
