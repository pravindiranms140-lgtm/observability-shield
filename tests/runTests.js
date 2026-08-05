const assert = require('assert');
const posts = require('../controllers/postsController');
const users = require('../controllers/usersController');

assert.strictEqual(typeof posts.listPosts, 'function');
assert.strictEqual(typeof posts.createPost, 'function');
assert.strictEqual(typeof users.listUsers, 'function');

console.log('All tests passed');
