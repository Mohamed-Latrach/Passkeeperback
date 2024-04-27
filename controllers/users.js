const fs = require('fs').promises;
const cloudinary = require('../utilities/cloudinary-config')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const { registerValidator, loginValidator, profileValidator } = require('../utilities/validators');

const register = async (req, res) => {
    try {
        const validationResult = registerValidator.validate(req.body, { abortEarly: false });
        if (validationResult.error) {
            res.status(400).json(validationResult);
        } else {
            const { firstName, lastName, email, password } = req.body;
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                res.status(401).json({
                    error: 'An account with this email exists already'
                });
                return;
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            await new User({
                firstName,
                lastName,
                email,
                password: hashedPassword
            }).save();
            res.status(201).json({
                message: 'Account created successfully'
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const login = async (req, res) => {
    try {
        const validationResult = loginValidator.validate(req.body, { abortEarly: false });
        if (validationResult.error) {
            res.status(400).json(validationResult);
        } else {
            const { email, password } = req.body;
            const user = await User.findOne({ email });
            if (!user) {
                res.status(401).json({
                    error: 'Wrong email and/or password'
                });
                return;
            }
            const passwordsMatch = await bcrypt.compare(password, user.password)
            if (!passwordsMatch) {
                res.status(401).json({
                    error: 'Wrong email and/or password'
                });
                return;
            }
            user.password = undefined;
            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
            res.status(200).json({
                message: `Welcome ${user.firstName}`,
                user,
                token
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const me = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const validationResult = profileValidator.validate(req.body, { abortEarly: false })
        if (validationResult.error) {
            res.status(400).json(validationResult)
        } else {

            if (req.file) {
                // Upload the file from the folder 'uploads-tmp' to cloudinary
                const upload = await cloudinary.uploader.upload(req.file.path)
                req.body.photoPath = upload.secure_url

                const user = await User.findById(userId)

                if (user.photoPath) {
                    // Extract public ID from secure URL
                    // Assuming the URL is in format: https://res.cloudinary.com/<cloud_name>/image/upload/<public_id>.<format>
                    const photoPublicId = user.photoPath.split('/').pop().split('.')[0];

                    await cloudinary.uploader.destroy(photoPublicId);
                }
            }

            const user = await User.findOneAndUpdate({ _id: userId }, { $set: req.body }, { new: true })
            if (!user) {
                res.status(404).json({ error: "User not found" })
            } else {
                res.status(200).json({
                    message: "User profile updated successfully",
                    user
                })
            }
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    } finally { // Code block to be executed regardless of the try result
        if (req.file) {
            fs.unlink(req.file.path) // Delete the temporary file
        }
    }
}

module.exports = {
    register,
    login,
    updateProfile,
    me
}