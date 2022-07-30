function validateParam(method, value) {
  if (method === 'POST') {
    return { success: false, message: 'param cannot be present with POST' };
  }
  if (!this.validType(value, 'objectid')) {
    return { success: false, message: 'param is not a valid objectid' };
  }

  return { success: true };
}

exports.validateParam = validateParam;
