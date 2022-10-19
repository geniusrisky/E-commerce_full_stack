const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        trim: true,
        required: true
    },
    lastName: {
        type: String,
        trim: true,
        required: true
    },
    email: {
        type: String,
        trim: true,
        required: true,
        unique: true
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    phone: {
        type: String,
        trim: true,
        required: true,
        unique: true
    },
    password: {
        type: String,
        trim: true,
        required: true
    },
    address: {
        billing: {
            address: {
                type: String,
                trim: true,
                required: true
            },
            city: {
                type: String,
                trim: true,
                required: true
            },
            state: {
                type: String,
                trim: true,
                required: true
            },
            pincode: {
                type: Number,
                trim: true,
                required: true
            },
        },
        shipping: {
            address: {
                type: String,
                trim: true,
                required: true
            },
            city: {
                type: String,
                trim: true,
                required: true
            },
            state: {
                type: String,
                trim: true,
                required: true
            },
            pincode: {
                type: Number,
                trim: true,
                required: true
            },
        }
    },
    gender: {
        type: String,
        enum: ["male", "female","others"]
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('User', userSchema);