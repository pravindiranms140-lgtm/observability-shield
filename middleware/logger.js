function logger(req, res, next) {
  res.on("finish", () => {
    const prefix = req.id ? "[" + req.id.slice(0, 8) + "]" : "";
    console.log(prefix + " " + req.method + " " + req.path + " " + res.statusCode);
  });
  next();
}
module.exports = logger;
