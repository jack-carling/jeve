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
    this.warning(`failed to create Mongoose schema for ${name}`);
    return;
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
  let issue = '';

  for (const s in schema) {
    let dottedPath = `${name}.schema.${s}`;
    if (typeof schema[s] === 'object' && !(schema[s] instanceof Array) && schema[s] !== null) {
      [computed[s], issue] = handleObject(schema[s], dottedPath);
      if (issue) {
        issues.push(issue);
        issue = null;
      }
    } else {
      [computed[s], issue] = handleObjectValue(s, schema[s], dottedPath);
      if (issue) {
        issues.push(issue);
        issue = null;
      }
    }
  }

  return [computed, issues];
}

function handleObject(schema, dottedPath, obj = {}, issues = []) {
  let issue = null;
  for (const s in schema) {
    if (typeof schema[s] === 'object' && !(schema[s] instanceof Array) && schema[s] !== null) {
      dottedPath += `.${s}`;
      [obj[s], issue] = handleObject(schema[s], dottedPath);
    } else {
      const finalDottedPath = `${dottedPath}.${s}`;
      [obj[s], issue] = handleObjectValue(s, schema[s], finalDottedPath);
    }
  }

  return [obj, issue];
}

function handleObjectValue(key, value, finalDottedPath) {
  const validKeys = ['required', 'type'];
  if (!validKeys.includes(key)) {
    if (validateType(value)) return [{ type: typeToMongooseSchemaType(value) }, null];
    return [{}, `path \`${finalDottedPath}\` contains invalid value (${value}).`];
  }
  if (key === 'type') {
    if (validateType(value)) return [typeToMongooseSchemaType(value), null];
    return [{}, `path \`${finalDottedPath}\` contains invalid value (${value}).`];
  } else {
    return [value, null];
  }
}

function validateType(type) {
  if (typeof type !== 'string') return false;
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
