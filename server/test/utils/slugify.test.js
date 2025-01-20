const { expect } = require('chai');
const { slugify } = require('../../utils/slugify');

describe('slugify', () => {
  it('should return new slug', () => {
    const slug = slugify('This is a test slug, and this is fine');
    expect(slug).to.equal('this-is-a-test-slug-and-this-is-fine');
  });
  it('should return new slug without trailing dash', () => {
    const slug = slugify('This is a test slug, and this is fine |');
    expect(slug).to.equal('this-is-a-test-slug-and-this-is-fine');
  });
  it('should return new slug without leading dash', () => {
    const slug = slugify('| This is a test slug, and this is fine |');
    expect(slug).to.equal('this-is-a-test-slug-and-this-is-fine');
  });
  it('should return new slug without emoji', () => {
    const slug = slugify('😀 Test emoji test 😀');
    expect(slug).to.equal('test-emoji-test');
  });
});
