const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId
const cartSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: 'User',
        required: true
    },
    payment: {
        by: {
            type: String,
            required: true,
            enum: ['COD', 'PAYTM']
        },
        status: {
            type: String,
            required: true,
            enum: ['UNPAID', 'PAID', 'REFUND']
        },
        paymentId: {
            type: String,
            default: null
        },
        txnId: {
            type: String,
            default: null
        },
        date: {
            type: Date,
            default: null
        },
        method: {
            type: String,
            default: null
        }
    },
    price: {
        total_mrp: {
            type: Number,
            required: true,
            default: 0
        },
        total_discount: {
            type: Number,
            required: true,
            default: 0
        },
        delivery: {
            type: Number,
            required: true,
            default: 0
        },
        total: {
            type: Number,
            required: true,
            default: 0
        }
    },
    items: [{
        product: {
            type: ObjectId,
            ref: 'Product'
        },
        price: {
            mrp: {
                type: Number,
                required: true,
                default: 0
            },
            discount: {
                type: Number,
                required: true,
                default: 0
            },
            total: {
                type: Number,
                required: true,
                default: 0
            },
            includeTax: {
                type: Boolean,
                required: true,
                default: true
            }
        }, quantity: {
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
    }],
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
    status: {
        type: String,
        default: 'PENDING',
        enum: ["CANCELLED", "PENDING","CONFORMED","ON_THE_WAY", "DELIVERED", "RETURNED"]
    },
    statusHistory: [{
        title: String,
        date: Date
    }]
}, { timestamps: true })

module.exports = mongoose.model('Order', cartSchema)