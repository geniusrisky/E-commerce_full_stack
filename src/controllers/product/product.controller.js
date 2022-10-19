const commentModel = require('../../models/comment.model')
const { unSuccess, success } = require("../../utility/response");
const { emptyObject, emptyString, emptyNumber, invalidEmail, invalidPassword, invalidPincode, invalidPhone, invalidObjectId, emptyArray, notExistInArray } = require("../../utility/validations");
const mth = require('../../utility/math');
const productModel = require("../../models/product.model");
const { default: mongoose } = require('mongoose');

// ⬇️ create product ---------------------------------------

const create = async (req, res) => {
    try {


        // get body data
        const tokenData = req.tokenData;

        // get body data
        const data = req.body;

        if (emptyObject(data)) return unSuccess(res, 400, true, 'Post body is required!')

        let { images, brandName, title, filter, price, size_and_inventory, highlights, category, shortDescription, size_fit, material_care, specification } = data

        // basic validation
        if (emptyArray(images)) return unSuccess(res, 400, true, 'Array of images are required!')
        if (emptyString(brandName)) return unSuccess(res, 400, true, 'BrandName id is required!')
        if (emptyString(title)) return unSuccess(res, 400, true, 'Title id is required!')
        if (emptyObject(price)) return unSuccess(res, 400, true, 'Price object is required!')
        if (emptyString(category)) return unSuccess(res, 400, true, 'Category is required!')
        if (emptyString(shortDescription)) return unSuccess(res, 400, true, 'ShortDescription is required!')
        if (emptyString(size_fit)) return unSuccess(res, 400, true, 'Size_fit is required!')
        if (emptyString(material_care)) return unSuccess(res, 400, true, 'Material_care is required!')

        // destructure price
        let { mrp, total, includeTax } = price
        if (emptyNumber(mrp)) return unSuccess(res, 400, true, 'MRP is required!')

        if (emptyNumber(total)) return unSuccess(res, 400, true, 'Total price is required!')
        let discount = mth.roundOf(((mrp - total) / mrp) * 100)

        // size and inventory validation
        if (emptyObject(size_and_inventory)) return unSuccess(res, 400, true, 'Size_and_inventory is required (as a object)!')

        // filter validation
        if (emptyString(filter)) return unSuccess(res, 400, true, 'Filter id is required!')
        if (!["men", "women", "boys", "girls"].includes(filter)) return unSuccess(res, 400, true, 'Filter only accept any of - men, women, boys, girls !')

        // highlights validations
        if (!highlights || highlights.length == 0) return unSuccess(res, 400, true, 'Highlights is required as array!')

        // specification validation
        if (!specification || specification.length == 0) return unSuccess(res, 400, true, 'Specification is required as array of objects!')


        // object for creating 
        const object = {
            images,
            admin: tokenData.adminId,
            brandName,
            title,
            filter,
            price: {
                mrp,
                discount,
                total,
                includeTax
            },
            size_and_inventory,
            highlights,
            category,
            shortDescription,
            size_fit,
            material_care,
            specification
        }

        const productCreate = await productModel.create(object)

        return success(res, 201, true, "Product created successfully!", productCreate)
    } catch (_) { return unSuccess(res, 500, true, _.message) }
}





// ⬇️ update product ---------------------------------------
const update = async (req, res) => {
    try {
        // get product id
        const productId = req.params.productId

        // get body data
        const data = req.body;

        if (emptyObject(data)) return unSuccess(res, 400, true, 'Post body is required!')

        let { images, brandName, title, filter, price, size_and_inventory, highlights, category, shortDescription, size_fit, material_care, specification } = data

        const product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) return unSuccess(res, 400, true, 'Product not found!')

        // basic validation
        if (!emptyArray(images)) product.images = images
        if (!emptyString(brandName)) product.brandName = brandName
        if (!emptyString(title)) product.title = title
        if (!emptyString(category)) product.category = category
        if (!emptyString(shortDescription)) product.shortDescription = shortDescription
        if (!emptyString(size_fit)) product.size_fit = size_fit
        if (!emptyString(material_care)) product.material_care = material_care

        if (!emptyObject(price)) {
            let { mrp, total, includeTax } = price
            if (!emptyNumber(mrp)) product.price.mrp = mrp
            if (!emptyNumber(total)) product.price.total = total
            product.price.discount = mth.roundOf(((mrp - total) / mrp) * 100)
            product.price.includeTax = includeTax
        }

        // // size and inventory validation
        if (!emptyObject(size_and_inventory)) product.size_and_inventory = size_and_inventory

        // // filter validation
        if (!emptyString(filter)) {
            if (!["men", "women", "boys", "girls"].includes(filter)) return unSuccess(res, 400, true, 'Filter only accept any of - men, women, boys, girls !')
            product.filter = filter
        }

        // highlights validations
        if (highlights && highlights.length > 0) product.highlights = highlights

        // // specification validation
        if (specification && specification.length > 0) product.specification = specification

        // data save
        await product.save()
        return success(res, 200, true, "Product updated successfully!", product)
    } catch (_) { return unSuccess(res, 500, true, _.message) }
}





