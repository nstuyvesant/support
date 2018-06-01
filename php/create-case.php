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
$connection = new SforceEnterpriseClient();
$client = $connection->createConnection('soapclient/perfectomobile.xml');
$login = $connection->login(USERNAME, PASSWORD.SECURITY_TOKEN);

# Set properties of Salesforce Case object
$case = new stdClass();
$case->Origin = $origin;
$case->Type = $type;
$case->Case_Reason__c = $topic;
$case->Priority = $priority;
$case->Subject = $subject;
$case->Description = $description;
$case->AppURL__c = $fqdn;
$case->SuppliedName = $suppliedName;
$case->SuppliedEmail = $suppliedEmail;
$case->SuppliedPhone = $suppliedPhone;
$case->SuppliedCompany = $company;
$case->Customer_Time_Zone__c = $timezone;
$case->MCM_Version__c = $mcmVersion;
$case->HSS_Version__c = $hssVersion;
$case->Location__c = $location;
$case->Cradle__c = $cradleId;
$case->Device_ID__c = $deviceId;
$case->Device_ID__c = $deviceId;
$case->Model__c = $model;
$case->OS__c = $os;
$case->Version__c = $version;

# Create one case and return case number (though setup for mass creates via array)
try {
  $caseResponse = $connection->create(array($case), 'Case');
  foreach ($caseResponse as $record) $parent = $record->id; # There's only one

  # Upload attachment if one exists and case was created
  if (file_exists($path)) {
    try {
      $data = file_get_contents($path);
      $attachment = new stdClass();
      $attachment->Body = base64_encode($data);
      $attachment->Name = $filename;
      $attachment->ParentId = $parent;
      $attachmentResponse = $connection->create(array($attachment), 'Attachment');
    } catch (Exception $attachmentError) {
      # Failed to attach file
      echo json_encode($attachmentError);
    }
  }
  # Respond with a JSON object representing the case (though we only need the Case Number)
  echo json_encode($caseResponse);
  # print_r($caseResponse); # for debugging
} catch (Exception $caseError) {
  # Create case failed 
  echo json_encode($caseError);
}
 ?>
