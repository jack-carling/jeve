const Jeve = require('../lib');

const settings = {
  domain: {
    animals: {},
    drinks: { schema: {} },
    people: {
      resourceMethods: ['GET', 'POST'],
      schema: {
        name: 'string',
      },
    },
  },
};

const jeve = new Jeve(settings);
jeve.run();
