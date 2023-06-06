const chai = require('chai')
const expect = chai.expect

const { jeve } = require('./index')

const URL = 'http://127.0.0.1:5000'

function expectStatus(method, domain, code) {
    return chai
        .request(URL)
        [method](domain)
        .then((res) => {
            expect(res).to.have.status(code)
        })
        .catch((err) => {
            throw err
        })
}

function sendContent(content, domain, code) {
    return chai
        .request(URL)
        .post(domain)
        .send(content)
        .then((res) => {
            expect(res).to.have.status(code)
            if (res.status === 201 || res.status === 400) {
                return res.body
            }
        })
        .catch((err) => {
            throw err
        })
}

function sendContentWithoutExpect(content, domain) {
    return chai
        .request(URL)
        .post(domain)
        .send(content)
        .then((res) => {
            return res.body
        })
        .catch((err) => {
            throw err
        })
}

function getContent(domain) {
    return chai
        .request(URL)
        .get(domain)
        .then((res) => {
            return res.body
        })
        .catch((err) => {
            throw err
        })
}

function deleteContent(domain) {
    return chai
        .request(URL)
        .delete(domain)
        .then((res) => {
            expect(res).to.have.status(204)
        })
        .catch((err) => {
            throw err
        })
}

function updateContent(method, content, domain, code) {
    return chai
        .request(URL)
        [method](domain)
        .send(content)
        .then((res) => {
            expect(res).to.have.status(code)
        })
        .catch((err) => {
            throw err
        })
}

async function expectModelPathType(model, dottedPath, type) {
    const Model = await jeve.model(model)
    return expect(Model.find({}).schema.paths[dottedPath].instance.toLowerCase()).to.equal(type)
}

async function expectModelPathValidation(model, dottedPath, type, value) {
    const Model = await jeve.model(model)
    const options = Model.find({}).schema.paths[dottedPath].options[type]
    if (type === 'default') {
        return expect(options.default).to.deep.equal(value)
    }

    if (options instanceof Array) {
        return expect(options[0]).to.equal(value)
    } else {
        return expect(options).to.equal(value)
    }
}

exports.expectStatus = expectStatus
exports.sendContent = sendContent
exports.sendContentWithoutExpect = sendContentWithoutExpect
exports.getContent = getContent
exports.deleteContent = deleteContent
exports.updateContent = updateContent
exports.expectModelPathType = expectModelPathType
exports.expectModelPathValidation = expectModelPathValidation
