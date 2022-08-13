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
  },
};

const jeve = new Jeve(settings);
jeve.run();
