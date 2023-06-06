const mongoose = require('mongoose')
const { validType, isEmptyObject } = require('./helpers')

const VALID_TYPES = ['string', 'number', 'date', 'boolean', 'objectid', 'object', 'array']
const VALID_KEYS = ['required', 'type', 'unique', 'default', 'min', 'minLength', 'max', 'maxLength']
const BOOLEAN_KEYS = ['required', 'unique']

function createModelForName(name) {
    return new Promise((resolve) => {
        if (name in this.models) {
            this.warning(`conflict: ${name} already exist in models`)
            return resolve()
        }

        const schema = this.settings.domain[name].schema

        const [computedSchema, issues] = generateSchema(schema, name)

        if (issues.length) {
            for (const issue of issues) {
                this.warning(issue)
            }
            this.warning(`failed to create Mongoose schema for ${name}`)
            return resolve()
        }

        const mongooseSchema = new mongoose.Schema(computedSchema, {
            timestamps: {
                createdAt: '_created',
                updatedAt: '_updated',
            },
            versionKey: false,
            collection: name,
        })
        this.models[name] = mongoose.model(name, mongooseSchema)
        this.log(`created model for - ${name}`)
        resolve()
    })
}

function generateSchema(schema, name) {
    const computed = {}
    const issues = []
    let issue = ''

    for (const s in schema) {
        let dottedPath = `${name}.schema.${s}`
        if (typeof schema[s] === 'object' && !(schema[s] instanceof Array) && schema[s] !== null) {
            ;[computed[s], issue] = handleObject(schema[s], dottedPath)
            if (issue) {
                issues.push(issue)
                issue = null
            }
        } else if (schema[s] instanceof Array) {
            if (!schema[s].length) {
                issues.push(`path \`${dottedPath}\` is an empty array, use \`{type, 'array', default: []}\` instead.`)
            } else if (schema[s].length !== 1) {
                issues.push(`path \`${dottedPath}\` is defined as an array, should only contain one (1) object.`)
            } else if (!validType(schema[s][0], 'object') || isEmptyObject(schema[s][0])) {
                issues.push(`path \`${dottedPath}\` is defined as an array, should contain an non-empty object.`)
            } else {
                let result
                ;[result, issue] = handleObject(schema[s][0], dottedPath)
                computed[s] = [result]
            }
        } else {
            ;[computed[s], issue] = handleObjectValue(s, schema[s], dottedPath)
            if (issue) {
                issues.push(issue)
                issue = null
            }
        }
    }

    return [computed, issues]
}

function handleObject(schema, dottedPath) {
    let issue = validateObjectKeys(dottedPath, Object.keys(schema))
    if (issue) return [{}, issue]
    const obj = {}
    for (const s in schema) {
        if (typeof schema[s] === 'object' && !(schema[s] instanceof Array) && schema[s] !== null) {
            dottedPath += `.${s}`
            if (s === 'default') {
                const finalDottedPath = `${dottedPath}.${s}`
                ;[obj[s], issue] = handleObjectValue(s, schema[s], finalDottedPath, schema)
            } else {
                ;[obj[s], issue] = handleObject(schema[s], dottedPath)
            }
        } else if (schema[s] instanceof Array) {
            if (!schema[s].length) {
                issue = `path \`${dottedPath}\` is an empty array, use \`{type, 'array', default: []}\` instead.`
            } else if (schema[s].length !== 1) {
                issue = `path \`${dottedPath}\` is defined as an array, should only contain one (1) object.`
            } else {
                let result
                ;[result, issue] = handleObject(schema[s][0], dottedPath)
                obj[s] = [result]
            }
        } else {
            const finalDottedPath = `${dottedPath}.${s}`
            ;[obj[s], issue] = handleObjectValue(s, schema[s], finalDottedPath, schema)
        }
        if (issue) break
    }

    return [obj, issue]
}

