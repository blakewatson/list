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
      "payload": { "name": "Foo"... }
    }
  ]
}

Expect one or more requests and process them in order.

Need to accept these request types:

'getItems' - no payload
'addItem' - payload of { id: "blah", "name": "Foo" }
'editItem' - payload of { id: "blah", "name": "Foo", "done": true }
'removeItem' - payload of id
'removeAll' - no payload
'uncheckAll' - no payload

Response should be JSON in the form of:

{
  "success": true,
  "data": {}, // the full up-to-date items list
}

OR...

{
  "data": [{ id: "blah", "name": "Foo", "done": true }, ...],
  "errors": ["Error message", "Error message 2" ...]
}

*/

class BMWListApp {
  // the literal http request
  public $request;
  public $data_file_list;
  public $errors = [];

  function run() {
    
    $this->preliminary_checks();

    // errors out on failure
    $this->setup();

    foreach($this->request->requests as $request) {
      $this->handle_request($request);
    }

    // todo: don't rewrite unless list actually changed
    $this->rewrite_list();

    echo $this->json_encode([
      'data' => $this->data_file_list,
      'errors' => $this->errors
    ]);
    die;
  }

  function handle_request($request) {
    switch ($request->requestType) {
      case 'getItems':
        // do nothing
        break;
      case 'removeAll':
        $this->handle_remove_all();
        break;
      case 'uncheckAll':
        $this->handle_uncheck_all();
        break;
      case 'addItem':
        $this->handle_add_item($request->payload);
        break;
      case 'editItem':
        // sleep(10);
        // die;
        $this->handle_edit_item($request->payload);
        break;
      case 'removeItem':
        $this->handle_remove_item($request->payload);
        break;
    }
  }

  function handle_remove_all() {
    $this->data_file_list = [];
  }

  function handle_uncheck_all() {
    for ($i = 0; $i < count($this->data_file_list); $i++) {
      $this->data_file_list[$i]->done = false;
    }
  }

  function handle_add_item($payload) {
    for ($li = 0; $li < count($this->data_file_list); $li++) {
      if($payload->id === $this->data_file_list[$li]->id) {
        $this->add_error(
          'Could not add item because id '.$payload->id.' is already taken'
        );
        return;
      }
    }
    $this->data_file_list[] = $payload;
  }

  function handle_edit_item($payload) {
    $found_item = false;
    for ($li = 0; $li < count($this->data_file_list); $li++) {
      if($payload->id === $this->data_file_list[$li]->id) {
        $found_item = true;
        $this->data_file_list[$li]->name = $payload->name;
        $this->data_file_list[$li]->done = $payload->done;
      }
    }
    if(!$found_item)
      $this->add_error('Could not edit item with id of '.$payload->id.' because no item with that id was found.');
  }

  function handle_remove_item($payload) {
    $idx = null;
    for ($li = 0; $li < count($this->data_file_list); $li++) {
      if($payload === $this->data_file_list[$li]->id) {
        $idx = $li;
      }
    }
    if($idx === null) {
      $this->add_error('Could not remove item with id of '.$payload.' because no itemdwith that id was found.');
      return;
    }
      
    array_splice($this->data_file_list, $idx, 1);
  }

  function setup() {
    $body = file_get_contents('php://input');
    $this->request = $this->json_decode($body);
    $data_file_list_json = file_get_contents($_ENV['DATA_FILE']);
    $this->data_file_list = $this->json_decode($data_file_list_json);
    if(!$this->request)
      $this->error_out('Missing request body.');
    if(!is_array($this->data_file_list))
      $this->error_out('Cannot find data file.');
    if(!$this->request->requests)
      $this->error_out('Missing requests field.');
    if(!is_array($this->request->requests))
      $this->error_out('Requests field not in form of an array.');
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

  function rewrite_list() {
    file_put_contents(
      $_ENV['DATA_FILE'],
      $this->json_encode(
        $this->data_file_list
      )
    );
  }

  function error_out(string $message) {
    echo $this->json_encode([
      "data" => null,
      "errors" => [$message]
    ]);
    die;
  }

  function add_error(string $message) {
    $this->errors[] = $message;
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

$bmw_list = new BMWListApp();
$bmw_list->run();