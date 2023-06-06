const { isValidObjectId } = require('mongoose')

function validType(variable, type) {
    let valid
    switch (type) {
        case 'string':
            valid = typeof variable === 'string'
            break
        case 'number':
            valid = typeof variable === 'number' && !Number.isNaN(Number.parseInt(variable, 10))
            break
        case 'object':
            valid = typeof variable === 'object' && !(variable instanceof Array) && variable !== null
            break
        case 'boolean':
            valid = typeof variable === 'boolean'
            break
        case 'array':
            valid = variable instanceof Array
            break
        case 'objectid':
            valid = isValidObjectId(variable)
            break
        case 'function':
            valid = typeof variable === 'function'
            break
        default:
            valid = false
            break
    }
    return valid
}

function isEmptyObject(object) {
    return Object.keys(object).length === 0
}

exports.validType = validType
exports.isEmptyObject = isEmptyObject
