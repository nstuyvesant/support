<?php
# Handle HTTP POST of case fields from input form

# Connect to Salesforce
$SfConfig = parse_ini_file("conf.ini");
define(SECURITY_TOKEN, $SfConfig['token']);
define(USERNAME, $SfConfig['user']);
define(PASSWORD, $SfConfig['password']);
require_once('soapclient/SforceEnterpriseClient.php');
$mySforceConnection = new SforceEnterpriseClient();
$mySoapClient = $mySforceConnection->createConnection("soapclient/perfectomobile.xml");
$mylogin = $mySforceConnection->login(USERNAME,PASSWORD.SECURITY_TOKEN);

# Set Case fields
# TODO: Replace with POSTed values
$sObject = new stdclass();
$sObject->Subject = "This is a test";
$sObject->Description = "Please disregard this case.";
$sObject->Priority = "Low";
$sObject->AppURL__c = "demo.perfectomobile.com";
$sObject->SuppliedName = "Firstname Lastname";
$sObject->SuppliedEmail = "demo@perfectomobile.com";
$sObject->SuppliedPhone = "+1-000-000-0000";

try {
  $response = $mySforceConnection->create(array($sObject), 'Case');
  print_r($response);
  exit;
} catch (Exception $e) {
  echo $mySforceConnection->getLastRequest();
  echo $e->faultstring;
  exit;
}
?>