function handleObjectValue(key, value, finalDottedPath, schema = undefined) {
    if (!VALID_KEYS.includes(key)) {
        if (validateType(value)) return [{ type: typeToMongooseSchemaType(value) }, null]
        return [{}, `domain.${finalDottedPath} contains invalid key (${key}).`]
    }
    if (key === 'type') {
        if (validateType(value)) return [typeToMongooseSchemaType(value), null]
        return [{}, `domain.${finalDottedPath} contains invalid value (${value}).`]
    } else if (key === 'default') {
        return [{ default: value }, null]
    } else if (key === 'min' || key === 'minLength' || key === 'max' || key === 'maxLength') {
        return handleMinMax(key, value, finalDottedPath, schema)
    } else if (BOOLEAN_KEYS.includes(key)) {
        if (value === true || value === false) {
            if (key === 'required') return [[value, 'required field'], null]
            return [value, null]
        }
        return [{}, `domain.${finalDottedPath} contains invalid boolean (${value}).`]
    }
}

function validateObjectKeys(dottedPath, keys) {
    if (!keys.length) {
        return `domain.${dottedPath} is an empty object, use \`{type, 'object', default: {}}\` instead.`
    }
    if (keys.some((key) => VALID_KEYS.includes(key))) {
        if (!keys.includes('type')) {
            return `domain.${dottedPath} is missing the "type" key.`
        }
        if (!keys.every((key) => VALID_KEYS.includes(key))) {
            return `domain.${dottedPath} contains an invalid combination of keys (${keys.join(', ')}).`
        }
    }
    return null
}

function validateType(type) {
    if (typeof type !== 'string') return false
    type = type.toLowerCase()
    if (VALID_TYPES.includes(type)) return true
    return false
}

function handleMinMax(key, value, dottedPath, schema) {
    if (!validType(value, 'number')) {
        return [{}, `domain.${dottedPath} value (${value}) is invalid, needs to be "number"`]
    }
    if ((key === 'min' || key === 'max') && schema['type'] === 'string') {
        const correctKey = key === 'min' ? 'minLength' : 'maxLength'
        return [{}, `domain.${dottedPath} is invalid, please use ${correctKey} with strings instead`]
    }
    if ((key === 'minLength' || key === 'maxLength') && schema['type'] === 'number') {
        const correctKey = key === 'minLength' ? 'min' : 'max'
        return [{}, `domain.${dottedPath} is invalid, please use ${correctKey} with numbers instead`]
    }
    if (key === 'min' || key === 'minLength') {
        const oppositeKey = key === 'min' ? 'max' : 'maxLength'
        if (schema[oppositeKey] && schema[oppositeKey] < value) {
            return [
                {},
                `domain.${dottedPath} is invalid, ${key} (${value}) is higher than ${oppositeKey} (${schema[oppositeKey]})`,
            ]
        }
        const message =
            key === 'min'
                ? `value ({VALUE}) is less than minimum allowed value (${value})`
                : `length of value ('{VALUE}') is less than minimum allowed value (${value})`
        return [[value, message], null]
    }
    if (key === 'max' || key === 'maxLength') {
        const oppositeKey = key === 'max' ? 'min' : 'minLength'
        if (schema[oppositeKey] && schema[oppositeKey] > value) {
            return [
                {},
                `domain.${dottedPath} is invalid, ${key} (${value}) is lower than ${oppositeKey} (${schema[oppositeKey]})`,
            ]
        }
        const message =
            key === 'max'
                ? `value ({VALUE}) is more than maximum allowed value (${value})`
                : `length of value ('{VALUE}') is more than maximum allowed value (${value})`
        return [[value, message], null]
    }
    return [value, null]
}

function typeToMongooseSchemaType(type) {
    type = type.toLowerCase()
    switch (type) {
        case 'string':
            return String
        case 'number':
            return Number
        case 'date':
            return Date
        case 'boolean':
            return Boolean
        case 'objectid':
            return mongoose.Types.ObjectId
        case 'object':
            return Object
        case 'array':
            return Array
        default:
            return null
    }
}

mongoose.SchemaTypes.String.cast(false)
mongoose.SchemaTypes.Number.cast(false)
mongoose.SchemaTypes.Boolean.cast(false)

exports.createModelForName = createModelForName
