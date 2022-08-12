# Jeve

The quick way to REST. Jeve is a JavaScript framework for effortlessly building an API. Powered by Express and Mongoose for native MongoDB support.

## Install

```
$ npm install jeve
```

## Quick start

Jeve runs on port 5000 and uses `mongodb://localhost` as the default MongoDB connection string URI. Presuming that the database is running locally on the default port the following code is the bare minimum to get the API up and running:

```javascript
const Jeve = require('jeve');

const settings = {
  domain: {
    people: {
      schema: {},
    },
  },
};

const jeve = new Jeve(settings);
jeve.run();
```

That's all it takes for the API to go live with an endpoint. We can now try to **GET** `/people`.

```
$ curl -i http://localhost:5000/people
HTTP/1.1 200 OK
```

## Settings

In order to change the default port and MongoDB URI simply add the keys to the root of the `settings` object. They can also be added in a `.env` file. In case values exist both in `.env` and the root, the values in the root object will be superseded by dotenv.

| key      | value  | default               | dotenv   |
| -------- | ------ | --------------------- | -------- |
| port     | number | `5000`                | PORT     |
| database | string | `mongodb://localhost` | DATABASE |

If we would want to run Jeve on port 5100 instead for example:

```javascript
const settings = {
  domain: {
    people: {},
  },
  port: 5100,
};
```

## Schema

Jeve will automatically create Mongoose Models based on a `schema` object under each domain. Let's add name and age to the people domain as types string/number.

```javascript
const settings = {
  domain: {
    people: {
      schema: {
        name: 'string',
        age: 'number',
      },
    },
  },
};
```

Types can be added direct as a string:

```javascript
name: 'string';
```

Or as an object with the `type` key:

```javascript
name: {
  type: 'string',
}
```

The latter is needed if other validations like `required` or `unique` are going to be added. In our example, name is a required field.

```javascript
name: {
  type: 'string',
  required: true,
}
```

The following types are supported:

- string
- number
- date
- boolean
- objectid
- array

We now have a `settings` object which looks like this:

```javascript
const settings = {
  domain: {
    people: {
      schema: {
        name: {
          type: 'string',
          required: true,
        },
        age: 'number',
      },
    },
  },
};
```

## Resource methods

Our endpoint `/people` allows HTTP method **GET** by default. In order to save a person to the database, we need to add the **POST** method to our domain resource.

Resource methods are added as strings in an array on the same root as our `schema` object.

The following HTTP methods are supported:

- GET
- POST
- PUT
- PATCH
- DELETE

Before adding this to our settings, let's try to **POST**.

```
$ curl -i -X POST http://localhost:5000/people
HTTP/1.1 404 Not Found
```

As expected, we get a 404 status code response. Add the following to the `people` object and try again:

```javascript
people: {
  resourceMethods: ['GET', 'POST'],
  schema: { ... },
}
```

```
$ curl -i -X POST http://localhost:5000/people
HTTP/1.1 400 Bad Request
```

This time we get a 400 status code response instead along with a json error message since we sent an empty body request.

```json
{
  "_success": false,
  "_issues": ["Path `name` is required."]
}
```

If we instead send a proper **POST** application/json with a name:

```
curl -i -d '{"name":"James Smith"}' -H "Content-Type: application/json" -X POST http://localhost:5000/people
HTTP/1.1 201 Created
```

Now our first successful **POST** was made!

```json
{
  "_success": true,
  "_item": {
    "_id": "62eebccf0c5aa6efc2d8ceed",
    "name": "James Smith",
    "_created": "2022-08-06T19:11:11.627Z",
    "_updated": "2022-08-06T19:11:11.627Z"
  }
}
```

By default only **GET** methods are allowed unless an array of `resourceMethods` have been defined. If however, you'd like an endpoint only serving **POST** requests, simply add that as the single value to the array.

## Params & Queries

If we make a new request to `/people` we now get the everything that's stored in the database.

```
$ curl -i http://localhost:5000/people
HTTP/1.1 200 OK
```

```json
{
  "_success": true,
  "_items": [
    {
      "_id": "62eebccf0c5aa6efc2d8ceed",
      "name": "James Smith",
      "_created": "2022-08-06T19:11:11.627Z",
      "_updated": "2022-08-06T19:11:11.627Z"
    }
  ],
  "_meta": {
    "total": 1,
    "limit": 10,
    "page": 1,
    "pages": 1
  }
}
```

In our case the `_items` array only contains one (1) object, the one we just added. Responses are paginated by default and the `_meta` object contains information about the specific endpoint.

| \_meta |  description                              |
| ------ | ----------------------------------------- |
| total  | The total number of documents found       |
| limit  | Max results per page                      |
| page   | The page which the cursor is currently on |
| pages  | The total number of pages                 |

If we imagined that we had 12 documents in the `/people` collection the `_meta` response would look something like this:

```json
{
  "_success": true,
  "_items": [
    /* ... */
  ],
  "_meta": {
    "total": 12,
    "limit": 10,
    "page": 1,
    "pages": 2
  }
}
```

Since we know there's a second page, we can simply do a new **GET** with the page query:

```
$ curl -i "http://localhost:5000/people?page=2"
HTTP/1.1 200 OK
```

If we wanted more results per page:

```
$ curl -i "http://localhost:5000/people?limit=20"
HTTP/1.1 200 OK
```

If we're looking for a specific document the `_id` of that document needs to follow as a parameter, for example `/people/62eebccf0c5aa6efc2d8ceed`. This is the way **PATCH**, **PUT** and **DELETE** knows what document to handle as well.

Other valid queries are `sort`, `where` and `select`.

If we wanted our result to be sorted by their creation date we could send the `/people?sort=_created` query as an example. Or if we wanted to reverse the search, simply add `-` before the key value: `/people?sort=-_created`.

The last two parameters accepts json-input, `where` will filter the request. If for example we only wanted a list of people older than 18 we could use the following query: `/people?where={"age":{"$gte": 18}}`. `select` will filter the documents, as in including specific fields or excluding others. If we for example weren't interested in the ages, we could exclude that field by specifying a `0`: `/people?select={"age":0}`.
