const mongoose = require('mongoose')
const objectId = mongoose.Schema.Types.ObjectId

const productSchema = new mongoose.Schema({
    images: {
        type: [String],
        required: true,
        trim: true
    },
    admin: {
        type: objectId,
        required: true,
        ref: "admin"
    },
    brandName: {
        type: String,
        required: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    filter: {
        type: String,
        required: true,
        trim: true,
        enum: ["men", "women", "boys", "girls"]
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
    },
    size_and_inventory: {
        "3XS": {
            type: Number,
            default: 0
        },
        "XXS": {
            type: Number,
            default: 0
        },
        "XS": {
            type: Number,
            default: 0
        },
        "XS/S": {
            type: Number,
            default: 0
        },
        "S": {
            type: Number,
            default: 0
        },
        "M": {
            type: Number,
            default: 0
        },
        "L": {
            type: Number,
            default: 0
        },
        "XL": {
            type: Number,
            default: 0
        },
        "XL/XXL": {
            type: Number,
            default: 0
        },
        "XXL": {
            type: Number,
            default: 0
        },
        "3XL": {
            type: Number,
            default: 0
        },
        "4XL": {
            type: Number,
            default: 0
        },
        "5XL": {
            type: Number,
            default: 0
        },
        "6XL": {
            type: Number,
            default: 0
        },
        "7XL": {
            type: Number,
            default: 0
        },
        "8XL": {
            type: Number,
            default: 0
        },
        "9XL": {
            type: Number,
            default: 0
        },
        "10XL": {
            type: Number,
            default: 0
        },
        "11XL": {
            type: Number,
            default: 0
        },
        "ONESIZE": {
            type: Number,
            default: 0
        }
    },
    highlights: {
        type: [String],
        required: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    shortDescription: {
        type: String,
        required: true,
        trim: true
    },
    size_fit: {
        type: String,
        required: true,
        trim: true
    },
    material_care: {
        type: String,
        required: true,
        trim: true
    },
    specification: [{
        title: {
            type: String,
            trim: true,
            required: true
        },
        value: {
            type: String,
            trim: true,
            required: true
        }
    }],
    isDeleted: {
        type: Boolean,
        required: true,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Product', productSchema);
