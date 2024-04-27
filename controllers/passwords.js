const fs = require('fs').promises
const Password = require('../models/Password')
const cloudinary = require('../utilities/cloudinary-config')
const { passwordValidator } = require('../utilities/validators')

const getAllPasswords = async (req, res) => {
    try {
        const passwords = await Password.find({ user: req.user._id }).populate('user', '-password')
        res.status(200).json(passwords)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const getOnePassword = async (req, res) => {
    try {
        const password = await Password.findById(req.params.id).populate('user', '-password')
        if (password) {
            res.status(200).json(password)
        } else {
            res.status(404).json({ error: "Password not found" })
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const createPassword = async (req, res) => {
    try {

        // The multer middleware creates for us a temporary file inside the specified folder 'uploads-tmp'
        if (!req.file) {
            return res.status(400).json({ error: "A photo file is required" })
        }

        const validationResult = passwordValidator.validate(req.body, { abortEarly: false })
        if (validationResult.error) {
            res.status(400).json(validationResult)
        } else {
            // Upload the file from the folder 'uploads-tmp' to cloudinary
            const upload = await cloudinary.uploader.upload(req.file.path)

            const password = new Password({
                website: req.body.website,
                logoPath: upload.secure_url, // from cloudinary
                username: req.body.username,
                value: req.body.value,
                user: req.user._id
            })
            let savedPassword = await password.save()
            req.user.password = undefined
            req.user.__v = undefined
            savedPassword.user = req.user
            res.status(201).json({
                message: "Password created successfully",
                password: savedPassword
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

const updatePassword = async (req, res) => {
    try {
        const passwordToUpdateId = req.params.id
        const validationResult = passwordValidator.validate(req.body, { abortEarly: false })
        if (validationResult.error) {
            res.status(400).json(validationResult)
        } else {

            if (req.file) {
                // Upload the file from the folder 'uploads-tmp' to cloudinary
                const upload = await cloudinary.uploader.upload(req.file.path)
                req.body.logoPath = upload.secure_url

                const password = await Password.findById(passwordToUpdateId)

                if (password.logoPath) {
                    // Extract public ID from secure URL
                    // Assuming the URL is in format: https://res.cloudinary.com/<cloud_name>/image/upload/<public_id>.<format>
                    const photoPublicId = password.logoPath.split('/').pop().split('.')[0];

                    await cloudinary.uploader.destroy(photoPublicId);
                }
            }

            const password = await Password.findOneAndUpdate({ _id: passwordToUpdateId, user: req.user._id }, { $set: req.body }, { new: true, populate: "user" })
            if (!password) {
                res.status(404).json({ error: "Password not found" })
            } else {
                res.status(200).json({
                    message: "Password updated successfully",
                    password
                })
            }
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const deletePassword = async (req, res) => {
    try {
        const passwordToDeleteId = req.params.id
        const deletedPassword = await Password.findOneAndDelete({ _id: passwordToDeleteId, user: req.user._id })
        if (deletedPassword) {
            if (deletedPassword.logoPath) {
                // Extract public ID from secure URL
                const photoPublicId = deletedPassword.logoPath.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(photoPublicId);
            }

            res.json({
                message: "Password deleted successfully",
                password: {
                    _id: passwordToDeleteId
                }
            })
        } else {
            res.status(404).json({ error: "Password not found" })
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

module.exports = {
    getAllPasswords,
    getOnePassword,
    createPassword,
    updatePassword,
    deletePassword
}
