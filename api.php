<?php
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
'addItems' - payload of [ { "name": "Foo" }, ... ]
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