<?php
header('Content-Type: application/json');

if($_POST) {

  # Retrieve Salesforce connection info
  $SfConfig = parse_ini_file('conf.ini');

  # For CloudFlare
  if (isset($_SERVER["HTTP_CF_CONNECTING_IP"])) {
    $_SERVER['REMOTE_ADDR'] = $_SERVER["HTTP_CF_CONNECTING_IP"];
  }

  # Verify reCaptcha
  $post_data = http_build_query(
    array(
        'secret' => $SfConfig['recaptcha'],
        'response' => $_POST['g-recaptcha-response'],
        'remoteip' => $_SERVER['REMOTE_ADDR']
    )
  );
  $opts = array('http' =>
    array(
        'method'  => 'POST',
        'header'  => 'Content-type: application/x-www-form-urlencoded',
        'content' => $post_data
    )
  );
  $context  = stream_context_create($opts);
  $response = file_get_contents('https://www.google.com/recaptcha/api/siteverify', false, $context);
  $result = json_decode($response);
  if (!$result->success) {
    throw new Exception('reCAPTCHA verification failed. You are a probably a robot.', 1);
  }
  
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
  $case->Origin = $_POST['origin'];
  #$case->Owner = '00520000000yUK2'; # Perfecto Mobile Support
  $case->Type =  $_POST['type'];
  $case->Case_Reason__c = $_POST['topic'];
  $case->Priority = $_POST['priority'];
  $case->Subject = htmlspecialchars_decode($_POST['subject'], ENT_QUOTES);
  $case->Description = htmlspecialchars_decode($_POST['description'], ENT_QUOTES);
  $case->AppURL__c = $_POST['fqdn'];
  $case->SuppliedName = htmlspecialchars_decode($_POST['name'], ENT_QUOTES);
  $case->SuppliedEmail = $_POST['email'];
  $case->SuppliedPhone = htmlspecialchars_decode($_POST['phone'], ENT_QUOTES);
  $case->SuppliedCompany = htmlspecialchars_decode($_POST['company'], ENT_QUOTES);
  $case->Customer_Time_Zone__c = $_POST['timezone'];
  $case->MCM_Version__c = $_POST['mcmVersion'];
  $case->HSS_Version__c = $_POST['hssVersion'];
  $case->Location__c = $_POST['location'];
  $case->Cradle__c = $_POST['cradleId'];
  $case->Device_ID__c = $_POST['deviceId'];
  $case->Model__c = $_POST['model'];
  $case->OS__c = $_POST['os'];
  $case->Version__c = $_POST['version'];

  # Create one case and return case number (though setup for mass creates via array)
  try {
    $caseResponse = $connection->create(array($case), 'Case');
    $newCase = $caseResponse[0];
    $newCase->url = 'https://perfectomobile.force.com/customers/' . $newCase->id;
    $newCaseResponse = $connection->retrieve('CaseNumber', 'Case', array($newCase->id));
    $newCase->number = $newCaseResponse[0]->CaseNumber;

    # Upload attachments and link to case (odd that $_FILES['attachments'] is an object with array properties rather than an array of objects)
    if (isset($_FILES['attachments'])) {
      $uploadedAttachments = $_FILES['attachments'];
      $file_count = count($uploadedAttachments['name']);
      if ($file_count > 0) {
        try {
          $salesforceAttachments = array();
          for ($i = 0; $i < $file_count; $i++) {
            $file = $uploadedAttachments['tmp_name'][$i];
            $data = file_get_contents($file);
            $salesforceAttachment = new stdClass();
            $salesforceAttachment->Body = base64_encode($data);
            $salesforceAttachment->Name = $uploadedAttachments['name'][$i];
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
?>
