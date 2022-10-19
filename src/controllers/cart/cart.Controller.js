const cartModel = require('../../models/cart.Model')
const productModel = require('./../../models/product.model')
const { invalidObjectId, emptyObject, emptyString, emptyNumber } = require("../../utility/validations");
const { unSuccess, success } = require("../../utility/response");
const allSizes = ["3XS", "XXS", "XS", "XS/S", "S", "M", "L", "XL", "XL/XXL", "XXL", "3XL", "4XL", "5XL", "6XL", "7XL", "8XL", "9XL", "10XL", "11XL", "ONESIZE"]



// update cart🛒🛒
const addToCart = async (req, res) => {
    try {
        let data = req.body
        if (emptyObject(data)) return unSuccess(res, 400, true, 'Body is required!!')
        let { productId, size, quantity } = data
        let userId = req.tokenData.userId
        size = size.toUpperCase()
        quantity = quantity || 1 // default quantity

        // basic validations
        if (emptyString(productId)) return unSuccess(res, 400, true, 'ProductId required!')
        if (invalidObjectId(productId)) return unSuccess(res, 400, true, 'enter valid productId!')
        if (emptyString(size)) return unSuccess(res, 400, true, 'size required!')
        if (!allSizes.includes(size)) return unSuccess(res, 400, true, 'enter valid size')
        if (emptyNumber(quantity)) return unSuccess(res, 400, true, 'quantity required!')
        if (quantity < 0 || quantity > 10) return unSuccess(res, 400, true, 'maximum quantity exid!')


        //db call for product
        let product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) return unSuccess(res, 404, true, 'product not found enter valid product Id!')
        if (product.size_and_inventory[size] < quantity) return unSuccess(res, 404, true, `Can't add because we have only ${product.size_and_inventory[size]} stocks avalable!`)

        let cart = await cartModel.findOne({ userId: userId }).populate("items.product", { 'isDeleted': 1, 'brandName': 1, 'category': 1, 'images': 1, 'price': 1, 'title': 1, 'size_and_inventory': 1, '_id': 1 })
        if (!cart) return unSuccess(res, 404, true, 'cart not found enter valid cart Id!')
        if (cart.items >= 20) return unSuccess(res, 404, true, 'Your cart is full, Please remove some items first!')

        //db call for cart
        for (let each of cart.items) {
            if (productId == String(each.product._id) && size == each.size) {
                if (each.quantity >= 10) return unSuccess(res, 400, true, 'maximum quantity exid!')
                if (each.quantity >= product.size_and_inventory[size]) return unSuccess(res, 400, true, `You can't add more then ${product.size_and_inventory[size]}`)
                each.quantity = each.quantity + quantity
                await cart.save()
                const outView = { totalItems: cart.items.length }
                return success(res, 200, true, "Quantity add tocart!", outView)
            }
        }

        pushData = { product: productId, quantity: quantity, size: size }
        cart.items.push(pushData)

        // generete item Clone here
        const ItemsClone = JSON.parse(JSON.stringify(cart.items))
        await cart.save()
        const outView = { totalItems: ItemsClone.length }
        return success(res, 201, true, "New product added to cart!", outView)
    }
    catch (e) {
        console.log(e)
        return unSuccess(res, 500, true, e.message)
    }
}



// update cart🛒🛒
const cartUpdate = async (req, res) => {
    try {
        let data = req.body
        if (emptyObject(data)) return unSuccess(res, 400, true, 'Body is required!!')
        let { productId, size, quantity } = data
        let userId = req.tokenData.userId
        size = size.toUpperCase()
        quantity = quantity || 1 // default quantity

        // basic validations
        if (emptyString(productId)) return unSuccess(res, 400, true, 'ProductId required!')
        if (invalidObjectId(productId)) return unSuccess(res, 400, true, 'enter valid productId!')
        if (emptyString(size)) return unSuccess(res, 400, true, 'size required!')
        if (!allSizes.includes(size)) return unSuccess(res, 400, true, 'enter valid size')
        if (emptyNumber(quantity)) return unSuccess(res, 400, true, 'quantity required!')
        if (quantity < 0 || quantity > 10) return unSuccess(res, 400, true, 'maximum quantity exid!')


        //db call for product
        let product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) return unSuccess(res, 404, true, 'product not found enter valid product Id!')
        if (product.size_and_inventory[size] < quantity) return unSuccess(res, 404, true, `Can't add because we have only ${product.size_and_inventory[size]} stocks avalable!`)

        let cart = await cartModel.findOne({ userId: userId }).populate("items.product", { 'isDeleted': 1, 'brandName': 1, 'category': 1, 'images': 1, 'price': 1, 'title': 1, 'size_and_inventory': 1, '_id': 1 })
        if (!cart) return unSuccess(res, 404, true, 'cart not found enter valid cart Id!')
        if (cart.items >= 20) return unSuccess(res, 404, true, 'Your cart is full, Please remove some items first!')

        //db call for cart
        for (let each of cart.items) {
            if (productId == String(each.product._id) && size == each.size) {
                if (quantity > product.size_and_inventory[size]) return unSuccess(res, 400, true, `You can't add more then ${product.size_and_inventory[size]}`)
                each.quantity = quantity
                await cart.save()
                each.product = product
                const pricing = CalculateTotal(cart.items)
                const outView = { items: cart.items, pricing, totalItems: cart.items.length }
                return success(res, 200, true, "cart updated (quantiry update)", outView)
            }
        }

        pushData = { product: productId, quantity: quantity, size: size }
        cart.items.push(pushData)

        // generete item Clone here
        const ItemsClone = JSON.parse(JSON.stringify(cart.items))
        await cart.save()

        ItemsClone[ItemsClone.length - 1].product = product
        const pricing = CalculateTotal(ItemsClone)
        const outView = { items: ItemsClone, pricing, totalItems: ItemsClone.length }
        return success(res, 201, true, "new product added to cart", outView)
    }
    catch (e) {
        console.log(e)
        return unSuccess(res, 500, true, e.message)
    }
}











