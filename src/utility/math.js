
const roundOf = (number = 0, withIn = 10) => {
    return Math.round(number * withIn) / withIn
}


module.exports = { roundOf }