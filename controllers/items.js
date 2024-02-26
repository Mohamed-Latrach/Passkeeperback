const fs = require('fs').promises
const Item = require('../models/Item')
const cloudinary = require('../utilities/cloudinary-config')
const { itemValidator } = require('../utilities/validators')

const getAllItems = async (req, res) => {
    try {
        const items = await Item.find().populate('user', 'firstName lastName email')
        res.status(200).json(items)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const getOneItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id).populate('user', 'firstName lastName email')
        if (item) {
            res.status(200).json(item)
        } else {
            res.status(404).json({ error: "Item not found" })
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const createItem = async (req, res) => {
    try {

        // The multer middleware creates for us a temporary file inside the specified folder 'uploads-tmp'
        if (!req.file) {
            return res.status(400).json({ error: "A photo file is required" })
        }

        // Upload the file from the folder 'uploads-tmp' to cloudinary
        const upload = await cloudinary.uploader.upload(req.file.path)

        const validationResult = itemValidator.validate(req.body, { abortEarly: false })
        if (validationResult.error) {
            res.status(400).json(validationResult)
        } else {
            const item = new Item({
                title: req.body.title,
                description: req.body.description,
                photo: upload.secure_url, // from cloudinary
                price: req.body.price,
                user: req.user._id
            })
            let savedItem = await item.save()
            req.user.password = undefined
            req.user.__v = undefined
            savedItem.user = req.user
            res.status(201).json({
                message: "Item created successfully",
                item: savedItem
            })
        }    
    } catch (error) {
        res.status(500).json({ error: error.message })
    } finally { // Code block to be executed regardless of the try result
        if (req.file) {
            fs.unlink(req.file.path) // Delete the temporary file
        }
    }
}

const updateItem = async (req, res) => {
    try {
        const itemToUpdateId = req.params.id
        const validationResult = itemValidator.validate(req.body, { abortEarly: false })
        if (validationResult.error) {
            res.status(400).json(validationResult)
        } else {
            const item = await Item.findOneAndUpdate({ _id: itemToUpdateId, user: req.user._id }, { $set: req.body }, { new: true, populate: "user" })
            if (!item) {
                res.status(404).json({error: "Item not found"})
            } else {
                res.status(200).json({
                    message: "Item updated successfully",
                    item
                })
            }
        }     
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const deleteItem = async (req, res) => {
    try {
        const itemToDeleteId = req.params.id
        const result = await Item.deleteOne({ _id: itemToDeleteId, user: req.user._id })
        if (result.deletedCount === 1) {
            res.json({
                message: "Item deleted successfully",
                item: {
                    _id: itemToDeleteId
                }
            })
        } else {
            res.status(404).json({error: "Item not found"})
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

module.exports = {
    getAllItems,
    getOneItem,
    createItem,
    updateItem,
    deleteItem
}
