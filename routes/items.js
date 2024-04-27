const express = require('express');

const { getAllItems, getOneItem, createItem, updateItem, deleteItem } = require('../controllers/items');
const checkAuth = require('../middlewares/check-auth');
const multer = require('../middlewares/multer');

const router = express.Router();

router.get('/', getAllItems);
router.get('/:id', getOneItem);
router.post('/', checkAuth, multer, createItem);
router.put('/:id', checkAuth, multer, updateItem);
router.delete('/:id', checkAuth, deleteItem);

module.exports = router;