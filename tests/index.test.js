const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const { expectStatus, sendContent } = require('./helpers');

console.log('PORT:', process.env.PORT ?? 5000);

describe('[test] initializing...', () => {
  it('should be up and running...', () => {});
});

describe('testing domain with empty object (animals)', () => {
  it('returns 204 no content on GET', async () => {
    await expectStatus('get', '/animals', 204);
  });
  it('returns 404 not found on POST', async () => {
    await expectStatus('post', '/animals', 404);
  });
  it('returns 404 not found on PUT', async () => {
    await expectStatus('put', '/animals', 404);
  });
  it('returns 404 not found on PATCH', async () => {
    await expectStatus('patch', '/animals', 404);
  });
  it('returns 404 not found on DELETE', async () => {
    await expectStatus('delete', '/animals', 404);
  });
});

describe('testing domain with empty schema object (drinks)', () => {
  it('returns 204 no content on GET', async () => {
    await expectStatus('get', '/drinks', 204);
  });
  it('returns 404 not found on POST', async () => {
    await expectStatus('post', '/drinks', 404);
  });
  it('returns 404 not found on PUT', async () => {
    await expectStatus('put', '/drinks', 404);
  });
  it('returns 404 not found on PATCH', async () => {
    await expectStatus('patch', '/drinks', 404);
  });
  it('returns 404 not found on DELETE', async () => {
    await expectStatus('delete', '/drinks', 404);
  });
});

describe('testing domain with basic schema (people)', () => {
  it('returns 200 success on GET', async () => {
    await expectStatus('get', '/people', 200);
  });
  it('returns 400 bad request on POST with no body', async () => {
    await sendContent({}, '/people', 400);
  });
  it('returns 404 not found on PUT', async () => {
    await expectStatus('put', '/people', 404);
  });
  it('returns 404 not found on PATCH', async () => {
    await expectStatus('patch', '/people', 404);
  });
  it('returns 404 not found on DELETE', async () => {
    await expectStatus('delete', '/people', 404);
  });
});
