const Jeve = require('../lib');

const settings = {
  domain: {
    products: {},
    users: { schema: {} },
    people: {
      preHandler: isAdult,
      resourceMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      schema: {
        name: { type: 'string', required: true },
        age: 'number',
        isAdult: 'boolean',
      },
    },
    posts: {
      schema: {
        post: {
          type: 'string',
          header: {},
        },
      },
    },
    comments: {
      resourceMethods: ['GET', 'POST'],
      schema: {
        user: 'objectid',
        content: {
          header: { type: 'string', required: true, unique: true, minLength: 2, maxLength: 20 },
          body: { type: 'string', required: true },
          length: { type: 'number', required: true, min: 6, max: 12 },
        },
        other: {
          type: 'object',
          default: {},
        },
        posted: 'date',
        firstComment: 'boolean',
      },
    },
  },
};

function isAdult(req, res, next) {
  if (req.method === 'POST') {
    const age = req.body?.age;
    if (age) req.body.isAdult = age >= 18;
  }
  next();
}

const jeve = new Jeve(settings);
jeve.run();

exports.jeve = jeve;
