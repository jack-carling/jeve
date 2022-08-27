const chai = require('chai');
const expect = chai.expect;

const URL = 'http://127.0.0.1:5000';

function expectStatus(method, domain, code) {
  return chai
    .request(URL)
    [method](domain)
    .then((res) => {
      expect(res).to.have.status(code);
    })
    .catch((err) => {
      throw err;
    });
}

function sendContent(content, domain, code) {
  return chai
    .request(URL)
    .post(domain)
    .send(content)
    .then((res) => {
      expect(res).to.have.status(code);
      if (res.status === 201 || res.status === 400) {
        return res.body;
      }
    })
    .catch((err) => {
      throw err;
    });
}

function sendContentWithoutExpect(content, domain) {
  return chai
    .request(URL)
    .post(domain)
    .send(content)
    .then((res) => {
      return res.body;
    })
    .catch((err) => {
      throw err;
    });
}

function getContent(domain) {
  return chai
    .request(URL)
    .get(domain)
    .then((res) => {
      return res.body;
    })
    .catch((err) => {
      throw err;
    });
}

function deleteContent(domain) {
  return chai
    .request(URL)
    .delete(domain)
    .then((res) => {
      expect(res).to.have.status(204);
    })
    .catch((err) => {
      throw err;
    });
}

function updateContent(method, content, domain, code) {
  return chai
    .request(URL)
    [method](domain)
    .send(content)
    .then((res) => {
      expect(res).to.have.status(code);
    })
    .catch((err) => {
      throw err;
    });
}

exports.expectStatus = expectStatus;
exports.sendContent = sendContent;
exports.sendContentWithoutExpect = sendContentWithoutExpect;
exports.getContent = getContent;
exports.deleteContent = deleteContent;
exports.updateContent = updateContent;
