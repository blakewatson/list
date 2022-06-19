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
      $this->add_items_handler();
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
    $this->rewrite_list($list);
    $this->echo_list();
    die;
  }

  function add_items_handler() {
    if(!is_array($this->request_json)) {
      $this->error_out("Must send an array of items.");
    }
    $list = $this->json_decode(file_get_contents($_ENV['DATA_FILE']));
    for ($ri = 0; $ri < count($this->request_json); $ri++) {
      $existing_ids = [];
      for ($li = 0; $li < count($list); $li++) {
        if($this->request_json[$ri]?->id === $list[$li]->id) {
          array_push($existing_ids, $this->request_json[$ri]?->id);
        }
      }
      if(count($existing_ids)) {
        $this->error_out(
          'These ids already exist: '.implode(', ', $existing_ids)
        );
      }
      $list[] = $this->request_json[$ri];
    }
    $this->rewrite_list($list);
    $this->echo_list();
    die;
  }

  function set_request_json() {
    $body = file_get_contents('php://input');
    $this->request_json = $this->json_decode($body);

    if(!$this->request_json) {
      $this->error_out("Could not parse JSON in request.");
    }
  }

  function preliminary_checks() {
    if ($_SERVER["REQUEST_METHOD"] != "POST") {
      $this->error_out("You must send a post request.");
    }

    if(!$_SERVER['HTTP_APP_TOKEN'] || !$_ENV['PASSWORD_HASH']) {
      $this->error_out("Missing token or hash.");
    }

    if(!password_verify($_SERVER['HTTP_APP_TOKEN'], $_ENV['PASSWORD_HASH'])) {
      $this->error_out("Invalid token.");
    }
  }

  function json_encode(array $assoc_array) {
    return json_encode($assoc_array, JSON_UNESCAPED_SLASHES);
  }

  function json_decode(string $string) {
    return json_decode($string);
  }

  function echo_list() {
    echo file_get_contents($_ENV['DATA_FILE']);
  }

  function rewrite_list(array $list) {
    file_put_contents($_ENV['DATA_FILE'], $this->json_encode($list));
  }

  function error_out(string $message) {
    echo $this->json_encode([
      "success" => false,
      "error" => $message
    ]);
    die;
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