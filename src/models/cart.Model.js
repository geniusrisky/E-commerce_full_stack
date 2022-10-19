const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId
const cartSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [{
        product: {
            type: ObjectId,
            ref: 'Product'
        },
        quantity: {
            type: Number,
            trim: true,
            default: 0,
            max: 10
        },
        size: {
            type: String,
            trim: true,
            enum: ["3XS", "XXS", "XS", "XS/S", "S", "M", "L", "XL", "XL/XXL", "XXL", "3XL", "4XL", "5XL", "6XL", "7XL", "8XL", "9XL", "10XL", "11XL", "ONESIZE"]
        }
    }]
}, { timestamps: true })

module.exports = mongoose.model('Cart', cartSchema)