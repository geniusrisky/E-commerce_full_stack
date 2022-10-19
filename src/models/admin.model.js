const mongoose = require('mongoose')

const adminSchema= new mongoose.Schema({
    name:String,
    email:String,
    phone:String,
    password:{
        type:String,
        minlength:8,
        maxlength:15
    },
    role:{
        type:String,
        enum:["order","cart","comment","wishList","user","product" ]
    },
    isDeleted:{
        type:Boolean,
        default:false
    },
    deletedAt:{
        type:Date
    }
},{timestamps:true})

module.exports=mongoose.model('admin',adminSchema)