const mongoose = require('mongoose');

function createModelForName(name) {
  if (name in this.models) {
    return this.warning(`conflict: ${name} already exist in models`);
  }

  const schema = this.settings.domain[name].schema;
  if (this.isEmptyObject(schema)) {
    return this.warning(`schema for ${name} is empty`);
  }

  const [computedSchema, issues] = generateSchema(schema, name);

  if (issues.length) {
    for (const issue of issues) {
      this.warning(issue);
    }
  }

  const mongooseSchema = new mongoose.Schema(computedSchema, {
    timestamps: {
      createdAt: '_created',
      updatedAt: '_updated',
    },
    versionKey: false,
  });
  this.models[name] = mongoose.model(name, mongooseSchema);
}

function generateSchema(schema, name) {
  const computed = {};
  const issues = [];

  for (const s in schema) {
    if (typeof schema[s] === 'object' && !(schema[s] instanceof Array) && schema[s] !== null) {
      const obj = {};
      for (const c in schema[s]) {
        const validKeys = ['required', 'type'];
        if (!validKeys.includes(c)) {
          issues.push(`Path \`${name}.${s}\` contains invalid key (${c}).`);
          continue;
        }
        if (c === 'type') {
          obj[c] = typeToMongooseSchemaType(schema[s][c]);
        } else {
          obj[c] = schema[s][c];
        }
      }
      computed[s] = obj;
    } else {
      if (validateType(schema[s])) computed[s] = typeToMongooseSchemaType(schema[s]);
    }
  }

  return [computed, issues];
}

function validateType(type) {
  type = type.toLowerCase();
  const validTypes = ['string', 'number', 'date', 'boolean', 'objectid', 'array'];
  if (validTypes.includes(type)) return true;
  return false;
}

function typeToMongooseSchemaType(type) {
  type = type.toLowerCase();
  switch (type) {
    case 'string':
      return String;
    case 'number':
      return Number;
    case 'date':
      return Date;
    case 'boolean':
      return Boolean;
    case 'objectid':
      return mongoose.Types.ObjectId;
    case 'array':
      return Array;
    default:
      return null;
  }
}

exports.createModelForName = createModelForName;
