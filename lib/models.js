const mongoose = require('mongoose');
const { validType, isEmptyObject } = require('./helpers');

function createModelForName(name) {
  return new Promise((resolve) => {
    if (name in this.models) {
      this.warning(`conflict: ${name} already exist in models`);
      return resolve();
    }

    const schema = this.settings.domain[name].schema;

    const [computedSchema, issues] = generateSchema(schema, name);

    if (issues.length) {
      for (const issue of issues) {
        this.warning(issue);
      }
      this.warning(`failed to create Mongoose schema for ${name}`);
      return resolve();
    }

    const mongooseSchema = new mongoose.Schema(computedSchema, {
      timestamps: {
        createdAt: '_created',
        updatedAt: '_updated',
      },
      versionKey: false,
      collection: name,
    });
    this.models[name] = mongoose.model(name, mongooseSchema);
    this.log(`created model for - ${name}`);
    resolve();
  });
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
    } else if (schema[s] instanceof Array) {
      if (!schema[s].length) {
        issues.push(`path \`${dottedPath}\` is an empty array, use \`{type, 'array', default: []}\` instead.`);
      } else if (schema[s].length !== 1) {
        issues.push(`path \`${dottedPath}\` is defined as an array, should only contain one (1) object.`);
      } else if (!validType(schema[s][0], 'object') || isEmptyObject(schema[s][0])) {
        issues.push(`path \`${dottedPath}\` is defined as an array, should contain an non-empty object.`);
      } else {
        let result;
        [result, issue] = handleObject(schema[s][0], dottedPath);
        computed[s] = [result];
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

function handleObject(schema, dottedPath) {
  let issue = null;
  const obj = {};
  for (const s in schema) {
    if (typeof schema[s] === 'object' && !(schema[s] instanceof Array) && schema[s] !== null) {
      dottedPath += `.${s}`;
      [obj[s], issue] = handleObject(schema[s], dottedPath);
    } else if (schema[s] instanceof Array) {
      if (!schema[s].length) {
        issue = `path \`${dottedPath}\` is an empty array, use \`{type, 'array', default: []}\` instead.`;
      } else if (schema[s].length !== 1) {
        issue = `path \`${dottedPath}\` is defined as an array, should only contain one (1) object.`;
      } else {
        let result;
        [result, issue] = handleObject(schema[s][0], dottedPath);
        obj[s] = [result];
      }
    } else {
      const finalDottedPath = `${dottedPath}.${s}`;
      [obj[s], issue] = handleObjectValue(s, schema[s], finalDottedPath);
    }
    if (issue) break;
  }

  return [obj, issue];
}

function handleObjectValue(key, value, finalDottedPath) {
  const validKeys = ['required', 'type', 'unique'];
  if (!validKeys.includes(key)) {
    if (validateType(value)) return [{ type: typeToMongooseSchemaType(value) }, null];
    return [{}, `path \`${finalDottedPath}\` contains invalid value (${value}).`];
  }
  if (key === 'type') {
    if (validateType(value)) return [typeToMongooseSchemaType(value), null];
    return [{}, `path \`${finalDottedPath}\` contains invalid value (${value}).`];
  } else if (['required', 'unique'].includes(key)) {
    if (value === true || value === false) return [value, null];
    return [{}, `path \`${finalDottedPath}\` contains invalid boolean (${value}).`];
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
