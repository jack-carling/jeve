function handleRouteParamError(res, domain, value) {
  const message = `/${value} is not a valid param on resource /${domain}`;
  res.status(400).json({ _success: false, _message: message });
}

function handleRouteParamSuccess(res, domain, value) {
  res.json({ _success: true });
}

exports.handleRouteParamError = handleRouteParamError;
exports.handleRouteParamSuccess = handleRouteParamSuccess;
