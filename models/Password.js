const mongoose = require('mongoose');

const passwordSchema = new mongoose.Schema({
    website: {
        type: String,
        required: true
    },
    logoPath: String,
    username: {
        type: String,
        required: true
    },
    value: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
})

const Password = mongoose.model('Password', passwordSchema);

module.exports = Password;
