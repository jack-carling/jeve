function validateParam(method, value) {
  if (method === 'POST') {
    return { success: false, error: 'Param cannot be present with POST.' };
  }
  if (!this.validType(value, 'objectid')) {
    return { success: false, error: `Param \`${value}\`is not a valid objectid.` };
  }

  return { success: true };
}

async function handleGet(req, res, domain) {
  const { id } = req.params;
  const Model = this.models[domain];
  if (!Model) {
    return res.sendStatus(204);
  }
  if (id) {
    const item = await Model.findOne({ _id: id });
    return res.status(200).json({ _success: true, _item: item });
  }

  let { page = 1, where = {}, sort = '', limit = 10, select = {} } = req.query;
  try {
    if (where && !this.isEmptyObject(where)) {
      where = JSON.parse(where);
    } else {
      where = {};
    }
  } catch (e) {
    return res.status(400).json({ _success: false, _error: 'Query `where` is not valid JSON.' });
  }

  try {
    if (select && !this.isEmptyObject(select)) {
      select = JSON.parse(select);
    } else {
      select = {};
    }
  } catch (e) {
    return res.status(400).json({ _success: false, _error: 'Query `select` is not valid JSON.' });
  }

  if (page && this.validType(page, 'number')) {
    page = Number(page);
  } else {
    return res.status(400).json({ _success: false, _error: 'Query `page` is not valid.' });
  }

  const total = await Model.countDocuments(where);
  const pages = total === 0 ? 1 : Math.ceil(total / limit);
  if (page < 1) {
    return res.status(400).json({
      _success: false,
      _error: `Query \`page\` (${page}) is less than minimum allowed value (1).`,
    });
  } else if (page > pages) {
    return res.status(404).json({
      _success: false,
      _error: `Query \`page\` (${page}) is more than maximum allowed value (${pages}).`,
    });
  }

  const items = await Model.find(where)
    .select(select)
    .sort(sort)
    .skip(limit * (page - 1))
    .limit(limit);

  const meta = {
    total,
    limit,
    page,
    pages,
  };
  res.status(200).json({ _success: true, _items: items, _meta: meta });
}

async function handlePost(req, res, domain) {
  if (!this.models[domain]) {
    return res.sendStatus(204);
  }
  const { body } = req;
  const Model = new this.models[domain](body);
  let issues = [];
  try {
    await Model.save();
  } catch (e) {
    issues = handleMongooseError(e);
  } finally {
    if (issues.length) {
      res.status(400).json({ _success: false, _issues: issues });
    } else {
      res.status(201).json({ _success: true, _item: Model });
    }
  }
}

async function handlePut(req, res, domain) {
  const { id } = req.params;
  if (!id) return res.json({ _success: false, _error: 'Param is missing.' });
  const { body } = req;
  const Model = this.models[domain];
  if (!Model) {
    return res.sendStatus(204);
  }
  let issues = [];
  const original = await Model.findOne({ _id: id });
  if (!original) res.status(404).json({ _success: false, _issues: [`Cannot PUT document \`${id}\` - not found.`] });
  try {
    await original.overwrite({ ...body }, { runValidators: true });
    await original.save();
  } catch (e) {
    issues = handleMongooseError(e);
  } finally {
    if (issues.length) {
      res.status(400).json({ _success: false, _issues: issues });
    } else {
      res.status(200).json({ _success: true, _item: original });
    }
  }
}

async function handlePatch(req, res, domain) {
  const { id } = req.params;
  if (!id) return res.json({ _success: false, _error: 'Param is missing.' });
  const { body } = req;
  const Model = this.models[domain];
  if (!Model) {
    return res.sendStatus(204);
  }
  let issues = [];
  let item = null;
  try {
    item = await Model.findOneAndUpdate({ _id: id }, { ...body }, { runValidators: true, new: true });
    if (!item) res.status(404).json({ _success: false, _issues: [`Cannot PATCH document \`${id}\` - not found.`] });
  } catch (e) {
    issues = handleMongooseError(e);
  } finally {
    if (issues.length) {
      res.status(400).json({ _success: false, _issues: issues });
    } else {
      res.status(200).json({ _success: true, _item: item });
    }
  }
}

async function handleDelete(req, res, domain) {
  const { id } = req.params;
  if (!id) return res.json({ _success: false, _error: 'Param is missing.' });
  const Model = this.models[domain];
  if (!Model) {
    return res.sendStatus(204);
  }
  let issues = [];
  try {
    await Model.findOneAndDelete({ _id: id });
    // if (!item) res.status(404).json({ _success: false, _issues: [`Cannot PATCH document \`${id}\` - not found.`] });
  } catch (e) {
    issues = handleMongooseError(e);
  } finally {
    if (issues.length) {
      res.status(400).json({ _success: false, _issues: issues });
    } else {
      res.sendStatus(204);
    }
  }
}

function handleMongooseError(e) {
  let issues = [];
  if (e.name === 'ValidationError') {
    issues = Object.values(e.errors).map((value) => value.message);
  } else if (e.name === 'CastError') {
    issues.push(`Path \`${e.path}\` value (${e.value}) is not the correct type (${e.kind}).`);
  } else if (e.code === 11000) {
    const key = Object.keys(e.keyPattern)[0];
    issues.push(`Path \`${key}\` value (${e.keyValue[key]}) is not unique.`);
  } else {
    issues.push(e);
  }
  return issues;
}

exports.validateParam = validateParam;
exports.handleGet = handleGet;
exports.handlePost = handlePost;
exports.handlePut = handlePut;
exports.handlePatch = handlePatch;
exports.handleDelete = handleDelete;
