const express = require('express')

const { register, login, me, updateProfile } = require('../controllers/users')
const checkAuth = require('../middlewares/check-auth');
const multer = require('../middlewares/multer');

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.put('/profile', checkAuth, multer, updateProfile);
router.get('/me', checkAuth, me)

module.exports = router