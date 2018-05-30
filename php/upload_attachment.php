

<?php

function upload_attachment($filename,$path,$parent) {
  $SfConfig = parse_ini_file("conf.ini");
  define(SECURITY_TOKEN, $SfConfig['token']);
  define(USERNAME, $SfConfig['user']);
  define(PASSWORD, $SfConfig['password']);
  require_once ('soapclient/SforceEnterpriseClient.php');
  
  $mySforceConnection = new SforceEnterpriseClient();
  $mySoapClient = $mySforceConnection->createConnection("soapclient/perfectomobile.xml");
  $mylogin = $mySforceConnection->login(USERNAME,PASSWORD.SECURITY_TOKEN);
  
  $sfObj = new stdClass();
  $data= file_get_contents($path);
  $sfObj->Body = base64_encode($data);
  $sfObj->Name = $filename;
  $sfObj->ParentId = $parent;

  $response = $mySforceConnection->create(array($sfObj), 'Attachment');
  $ids = array();
  print_r($response);
}
$path='ATTACHMENT.txt';
$filename='file.txt';
$parent='500D000001jUEOKIA4';

upload_attachment($filename,$path,$parent);
