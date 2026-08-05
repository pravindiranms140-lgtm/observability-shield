function listUsers(req, res) {
  res.json([{ id: 1, name: "Sanjay" }]);
}
module.exports = { listUsers };
