function validateParam(method, value) {
  if (method === 'POST') {
    return { success: false, message: 'param cannot be present with POST' };
  }
  if (!this.validType(value, 'objectid')) {
    return { success: false, message: 'param is not a valid objectid' };
  }

  return { success: true };
}

async function handleGet(req, res, domain) {
  const { id } = req.params;
  const Model = this.models[domain];
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
  const { body } = req;
  const Model = new this.models[domain](body);
  let issues = [];
  try {
    await Model.save();
  } catch (e) {
    if (e.name === 'ValidationError') {
      issues = Object.values(e.errors).map((value) => value.message);
    }
  } finally {
    if (issues.length) {
      res.status(400).json({ _success: false, _issues: issues });
    } else {
      res.status(201).json({ _success: true, _item: Model });
    }
  }
}

exports.validateParam = validateParam;
exports.handleGet = handleGet;
exports.handlePost = handlePost;
