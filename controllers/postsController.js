function listPosts(req, res) {
  res.json([{ id: 1, title: "Hello World" }]);
}
function createPost(req, res) {
  res.status(201).json({ id: 2, title: req.body.title });
}
module.exports = { listPosts, createPost };
