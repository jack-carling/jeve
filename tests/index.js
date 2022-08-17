const Jeve = require('../lib');

const settings = {
  domain: {
    animals: {},
    drinks: { schema: {} },
    people: {
      resourceMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      schema: {
        name: { type: 'string', required: true },
        age: 'number',
      },
    },
    adults: {
      preHandler: isAdult,
      resourceMethods: ['DELETE', 'POST', 'GET'],
      schema: {
        age: {
          type: 'number',
          required: true,
        },
        isAdult: 'boolean',
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