//remove cart items🛒♻
const removeItemincart = async (req, res) => {
    try {
        let data = req.body
        if (emptyObject(data)) return unSuccess(res, 400, true, 'Body is required!!')
        let { productId, size } = data
        let userId = req.tokenData.userId
        size = size.toUpperCase()

        // basic validations
        if (emptyString(productId)) return unSuccess(res, 400, true, 'ProductId required!')
        if (invalidObjectId(productId)) return unSuccess(res, 400, true, 'enter valid productId!')
        if (emptyString(size)) return unSuccess(res, 400, true, 'size required!')
        if (!allSizes.includes(size)) return unSuccess(res, 400, true, 'enter valid size')


        //db call for cart
        let cart = await cartModel.findOne({ userId: userId }).populate("items.product", { 'isDeleted': 1, 'brandName': 1, 'category': 1, 'images': 1, 'price': 1, 'title': 1, 'size_and_inventory': 1, '_id': 1 })
        if (!cart) return unSuccess(res, 404, true, 'cart not found enter valid cart Id!')
        //db call for cart
        for (let i = 0; i < cart.items.length; i++) {
            const each = cart.items[i];
            if (productId == String(each.product._id) && size == each.size) {
                cart.items.splice(i, 1)
                await cart.save()
                const pricing = CalculateTotal(cart.items)
                const outView = { items: cart.items, pricing, totalItems: cart.items.length }
                return success(res, 200, true, "cart updated (item removed)", outView)
            }
        }
        // console.log(cart.items.length)
        return unSuccess(res, 404, true, "Can't find the product in your cart!")
    }
    catch (e) {
        console.log(e)
        return unSuccess(res, 500, true, e.message)
    }
}










//view cart 🛒👀
const viewCart = async (req, res) => {
    try {
        let userId = req.tokenData.userId
        let cart = await cartModel.findOne({ userId: userId }).populate("items.product", { 'isDeleted': 1, 'brandName': 1, 'category': 1, 'images': 1, 'price': 1, 'title': 1, 'size_and_inventory': 1, '_id': 1 })
        if (!cart) return unSuccess(res, 404, true, 'cart not found enter valid cart Id!')

        // calculation Part ------------------------------------
        const pricing = CalculateTotal(cart.items)

        const outView = { items: cart.items, pricing, totalItems: cart.items.length }
        return success(res, 200, true, "get cart successfully", outView)
    }
    catch (e) {
        console.log(e)
        return unSuccess(res, 500, true, e.message)
    }
}












// delete cart🛒❌
const deleteCart = async (req, res) => {
    try {
        let userId = req.tokenData.userId
        let cart = await cartModel.findOneAndUpdate({ userId: userId }, { $set: { items: [] } }, { new: true })
        if (!cart)
            return unSuccess(res, 404, true, 'cart not found enter valid cart Id!')
        // cart.items = []
        // await cart.save()
        return success(res, 200, true, "cart deleted", cart)
    }
    catch (e) {
        console.log(e)
        return unSuccess(res, 500, true, e.message)
    }
}








// calculation fumction for total
const CalculateTotal = (items = []) => {
    // calculation Part ------------------------------------
    const pricing = { totalMRP: 0, discountOnMRP: 0, deleveryCharge: 0, totalPrice: 0, subTotal: 0 }
    let discountOnMRP = 0, totalMRP = 0, totalPrice = 0
    items.forEach(each => {
        totalMRP = (each.product.price.mrp * each.quantity)
        totalPrice = (each.product.price.total * each.quantity)
        discountOnMRP = (totalMRP - totalPrice)
        pricing.discountOnMRP += discountOnMRP
        pricing.totalMRP += totalMRP
        pricing.totalPrice += totalPrice
    })

    // add delevery charge add if <500
    if (pricing.totalPrice != 0 && pricing.totalPrice < 500) pricing.deleveryCharge = 49;
    //sum total here
    pricing.subTotal = pricing.totalPrice + pricing.deleveryCharge
    return pricing
}




module.exports = { addToCart, cartUpdate, removeItemincart, viewCart, deleteCart }



