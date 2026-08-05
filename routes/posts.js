const express = require("express");
const router = express.Router();
const auditWrite = require("../middleware/auditWrite");
const { listPosts, createPost } = require("../controllers/postsController");
router.get("/", listPosts);
router.post("/", auditWrite, createPost);
module.exports = router;
