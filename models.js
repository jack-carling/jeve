const mongoose = require('mongoose');

function createModelForName(name) {
  if (name in this.models) {
    return this.warning(`conflict: ${name} already exist in models`);
  }

  const schema = this.settings.domain[name].schema;
  if (this.isEmptyObject(schema)) {
    return this.warning(`schema for ${name} is empty`);
  }

  const mongooseSchema = new mongoose.Schema(schema, {
    timestamps: {
      createdAt: '_created',
      updatedAt: '_updated',
    },
    versionKey: false,
  });
  this.models[name] = mongoose.model(name, mongooseSchema);
}

exports.createModelForName = createModelForName;
