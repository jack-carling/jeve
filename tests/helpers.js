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

exports.expectStatus = expectStatus;
