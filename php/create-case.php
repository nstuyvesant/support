<?php
header('Access-Control-Allow-Origin: *'); # Temporary - for testing only (disable to prevent spam)

if($_POST) {

  # Retrieve Salesforce connection info
  $SfConfig = parse_ini_file('conf.ini');
  define(SECURITY_TOKEN, $SfConfig['token']);
  define(USERNAME, $SfConfig['user']);
  define(PASSWORD, $SfConfig['password']);
  require_once('soapclient/SforceEnterpriseClient.php');

  # Instantiate the Salesforce connection
  $connection = new SforceEnterpriseClient();
  $client = $connection->createConnection('soapclient/perfectomobile.wsdl.xml');
  $login = $connection->login(USERNAME, PASSWORD.SECURITY_TOKEN);

  # Set properties of Salesforce Case object
  $case = new stdClass();
  $case->Origin = filter_var($_POST['origin'], FILTER_SANITIZE_STRING);
  $case->Type =  filter_var($_POST['type'], FILTER_SANITIZE_STRING);
  $case->Case_Reason__c = filter_var($_POST['topic'], FILTER_SANITIZE_STRING);
  $case->Priority = filter_var($_POST['priority'], FILTER_SANITIZE_STRING);
  $case->Subject = filter_var($_POST['subject'], FILTER_SANITIZE_STRING);
  $case->Description = filter_var($_POST['description'], FILTER_SANITIZE_STRING);
  $case->AppURL__c = filter_var($_POST['fqdn'], FILTER_SANITIZE_STRING); // PHP 7 has FILTER_FLAG_HOSTNAME
  $case->SuppliedName = filter_var($_POST['name'], FILTER_SANITIZE_STRING);
  $case->SuppliedEmail = filter_var($_POST['email'], FILTER_VALIDATE_EMAIL);
  $case->SuppliedPhone = filter_var($_POST['phone'], FILTER_SANITIZE_STRING);
  $case->SuppliedCompany = filter_var($_POST['company'], FILTER_SANITIZE_STRING);
  $case->Customer_Time_Zone__c = filter_var($_POST['timezone'], FILTER_VALIDATE_FLOAT);
  $case->MCM_Version__c = filter_var($_POST['mcmVersion'], FILTER_SANITIZE_STRING);
  $case->HSS_Version__c = filter_var($_POST['hssVersion'], FILTER_SANITIZE_STRING);
  $case->Location__c = filter_var($_POST['location'], FILTER_SANITIZE_STRING);
  $case->Cradle__c = filter_var($_POST['cradleId'], FILTER_SANITIZE_STRING);
  $case->Device_ID__c = filter_var($_POST['deviceId'], FILTER_SANITIZE_STRING);
  $case->Model__c = filter_var($_POST['model'], FILTER_SANITIZE_STRING);
  $case->OS__c = filter_var($_POST['os'], FILTER_SANITIZE_STRING);
  $case->Version__c = filter_var($_POST['version'], FILTER_SANITIZE_STRING);

  # Create one case and return case number (though setup for mass creates via array)
  try {
    $caseResponse = $connection->create(array($case), 'Case');
    $newCase = $caseResponse[0];
    $newCase->url = 'https://perfectomobile.force.com/customers/' . $newCase->id;
    $newCaseResponse = $connection->retrieve('CaseNumber', 'Case', array($newCase->id));
    $newCase->number = $newCaseResponse[0]->CaseNumber;
    $newCase->phpVersion = phpversion();

    # Upload attachments and link to case
    # $_FILES - array of objects with name, type, tmp_name, error, size properties
    if (isset($_FILES['attachments'])) {
      $uploadedAttachments = $_FILES['attachments'];
      $file_count = count($uploadedAttachments['name']);
      if ($file_count > 0) {
        try {
          $salesforceAttachments = array();
          foreach($uploadedAttachments as $uploadedAttachment) {
            $file = $uploadedAttachment['tmp_name'];
            $data = file_get_contents($file);
            $salesforceAttachment = new stdClass();
            $salesforceAttachment->Body = base64_encode($data);
            $salesforceAttachment->Name = $uploadedAttachment['name'];
            $salesforceAttachment->ParentId = $newCase->id;
            array_push($salesforceAttachments, $salesforceAttachment);
          }
          $attachmentResponse = $connection->create($salesforceAttachments, 'Attachment');
        } catch (Exception $attachmentError) {
          # Failed to attach file
          echo json_encode($attachmentError);
        }
      }
    }
    # Respond with a JSON object representing the case
    echo json_encode($newCase);
  } catch (Exception $caseError) {
    # Create case failed 
    echo json_encode($caseError);
  }

}
// define("SOAP_CLIENT_BASEDIR", "../soapclient");
// require_once (SOAP_CLIENT_BASEDIR.'/SforceEnterpriseClient.php');
// require_once (SOAP_CLIENT_BASEDIR.'/SforceHeaderOptions.php');

// $login = 'your Salesforce Id';
// $password = 'your Salesforce pwd';
// try {
//   // login
//   $mySforceConnection = new SforceEnterpriseClient();
//   $mySoapClient = $mySforceConnection->createConnection(SOAP_CLIENT_BASEDIR.'/enterprise.wsdl.xml');
//   $mylogin = $mySforceConnection->login($login, $password);
  
//   // Search
//   $searchKey = $_POST["parentId"];
//   $tableKey = $_POST["select"];
//   $query = 'SELECT Id from ' . $tableKey . ' where Name = \'' . $searchKey . '\'';
//   print_r($query);
//   $response = $mySforceConnection->query(($query));

//   // helpful method
//   $file = $_FILES["attachment"]["tmp_name"];
//   $fileName = $_FILES["attachment"]["name"];
//   $parentID = $response->records[0]->Id;
  
//   $handle = fopen($file,'rb');
//   $file_content = fread($handle,filesize($file));
//   fclose($handle);

//   // encode
//   $encoded = chunk_split(base64_encode($file_content));
  
//   // the target Sobject
//   $sObject = new stdclass();
//   $sObject->Name = $fileName;
//   $sObject->ParentId = $parentID;
//   $sObject->body = $encoded;
//   // do upload
//   $createResponse = $mySforceConnection->create(array($sObject), 'Attachment');
//   var_dump($createResponse);
//   // print_r($createResponse->Id);
// } catch (Exception $e) {
//   echo $mySforceConnection->getLastRequest();
//   echo $e->faultstring;
//   }
?>
