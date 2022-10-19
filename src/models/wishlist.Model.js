const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId
const wishListSchema = new mongoose.Schema({
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
        }
    }]
}, { timestamps: true })

module.exports = mongoose.model('WishList', wishListSchema)