const path = require('path');

// A backup produced by Gladys is named after `gladys-db-backup`, a timestamp and
// an extension (`gladys-db-backup-2026-8-25-5-18-54.tar.gz`), and the entries of
// its archive follow the same shape. Anything outside of this alphabet has no
// legitimate reason to appear in a backup name, and every character that gives a
// shell or an SQL parser a second meaning (quotes, `$`, backticks, `;`, spaces)
// is outside of it.
const SAFE_BACKUP_NAME_REGEX = /^[A-Za-z0-9._-]+$/;

/**
 * @description Tell whether a single file or folder name is a safe backup name.
 * The alphabet allows `.`, so the two names that walk the tree ("." and "..")
 * would pass it: they are rejected explicitly.
 * @param {string} name - The name to check (one path segment, no slash).
 * @returns {boolean} True when the name only contains safe characters.
 * @example
 * isSafeBackupName('gladys-db-backup-2026-8-25.tar.gz'); // true
 */
function isSafeBackupName(name) {
  if (typeof name !== 'string' || name === '.' || name === '..') {
    return false;
  }
  return SAFE_BACKUP_NAME_REGEX.test(name);
}

/**
 * @description Throw when a file or folder name is not a safe backup name.
 * @param {string} name - The name to check (one path segment, no slash).
 * @returns {string} The name, unchanged, when it is safe.
 * @example
 * assertSafeBackupName('gladys-db-backup-2026-8-25.tar.gz');
 */
function assertSafeBackupName(name) {
  if (!isSafeBackupName(name)) {
    throw new Error('BACKUP_UNSAFE_FILE_NAME');
  }
  return name;
}

/**
 * @description Tell whether an archive entry is safe to extract.
 * The entry may be nested (the Parquet folder of a backup holds its files), so
 * each segment is checked on its own: this keeps `folder/file.parquet` valid
 * while rejecting a segment carrying shell or SQL metacharacters. Path traversal
 * and absolute paths are rejected here too, so one pass covers every escape.
 * @param {string} entry - The archive entry, as listed by `tar -tzf`.
 * @returns {boolean} True when the entry is safe to extract.
 * @example
 * isSafeArchiveEntry('gladys-db-backup_parquet_folder/schema.sql'); // true
 */
function isSafeArchiveEntry(entry) {
  if (typeof entry !== 'string' || entry.length === 0) {
    return false;
  }
  if (path.posix.isAbsolute(entry)) {
    return false;
  }
  // `tar` lists a directory with a trailing slash: drop it before splitting so
  // the empty last segment does not fail an otherwise legitimate entry
  const segments = entry.replace(/\/+$/, '').split('/');
  return segments.every((segment) => isSafeBackupName(segment));
}

/**
 * @description Escape a value used inside a single-quoted SQL string literal.
 * DuckDB follows the SQL standard here: a single quote is escaped by doubling
 * it. Used for the `IMPORT DATABASE '...'` / `EXPORT DATABASE '...'` statements,
 * whose folder path cannot be passed as a bound parameter.
 * @param {string} value - The value to escape.
 * @returns {string} The value, safe to inject between single quotes.
 * @example
 * escapeSqlStringLiteral("folder'name"); // "folder''name"
 */
function escapeSqlStringLiteral(value) {
  return String(value).replace(/'/g, "''");
}

module.exports = {
  SAFE_BACKUP_NAME_REGEX,
  isSafeBackupName,
  assertSafeBackupName,
  isSafeArchiveEntry,
  escapeSqlStringLiteral,
};
