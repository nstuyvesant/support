<?php
# TODO: Replace hard-coded values with array of name/value pairs from POST - $('#requestForm').serializeArray()
$type = 'Non-issue';
$topic = 'Non-issue: Test';
$origin = 'Web';
$timezone = -5;
$company = 'Acme, Inc.';
$mcmVersion = '18.6';
$hssVersion = '18.6';
$location = 'NA-US-BOS';
$cradleId = 'BOS-E8-4-1/VIRTUAL/02';
$deviceId = '2A56E99775698D2F1BABD7C1F9D57CA06AF0C7F6';
$status = 'Closed - Canceled';
$model = 'iPhone-8';
$os = 'iOS';
$version = '11.1';
$subject = 'Test subject'; # $_POST["subject"]
$description = 'This is only a test'; # $_POST["description"]
$priority = 'Low'; #_POST["priority"]
$fqdn = 'cloud.perfectomobile.com'; # $_POST["appUrl"]
$suppliedName = 'Firstname Lastname'; # $_POST["suppliedName"]
$suppliedEmail = 'nul@bitbucket.com'; # $_POST["suppledEmail"]
$suppliedPhone = '+111111111111'; # $_POST["suppliedPhone"]
$filename = 'file.txt'; # What to call the attachment in Salesforce
$path = 'ATTACHMENT.txt'; # The local path to the file being uploaded

# Retrieve Salesforce connection info
$SfConfig = parse_ini_file('conf.ini');
define(SECURITY_TOKEN, $SfConfig['token']);
define(USERNAME, $SfConfig['user']);
define(PASSWORD, $SfConfig['password']);
require_once('soapclient/SforceEnterpriseClient.php');

# Instantiate the Salesforce connection
$mySforceConnection = new SforceEnterpriseClient();
$mySoapClient = $mySforceConnection->createConnection('soapclient/perfectomobile.xml');
$mylogin = $mySforceConnection->login(USERNAME, PASSWORD.SECURITY_TOKEN);

# Set properties of Salesforce Case object
$sObject = new stdclass();
$sObject->Status = $status; # PROBLEM
$sObject->Origin = $origin;
$sObject->Type = $type;
$sObject->Case_Reason__c = $topic;
$sObject->Priority = $priority;
$sObject->Subject = $subject;
$sObject->Description = $description;
$sObject->AppURL__c = $fqdn;
$sObject->SuppliedName = $suppliedName;
$sObject->SuppliedEmail = $suppliedEmail;
$sObject->SuppliedPhone = $suppliedPhone;
$sObject->SuppliedCompany = $company;
$sObject->Customer_Time_Zone__c = $timezone;
$sObject->MCM_Version__c = $mcmVersion;
$sObject->HSS_Version__c = $hssVersion;
$sObject->Location__c = $location;
$sObject->Cradle__c = $cradleId;
$sObject->Device_ID__c = $deviceId;
$sObject->Device_ID__c = $deviceId;
$sObject->Model__c = $model;
$sObject->OS__c = $os;
$sObject->Version__c = $version;

# Create case (though it's setup for mass creates via array)
try {
  $caseResponse = $mySforceConnection->create(array($sObject), 'Case');
  foreach ($caseResponse as $record) $parent = $record->id;
  $json['case'] = $caseResponse;

  # Upload attachment if one exists and case was created
  if (file_exists($path)) {
    try {
      $sfObj = new stdClass();
      $data = file_get_contents($path);
      $sfObj->Body = base64_encode($data);
      $sfObj->Name = $filename;
      $sfObj->ParentId = $parent;
      
      $attachmentResponse = $mySforceConnection->create(array($sfObj), 'Attachment');
      $json['attachment'] = $attachmentResponse;
    } catch (Exception $attachmentError) {
      # Failed to attach file
      # $json['attachment'] = NULL;
      echo json_encode($attachmentError);
    }
  }
  # Respond with a JSON object representing the case (though we only need the Case Number)
  echo json_encode($caseResponse);
  #print_r($json);
} catch (Exception $caseError) {
  # Create case failed 
  # $json['case'] = NULL;
  echo json_encode($caseError);
}
 ?>
