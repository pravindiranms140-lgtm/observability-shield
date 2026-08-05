function auditWrite(req, res, next) {
  const prefix = req.id ? "[" + req.id.slice(0, 8) + "]" : "";
  console.log(prefix + " AUDIT: " + req.method + " " + req.path);
  next();
}
module.exports = auditWrite;
