const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const { expectStatus, sendContent, getContent, deleteContent, updateContent } = require('./helpers');

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

describe('testing domain people', () => {
  let body;
  it('returns 200 success on GET', async () => {
    await expectStatus('get', '/people', 200);
  });
  it('returns 400 bad request on POST with no body', async () => {
    await sendContent({}, '/people', 400);
  });
  it('returns 201 when created', async () => {
    body = await sendContent({ name: 'Jack' }, '/people', 201);
  });
  it('fetches the specific document', async () => {
    body = await getContent(`/people/${body['_item']['_id']}`);
    expect(body['_item']['name']).to.equal('Jack');
  });
  it('returns 201 when created', async () => {
    body = await sendContent({ name: 'Sally', age: 27 }, '/people', 201);
  });
  it('returns a list of both documents', async () => {
    body = await getContent('/people');
    expect(body['_meta']['total']).to.equal(2);
  });
  it('deletes the first document', async () => {
    const id = body['_items'][0]['_id'];
    await deleteContent(`/people/${id}`);
  });
  it('updates the second document', async () => {
    const id = body['_items'][1]['_id'];
    await updateContent('patch', { age: 28 }, `/people/${id}`, 200);
  });
  it('fetches all documents again, checks that one is left', async () => {
    body = await getContent('/people');
    expect(body['_meta']['total']).to.equal(1);
  });
  it('controls that age was updated', () => {
    expect(body['_items'][0]['age']).to.equal(28);
  });
  it('fails on PUT age (name is required)', async () => {
    const id = body['_items'][0]['_id'];
    await updateContent('put', { age: 29 }, `/people/${id}`, 400);
  });
  it('deletes the last document', async () => {
    const id = body['_items'][0]['_id'];
    await deleteContent(`/people/${id}`);
  });
});
