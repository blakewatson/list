<?php
require __DIR__ . '/vendor/autoload.php';
// https://github.com/vlucas/phpdotenv
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

/*

Use .env file to get:

1. path to data.json file
2. password hash (we'll pre-generate this hash)

Requests will be POST requests with a JSON body in the form of:

{
  "requests": [
    {
      "requestType": "addItems",
      "payload": [ { "name": "Foo" }, ... ]
    }
  ]
}

Expect one or more requests and process them in order.

Need to accept these request types:

'getItems' - no payload
'addItems' - payload of [ { "id": "blah", "name": "Foo" }, ... ]
'editItems' - payload of [ { id: "blah", "name": "Foo", "done": true }, ... ]
'removeItems' - payload of [ "idToRemove", "anotherIdToRemove", ... ]
'removeAll' - no payload
'uncheckAll' - no payload

Response should be JSON in the form of:

{
  "success": true,
  "data": {}, // the full up-to-date items list
}

OR...

{
  "success": false,
  "error": "Error message"
}

*/
class BMWList {

  public $request_json = null;

  function run() {
    
    $this->preliminary_checks();

    //'getItems' - no payload
    if(isset($_REQUEST['getItems'])) {
      $this->get_items_handler();
    }

    //'removeAll' - no payload
    if(isset($_REQUEST['removeAll'])) {
      $this->remove_all_handler();
    }

    //'uncheckAll' - no payload
    if(isset($_REQUEST['uncheckAll'])) {
      $this->uncheck_all_handler();
    };

    // throws error on failure
    $this->set_request_json();

    //'addItems' - payload of [ { "id": "blah", "name": "Foo" }, ... ]
    if(isset($_REQUEST['addItems'])) {

    }
  }

  function get_items_handler() {
    echo file_get_contents($_ENV['DATA_FILE']);
    die;
  }

  function remove_all_handler() {
    $list = $this->json_encode([]);
    file_put_contents($_ENV['DATA_FILE'], $list);
    echo file_get_contents($_ENV['DATA_FILE']);
    die;
  }

  function uncheck_all_handler() {
    $list = $this->json_decode(file_get_contents($_ENV['DATA_FILE']));
    for ($i = 0; $i < count($list); $i++) {
      $list[$i]->done = false;
    }
    file_put_contents($_ENV['DATA_FILE'], $this->json_encode($list));
    echo file_get_contents($_ENV['DATA_FILE']);
    die;
  }

  function set_request_json() {
    $body = file_get_contents('php://input');
    $this->request_json = $this->json_decode($body);

    if(!$this->request_json) {
      echo $this->json_encode([
        "success" => false,
        "error" => "Could not parse JSON in request."
      ]);
      die;
    }
  }

  function preliminary_checks() {
    if ($_SERVER["REQUEST_METHOD"] != "POST") {
      echo $this->json_encode([
        "success" => false,
        "error" => "You must send a post request."
      ]);
      die;
    }

    if(!$_SERVER['HTTP_APP_TOKEN'] || !$_ENV['PASSWORD_HASH']) {
      echo $this->json_encode([
        "success" => false,
        "error" => "Missing token or hash."
      ]);
      die;
    }

    if(!password_verify($_SERVER['HTTP_APP_TOKEN'], $_ENV['PASSWORD_HASH'])) {
      echo $this->json_encode([
        "success" => false,
        "error" => "Invalid token."
      ]);
      die;
    }
  }

  function json_encode(array $assoc_array) {
    return json_encode($assoc_array, JSON_UNESCAPED_SLASHES);
  }

  function json_decode(string $string) {
    return json_decode($string);
  }

  function dd(mixed $var) {
    var_dump($var);
    die;
  }

  function ddjson(array $var) {
    echo $this->json_encode($var);
    die;
  }
}

$bmw_list = new BMWList();
$bmw_list->run();