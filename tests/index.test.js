const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const {
  expectStatus,
  sendContent,
  sendContentWithoutExpect,
  getContent,
  deleteContent,
  updateContent,
} = require('./helpers');
const { jeve } = require('./index');

describe('[test] initializing...', () => {
  it('should be up and running...', () => {});
});

describe('testing domain with empty object (products)', () => {
  it('returns 204 no content on GET', async () => {
    await expectStatus('get', '/products', 204);
  });
  it('returns 404 not found on POST', async () => {
    await expectStatus('post', '/products', 404);
  });
  it('returns 404 not found on PUT', async () => {
    await expectStatus('put', '/products', 404);
  });
  it('returns 404 not found on PATCH', async () => {
    await expectStatus('patch', '/products', 404);
  });
  it('returns 404 not found on DELETE', async () => {
    await expectStatus('delete', '/products', 404);
  });
  it('does not initialize a model', async () => {
    const model = await jeve.model('products');
    expect(model).to.be.undefined;
  });
});

describe('testing domain with empty schema object (users)', () => {
  it('returns 204 no content on GET', async () => {
    await expectStatus('get', '/users', 204);
  });
  it('returns 404 not found on POST', async () => {
    await expectStatus('post', '/users', 404);
  });
  it('returns 404 not found on PUT', async () => {
    await expectStatus('put', '/users', 404);
  });
  it('returns 404 not found on PATCH', async () => {
    await expectStatus('patch', '/users', 404);
  });
  it('returns 404 not found on DELETE', async () => {
    await expectStatus('delete', '/users', 404);
  });
  it('does not initialize a model', async () => {
    const model = await jeve.model('users');
    expect(model).to.be.undefined;
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
  it('has a model', async () => {
    const model = await jeve.model('people');
    expect(model).to.not.be.undefined;
  });
});

describe('testing domain people and preHandler', () => {
  let body;
  it('returns 201 when created', async () => {
    body = await sendContent({ name: 'Sara', age: 20 }, '/people', 201);
  });
  it('checks if adult boolean has been added', async () => {
    expect(body['_item']['isAdult']).to.be.true;
  });
  it('deletes the document again', async () => {
    const id = body['_item']['_id'];
    await deleteContent(`/people/${id}`);
  });
});

describe('testing domain posts', () => {
  it('returns 204 no content on GET', async () => {
    await expectStatus('get', '/posts', 204);
  });
  it('returns 404 not found on POST', async () => {
    await expectStatus('post', '/posts', 404);
  });
  it('returns 404 not found on PUT', async () => {
    await expectStatus('put', '/posts', 404);
  });
  it('returns 404 not found on PATCH', async () => {
    await expectStatus('patch', '/posts', 404);
  });
  it('returns 404 not found on DELETE', async () => {
    await expectStatus('delete', '/posts', 404);
  });
  it('does not initialize a model', async () => {
    const model = await jeve.model('posts');
    expect(model).to.be.undefined;
  });
});

describe('testing domain comments', () => {
  let body;
  it('initializes a model', async () => {
    const model = await jeve.model('comments');
    expect(model).to.not.be.undefined;
  });
  it('returns 400 bad request on POST', async () => {
    const content = {};
    body = await sendContent(content, '/comments', 400);
  });
  it('returns three issues (required)', async () => {
    expect(body['_issues']).to.have.lengthOf(3);
  });
  it('still has 2 required fields', async () => {
    const content = { content: { header: 'Title 1' } };
    body = await sendContentWithoutExpect(content, '/comments');
    expect(body['_issues']).to.be.lengthOf(2);
  });
  it('returns casting error for content.length', async () => {
    const content = { content: { header: 'Title 1', body: 'Lorem Ipsum', length: '11' } };
    body = await sendContentWithoutExpect(content, '/comments');
    expect(body['_issues'][0]['content.length']).to.equal('must be of number type');
  });
  it('returns casting error for content.body', async () => {
    const content = { content: { header: 'Title 1', body: 12345, length: 11 } };
    body = await sendContentWithoutExpect(content, '/comments');
    expect(body['_issues'][0]['content.body']).to.equal('must be of string type');
  });
  it('returns casting error for user', async () => {
    const content = { user: 'Jeve', content: { header: 'Title 1', body: 'Lorem Ipsum', length: 11 } };
    body = await sendContentWithoutExpect(content, '/comments');
    expect(body['_issues'][0]['user']).to.equal('must be a valid objectid');
  });
  it('returns casting error for posted', async () => {
    const content = { posted: 'X', content: { header: 'Title 1', body: 'Lorem Ipsum', length: 11 } };
    body = await sendContentWithoutExpect(content, '/comments');
    expect(body['_issues'][0]['posted']).to.equal('must be a valid date');
  });
  it('returns casting error for firstComment', async () => {
    const content = { firstComment: 'yes', content: { header: 'Title 1', body: 'Lorem Ipsum', length: 11 } };
    body = await sendContentWithoutExpect(content, '/comments');
    expect(body['_issues'][0]['firstComment']).to.equal('must be a boolean (true/false)');
  });
  it('returns 201 when created', async () => {
    const content = {
      user: '507f1f77bcf86cd799439011',
      posted: '2022/08/27',
      firstComment: true,
      content: { header: 'Title 1', body: 'Lorem Ipsum', length: 11 },
    };
    await sendContent(content, '/comments', 201);
  });
  it('fails because content.header is unique', async () => {
    const content = {
      user: '507f1f77bcf86cd799439011',
      posted: '2022/08/27',
      firstComment: true,
      content: { header: 'Title 1', body: 'Lorem Ipsum', length: 11 },
    };
    body = await sendContentWithoutExpect(content, '/comments');
    expect(body['_issues'][0]['content.header']).to.equal('value (Title 1) is not unique');
  });
  it('returns min error for content.length', async () => {
    const content = { content: { header: 'Title 1', body: 'Lorem', length: 5 } };
    body = await sendContentWithoutExpect(content, '/comments');
    expect(body['_issues'][0]['content.length']).to.equal('value (5) is less than minimum allowed value (6)');
  });
  it('returns max error for content.length', async () => {
    const content = { content: { header: 'Title 1', body: 'Lorem ipsum dolor sit', length: 21 } };
    body = await sendContentWithoutExpect(content, '/comments');
    expect(body['_issues'][0]['content.length']).to.equal('value (21) is more than maximum allowed value (12)');
  });
  //
  it('returns minLength error for content.header', async () => {
    const content = { content: { header: 'X', body: 'Lorem ipsum', length: 11 } };
    body = await sendContentWithoutExpect(content, '/comments');
    expect(body['_issues'][0]['content.header']).to.equal(
      `length of value ('X') is less than minimum allowed value (2)`
    );
  });
  it('returns maxLength error for content.header', async () => {
    const content = { content: { header: 'X'.repeat(21), body: 'Lorem ipsum', length: 11 } };
    body = await sendContentWithoutExpect(content, '/comments');
    expect(body['_issues'][0]['content.header']).to.equal(
      `length of value ('${'X'.repeat(21)}') is more than maximum allowed value (20)`
    );
  });

  //
  it('clears the collection', async () => {
    await jeve.model('comments').deleteMany({});
  });
});
