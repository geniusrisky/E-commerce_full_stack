const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId


const exploreSchema = new mongoose.Schema({
    contentType: {
        type: String,
        default: "banner",
        enum: ["slider", "banner", "horizontal_scroll", "grid"]
    },
    content: [{
        img: {
            type: String,
            required: true
        },
        action: {
            type: String,
            required: true
        }
    }],
    isDeleted: {
        type: Boolean,
        default: false
    },
    aid: {
        type: ObjectId,
        required: true
    }
}, { timestamps: true })

module.exports = mongoose.model('ExploreMain', exploreSchema);


