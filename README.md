<p align="center"><img src="https://user-images.githubusercontent.com/72305598/184533504-d38cfa2d-97b0-4dd1-95a2-d4a2a2dfb576.png" alt="Jeve" /></p>

<p align="center">
<img src="https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2Fjack-carling%2Fjeve%2Fbadge%3Fref%3Dmain&style=flat" />
<img src="https://img.shields.io/npm/dt/jeve" />
<img src="https://img.shields.io/npm/v/jeve" />
<img src="https://img.shields.io/npm/l/jeve" />
</p>
<br />

Jeve is a JavaScript framework for effortlessly building an API with a [self-written documentation](#self-written-documentation). Powered by [Express](https://expressjs.com/) and [Mongoose](https://mongoosejs.com/) for native [MongoDB](https://www.mongodb.com/) support. Inspired by [PyEve](https://python-eve.org/) for Python.

## Table of contents

- [Install](#install)
- [Quick start](#quick-start)
- [Settings](#settings)
- [Schema](#schema)
- [Resource methods](#resource-methods)
- [Params & queries](#params--queries)
- [Middleware](#middleware)
- [Custom routes](#custom-routes)
- [Accessing models](#accessing-models)
- [Self-written documentation](#self-written-documentation)

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
    people: {},
  },
};

const jeve = new Jeve(settings);
jeve.run();
```

That's all it takes for the API to go live with an endpoint. We can now try to **GET** `/people`.

```
$ curl -i http://localhost:5000/people
HTTP/1.1 204 No Content
```

We're live but the endpoint returns no content since we haven't set up a schema. More about that later.

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

Types can be written directly as a string:

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

```javascript
{
  "_success": false,
  "_issues": [
    {
      "name": "required field"
    }
  ]
}
```

If we instead send a proper **POST** application/json with a name:

```
curl -i -d '{"name":"James Smith"}' -H "Content-Type: application/json" -X POST http://localhost:5000/people
HTTP/1.1 201 Created
```

Now our first successful **POST** was made!

```javascript
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

## Params & queries

If we make a new **GET** request to `/people`, we now get everything that's stored in the database.

```
$ curl -i http://localhost:5000/people
HTTP/1.1 200 OK
```

```javascript
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

```javascript
{
  "_success": true,
  "_items": [ /* ... */ ],
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

The last two parameters accepts json-input, `where` will filter the request. If for example we only wanted a list of people older than 18 we could use the following query: `/people?where={"age":{"$gte": 18}}`. `select` will filter the documents, as in including specific fields or excluding others. If we for example weren't interested in the ages, we could exclude that field by specifying the key along with a `0`: `/people?select={"age":0}`.

## Middleware

Each domain accepts a `preHandler` function which will run before the request. Use cases range from authorization to catching data and manipulating the body. As an example, let's imagine we had a `boolean` value for the field `isAdult` in our schema. We're not sending this value in our request, but we want our middleware to catch it.

```javascript
{ /* ... */
  people: {
    resourceMethods: ['GET', 'POST'],
    schema: {
      age: 'number',
      isAdult: 'boolean',
    },
    preHandler: checkIfAdult,
  }
}
```

In our middleware function `checkIfAdult`, we would simply add the value to it. Don't forget to call with `next()`...

```javascript
function checkIfAdult(req, res, next) {
  const age = req.body?.age;
  if (age) req.body.isAdult = age >= 18;
  next();
}
```

## Custom routes

Jeve supports custom routes:

| method | function        |
| ------ | --------------- |
| GET    | `jeve.get()`    |
| POST   | `jeve.post()`   |
| PUT    | `jeve.put()`    |
| PATCH  | `jeve.patch()`  |
| DELETE | `jeve.delete()` |

A simple example of a `/greeting` route that returns the text `Hello World!`:

```javascript
jeve.get('/greeting', (req, res) => {
  res.send('Hello World!');
});
```

If `greeting` exists in our `domain` object, the custom route will be skipped and not initialized due to conflict and a message will be shown in the console. However, if the path is deeper, for example `/greeting/swedish`, the custom route will be created.

## Accessing Models

Every model that's dynamically created by Jeve is accessible from the `jeve.model()` function. If we for example wanted to access a model from a custom route and use any native Mongoose function with it:

```javascript
jeve.get('/greeting/:id', async (req, res) => {
  const { id } = req.params;
  const person = await jeve.model('people').findOne({ _id: id });
  res.send(`Hello ${person.name}`);
});
```

## Self-written documentation

Jeve will dynamically create it's own documentation and the UI is accessible at `/docs` in the browser. The documentation contains all available routes in the `settings` object and will show which resource methods they're accessible by. A basic view of the schema is available which will be improved upon in future versions of Jeve.
