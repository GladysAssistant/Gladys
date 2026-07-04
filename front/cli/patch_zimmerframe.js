const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '../node_modules/zimmerframe/package.json');

if (!fs.existsSync(pkgPath)) {
  process.exit(0);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

if (!pkg.exports || !pkg.exports['.'] || pkg.exports['.'].require) {
  process.exit(0);
}

pkg.exports['.'].require = pkg.exports['.'].import;
fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