// ⬇️ delete product ---------------------------------------
const remove = async (req, res) => {
    try {
        // get product id
        const productId = req.params.productId

        const product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) return unSuccess(res, 400, true, 'Product not found!')

        product.isDeleted = true;
        product.deletedAt = new Date()
        // data save
        await product.save()
        return success(res, 200, true, "Product deleted successfully!", product)
    } catch (_) { return unSuccess(res, 500, true, _.message) }
}






// ⬇️ get single product ---------------------------------------

const viewOne = async (req, res) => {
    try {


        // get id
        let productId = req.params.productId
        if (invalidObjectId(productId)) return unSuccess(res, 400, true, "Invalid Product ID")

        let product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) return unSuccess(res, 404, true, "Product not found!")



        // ⭐ rating calculation and more
        // ----------------------------------------------------------------------------------

        // aggrigate for ratingtg
        let ratingObj = { "STAR_1": 0, "STAR_2": 0, "STAR_3": 0, "STAR_4": 0, "STAR_5": 0 }
        let ratingRawArray = await commentModel.aggregate([
            {
                "$match": {
                    "productId": new mongoose.Types.ObjectId(productId),
                    "rating": { "$in": [1, 2, 3, 4, 5] },
                    "isDeleted": false
                }
            },
            {
                "$group": {
                    "_id": "$rating",
                    "count": { "$sum": 1 }
                }
            }
        ])

        // console.log(ratingRawArray)

        // convert array to object
        for (let each of ratingRawArray) {
            ratingObj[`STAR_${each._id}`] = each.count
        }

        // calculate rating
        let TOTAL_PEOPLE = ratingObj.STAR_1 + ratingObj.STAR_2 + ratingObj.STAR_3 + ratingObj.STAR_4 + ratingObj.STAR_5
        // AVRAGE formula = ((1*votersof1) +(2*votersof2) +(3*votersof3) +(4*votersof4) +(5*votersof5)) / total voters
        let AVRAGE = (1 * ratingObj.STAR_1) + (2 * ratingObj.STAR_2) + (3 * ratingObj.STAR_3) + (4 * ratingObj.STAR_4) + (5 * ratingObj.STAR_5)
        AVRAGE = mth.roundOf(AVRAGE / TOTAL_PEOPLE, 10) || 0

        // taring final object
        let RATING_FINAL = { PEOPLE: ratingObj, AVRAGE, TOTAL_PEOPLE }

        // get 10 cpmments --------------------------------------------------------
        const comments = await commentModel.find({ "productId": productId, "isDeleted": false })
            .populate({ path: 'userId', select: ['firstName', 'lastName'] })
            .sort({ createdAt: -1 })
            .limit(10)

        // arrange the products...................................................
        let FINAL_PRODUCT = {
            "price": product.price,
            "size_and_inventory": product.size_and_inventory,
            "_id": product._id,
            "images": product.images,
            "brandName": product.brandName,
            "title": product.title,
            "filter": product.filter,
            "highlights": product.highlights,
            "category": product.category,
            "shortDescription": product.shortDescription,
            "size_fit": product.size_fit,
            "material_care": product.material_care,
            "specification": product.specification,
            "rating": RATING_FINAL,
            "comments": comments
        }

        return success(res, 201, true, "Product get successfully!", FINAL_PRODUCT)
    } catch (_) { return unSuccess(res, 500, true, _.message) }
}






// ⬇️ get single product ---------------------------------------

