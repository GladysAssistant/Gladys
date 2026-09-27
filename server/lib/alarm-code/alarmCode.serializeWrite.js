/**
 * @description Run one code write at a time. Uniqueness is a read followed by a write, and a
 * bcrypt hash cannot take a unique index — each one carries its own salt — so two codes written at
 * the same instant would both find the code free and both land. Writes queue instead, which is all
 * it takes: Gladys is a single process.
 * @param {Function} write - The check-then-write to run once the queue reaches it.
 * @returns {Promise} Resolve with whatever the write returned.
 * @example
 * return this.serializeWrite(async () => db.AlarmCode.create({ code }));
 */
async function serializeWrite(write) {
  const previousWrites = this.writeQueue;
  let done;
  this.writeQueue = new Promise((resolve) => {
    done = resolve;
  });

  await previousWrites;

  try {
    return await write();
  } finally {
    done();
  }
}

module.exports = {
  serializeWrite,
};
