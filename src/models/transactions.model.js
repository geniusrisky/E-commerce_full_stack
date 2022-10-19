const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId
const transactionSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: 'User',
        required: true
    },
    txn_id: {
        type: String,
        trim: true,
        required: true,
        unique: true
    },
    amount: {
        type: Number,
        default: 0,
        required: true
    },
    status: {
        type: String,
        enum: ["TXN_SUCCESS", "PENDING", "TXN_FAILURE"]
    },
    resp_msg: {
        type: String,
        required: true
    },
    log: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Transaction', transactionSchema);