const viewAll = async (req, res) => {
    try {

        // get QueryData
        const query = req.query
        // console.log(query)
        // default Query
        let queryObj = {}
        let sortObj = { 'title': 1 }  //{ createdAt: -1 }

        let page = 1
        let row = 25
        let search = null;

        if (!emptyObject(query)) {
            if (!emptyString(query.page)) page = Number(query.page)
            if (page <= 0) return unSuccess(res, 400, true, "Can't read the page number")
            if (!emptyString(query.row)) row = Number(query.row)
            if (!emptyString(query.filter)) queryObj.filter = query.filter
            if (!emptyString(query.search)) search = query.search


            if (query.categories) {
                if (Array.isArray(query.categories)) queryObj.category = { $in: query.categories }
                else queryObj.category = { $in: [query.categories] }
            }

            if (query.brands) {
                if (Array.isArray(query.brands)) queryObj.brandName = { $in: query.brands }
                else queryObj.brandName = { $in: [query.brands] }
            }

            if (query.discount) queryObj["price.discount"] = { $gte: query.discount }

            if (!emptyString(query.sortBy) && !emptyString(query.inOrder)) {
                sortObj = {} // it use to delete previous key:value in sort
                sortObj[query.sortBy] = Number(query.inOrder)
            }
        }

        queryObj.isDeleted = false
        // console.log(queryObj)
        // console.log(sortObj)

        // aggrigate_Seratch 
        const aggregateSearch = {
            index: 'title_search',
            autocomplete: {
                query: search,
                path: 'title',
                fuzzy: {
                    maxEdits: 1
                }
            }
        }

        // call DB here
        // here is rhe product list DB call
        let productList;

        if (!search) {

            productList = await productModel.find(queryObj).sort(sortObj)
                .select({ admin: 0, size_fit: 0, material_care: 0, specification: 0, isDeleted: 0, deletedAt: 0, __v: 0, createdAt: 0, updatedAt: 0 })
                .skip((page - 1) * row)
                .limit(row)

        } else {

            const aggre = [
                { $search: aggregateSearch },
                { $match: queryObj },
                { $sort: sortObj },
                { $skip: (page - 1) * row },
                { $limit: row },
                { $project: { admin: 0, size_fit: 0, material_care: 0, specification: 0, isDeleted: 0, deletedAt: 0, __v: 0, createdAt: 0, updatedAt: 0 } }
            ]

            /***
             * I got a glitch when I trying to make my documents as pagination format.
             * It never work if I add this.Limit first, then the skip.
             * So never use limit before skip.
            */

            productList = await productModel.aggregate(aggre)

        }

        // categories and more
        let querySelect = { isDeleted: false }
        if (queryObj.filter) querySelect.filter = queryObj.filter

        let aggrigate = {
            brand: [
                { "$match": querySelect },
                {
                    "$group": {
                        "_id": "$brandName", "count": { "$sum": 1 }
                    }
                },
                { "$sort": { "_id": 1 } }
            ],
            category: [
                { "$match": querySelect },
                {
                    "$group": {
                        "_id": "$category", "count": { "$sum": 1 }
                    }
                },
                { "$sort": { "_id": 1 } }
            ]
        }

        if (search) {
            aggrigate.brand.unshift({ $search: aggregateSearch })
            aggrigate.category.unshift({ $search: aggregateSearch })
        }

        /*⚠️ ALERT ----------------------------------------------------------------------------------
        1. Position matters DONT CHANGE CATEGORIES AGGRIGATER POSITION (IT'S ALWS AVOBE OF BRANDS)
        ----------------------------------------------------------------------------------------------*/
        const categories = await productModel.aggregate(aggrigate.category)
        // console.log(categories)

        /*⚠️ ALERT -----------------------------------------------------------------------------------------------------------
        2. Position matters DONT CHANGE THE POSITION OF THE CONDITION (IT'S ALWS AVOBE OF BRANDS AND BELOW THE CATEGORIES)
        -----------------------------------------------------------------------------------------------------------------------*/
        if (queryObj.category) querySelect.category = queryObj.category
        // console.log(queryObj)


        /*⚠️ ALERT -----------------------------------------------------------------------------------------------------
        3. Position matters DONT CHANGE BRANDS AGGRIGATER POSITION (IT'S ALWS BELOW OF CATEGORIES AND THE CONDITION)
        -----------------------------------------------------------------------------------------------------------------*/
        const brands = await productModel.aggregate(aggrigate.brand)



        const totalProducts = brands.reduce((total, each) => each.count + total, 0)
        const totalPages = Math.ceil(totalProducts / row)
        // console.log(totalProducts)



        const discount = [10, 20, 30, 40, 50, 60, 70, 80]
        const genders = ["men", "women", "boys", "girls"]
        const sortBy = [
            {
                title: "Discount: High to Low",
                sortBy: "price.discount",
                inOrder: -1
            },
            {
                title: "Discount: Low to High",
                sortBy: "price.discount",
                inOrder: 1
            },
            {
                title: "Price: High to Low",
                sortBy: "price.total",
                inOrder: -1
            },
            {
                title: "Price: Low to High",
                sortBy: "price.total",
                inOrder: 1
            },
            {
                title: "Title: Z to A",
                sortBy: "title",
                inOrder: -1
            },
            {
                title: "Title: A to Z",
                sortBy: "title",
                inOrder: 1
            }
        ]

        const filters = { genders, categories, brands, discount, sortBy, query }


        const result = { productList, totalProducts, totalPages, page, filters }
        return success(res, 200, true, "Product get successfully!", result)
    } catch (_) {
        console.log(_)
        return unSuccess(res, 500, true, _.message)
    }
}





module.exports = { create, viewOne, viewAll, update, remove }