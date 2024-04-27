const express = require('express');

const { getAllPasswords, getOnePassword, createPassword, updatePassword, deletePassword} = require('../controllers/passwords');
const checkAuth = require('../middlewares/check-auth');
const multer = require('../middlewares/multer');

const router = express.Router();

router.get('/', checkAuth, getAllPasswords);
router.get('/:id', checkAuth, getOnePassword);
router.post('/', checkAuth, multer, createPassword);
router.put('/:id', checkAuth, multer, updatePassword);
router.delete('/:id', checkAuth, deletePassword);

module.exports = router;