<?php
# TODO: Replace hard-coded values with array of name/value pairs from POST - $('#requestForm').serializeArray()
$subject = 'Test subject';
$description = 'This is only a test';
$Priority = 'Low';
$appUrl = 'cloud.perfectomobile.com';
$suppliedName = 'Firstname Lastname';
$suppliedEmail = 'nul@bitbucket.com';
$SuppliedPhone = '+111111111111';
$filename = 'file.txt';
$path = 'ATTACHMENT.txt';

# Retrieve Salesforce connection info
$SfConfig = parse_ini_file('conf.ini');
define(SECURITY_TOKEN, $SfConfig['token']);
define(USERNAME, $SfConfig['user']);
define(PASSWORD, $SfConfig['password']);
require_once('soapclient/SforceEnterpriseClient.php');

# Instantiate the Salesforce connection
$mySforceConnection = new SforceEnterpriseClient();
$mySoapClient = $mySforceConnection->createConnection('soapclient/perfectomobile.xml');
$mylogin = $mySforceConnection->login(USERNAME,PASSWORD.SECURITY_TOKEN);

# Set properties of Salesforce Case object
$sObject = new stdclass();
$sObject->Subject = $subject;
$sObject->Description = $description;
$sObject->Priority = $Priority; 
$sObject->AppURL__c = $appUrl;
$sObject->SuppliedName = $suppliedName;
$sObject->SuppliedEmail = $suppliedEmail;
$sObject->SuppliedPhone = $SuppliedPhone; 

# Create case
try {
  $response = $mySforceConnection->create(array($sObject), 'Case');
  foreach ($response as $record) $parent = $record->id;
  $json['case'] = $response;

  # Upload attachment if one exists and case was created
  if (file_exists($path)) {
    try {
      $sfObj = new stdClass();
      $data = file_get_contents($path);
      $sfObj->Body = base64_encode($data);
      $sfObj->Name = $filename;
      $sfObj->ParentId = $parent;
      
      $response = $mySforceConnection->create(array($sfObj), 'Attachment');
      $json['attachment'] = $response;
    } catch (Exception $e) {
      # Failed to attach file
      # $json['attachment'] = NULL;
    }
  }
  $myJSON = json_encode($json);
  print_r($json);
} catch (Exception $e) {
  # Create case failed 
  # $json['case'] = NULL;
}
 ?>
