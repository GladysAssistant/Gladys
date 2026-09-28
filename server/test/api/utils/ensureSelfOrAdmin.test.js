const { expect } = require('chai');

const { ForbiddenError } = require('../../../utils/coreErrors');
const { USER_ROLE } = require('../../../utils/constants');
const { ensureSelfOrAdmin } = require('../../../api/utils/ensureSelfOrAdmin');

describe('ensureSelfOrAdmin', () => {
  it('should let a user act on themselves', () => {
    const req = { user: { selector: 'pepper', role: USER_ROLE.HABITANT } };
    expect(() => ensureSelfOrAdmin(req, 'pepper')).to.not.throw();
  });

  it('should let an admin act on another user', () => {
    const req = { user: { selector: 'john', role: USER_ROLE.ADMIN } };
    expect(() => ensureSelfOrAdmin(req, 'pepper')).to.not.throw();
  });

  it('should not let a habitant act on another user', () => {
    const req = { user: { selector: 'pepper', role: USER_ROLE.HABITANT } };
    expect(() => ensureSelfOrAdmin(req, 'john')).to.throw(ForbiddenError);
  });

  it('should not let a guest act on another user', () => {
    const req = { user: { selector: 'pepper', role: USER_ROLE.GUEST } };
    expect(() => ensureSelfOrAdmin(req, 'john')).to.throw(ForbiddenError);
  });

  it('should reject a request without user', () => {
    expect(() => ensureSelfOrAdmin({}, 'john')).to.throw(ForbiddenError);
  });
});
