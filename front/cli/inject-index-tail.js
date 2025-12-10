const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envFile = path.join(process.cwd(), '.env');
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

const rawSnippet = process.env.GLADYS_FRONT_INDEX_APPEND;
const base64Snippet = process.env.GLADYS_FRONT_INDEX_APPEND_BASE64;

let snippet = rawSnippet;

if (!snippet && base64Snippet) {
  try {
    snippet = Buffer.from(base64Snippet, 'base64').toString('utf-8');
  } catch (e) {
    console.error('Unable to decode GLADYS_FRONT_INDEX_APPEND_BASE64.');
    process.exit(1);
  }
}

if (!snippet) {
  process.exit(0);
}

const indexPath = path.join(process.cwd(), 'build', 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('build/index.html not found.');
  process.exit(1);
}

const htmlContent = fs.readFileSync(indexPath, 'utf-8');
let updatedContent;

if (htmlContent.includes('</body>')) {
  updatedContent = htmlContent.replace('</body>', `${snippet}\n</body>`);
} else {
  updatedContent = `${htmlContent}\n${snippet}\n`;
}

fs.writeFileSync(indexPath, updatedContent);
