const { expect } = require('chai');

const { markdownToTelegramHtml } = require('../../../../services/telegram/lib/markdownToTelegramHtml');

describe('Telegram.markdownToTelegramHtml', () => {
  it('should return non-string and empty values untouched', () => {
    expect(markdownToTelegramHtml('')).to.equal('');
    expect(markdownToTelegramHtml(undefined)).to.equal(undefined);
    expect(markdownToTelegramHtml(null)).to.equal(null);
    expect(markdownToTelegramHtml(42)).to.equal(42);
  });

  it('should convert bold text', () => {
    expect(markdownToTelegramHtml('La température actuelle dans le salon est de **27 °C**.')).to.equal(
      'La température actuelle dans le salon est de <b>27 °C</b>.',
    );
    expect(markdownToTelegramHtml('__Bold__ too')).to.equal('<b>Bold</b> too');
  });

  it('should convert italic text', () => {
    expect(markdownToTelegramHtml('It is *quite* warm')).to.equal('It is <i>quite</i> warm');
    expect(markdownToTelegramHtml('_Italic_ at the beginning')).to.equal('<i>Italic</i> at the beginning');
  });

  it('should not convert underscores inside a word', () => {
    expect(markdownToTelegramHtml('The device_feature_name is used')).to.equal('The device_feature_name is used');
  });

  it('should convert strikethrough text', () => {
    expect(markdownToTelegramHtml('~~Not anymore~~')).to.equal('<s>Not anymore</s>');
  });

  it('should escape HTML characters', () => {
    expect(markdownToTelegramHtml('5 < 6 & 7 > 6 "quoted"')).to.equal('5 &lt; 6 &amp; 7 &gt; 6 &quot;quoted&quot;');
  });

  it('should not let an HTML tag written by the user through', () => {
    expect(markdownToTelegramHtml('<script>alert(1)</script>')).to.equal('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('should convert a markdown link', () => {
    expect(markdownToTelegramHtml('See [the docs](https://gladysassistant.com/docs)')).to.equal(
      'See <a href="https://gladysassistant.com/docs">the docs</a>',
    );
  });

  it('should convert a markdown link with a title', () => {
    expect(markdownToTelegramHtml('See [the docs](https://gladysassistant.com "Docs")')).to.equal(
      'See <a href="https://gladysassistant.com">the docs</a>',
    );
  });

  it('should use the url as label when the link label is empty', () => {
    expect(markdownToTelegramHtml('[](https://gladysassistant.com)')).to.equal(
      '<a href="https://gladysassistant.com">https://gladysassistant.com</a>',
    );
  });

  it('should keep a link with an unsupported scheme as plain text', () => {
    expect(markdownToTelegramHtml('[click](javascript:alert(1))')).to.equal('[click](javascript:alert(1))');
  });

  it('should keep only the alt text of an image', () => {
    expect(markdownToTelegramHtml('![a camera](https://example.com/image.jpg)')).to.equal('a camera');
  });

  it('should convert headings to bold', () => {
    expect(markdownToTelegramHtml('## Salon\nIl fait chaud')).to.equal('<b>Salon</b>\nIl fait chaud');
    expect(markdownToTelegramHtml('# Titre #')).to.equal('<b>Titre</b>');
  });

  it('should convert unordered lists to bullets', () => {
    expect(markdownToTelegramHtml('- Salon\n* Cuisine\n+ Chambre')).to.equal('• Salon\n• Cuisine\n• Chambre');
  });

  it('should keep the indentation of a nested list', () => {
    expect(markdownToTelegramHtml('- Salon\n  - Lampe')).to.equal('• Salon\n  • Lampe');
  });

  it('should keep ordered lists numbered', () => {
    expect(markdownToTelegramHtml('1. Salon\n2) Cuisine')).to.equal('1. Salon\n2. Cuisine');
  });

  it('should convert an horizontal rule to an empty line', () => {
    expect(markdownToTelegramHtml('Salon\n\n---\n\nCuisine')).to.equal('Salon\n\n\n\nCuisine');
  });

  it('should convert a blockquote', () => {
    expect(markdownToTelegramHtml('> Line one\n> Line two\nAfter')).to.equal(
      '<blockquote>Line one\nLine two</blockquote>\nAfter',
    );
  });

  it('should convert a blockquote at the end of the message', () => {
    expect(markdownToTelegramHtml('Before\n> Quoted')).to.equal('Before\n<blockquote>Quoted</blockquote>');
  });

  it('should convert inline code', () => {
    expect(markdownToTelegramHtml('Use `npm run start` to start')).to.equal('Use <code>npm run start</code> to start');
  });

  it('should not convert markdown inside inline code', () => {
    expect(markdownToTelegramHtml('`**not bold**`')).to.equal('<code>**not bold**</code>');
  });

  it('should convert a fenced code block with a language', () => {
    expect(markdownToTelegramHtml('```js\nconst a = 1 < 2;\n```')).to.equal(
      '<pre><code class="language-js">const a = 1 &lt; 2;</code></pre>',
    );
  });

  it('should convert a fenced code block without a language', () => {
    expect(markdownToTelegramHtml('```\nhello\n```')).to.equal('<pre>hello</pre>');
  });

  it('should drop the separator row of a table', () => {
    expect(markdownToTelegramHtml('| Room | Temp |\n| --- | --- |\n| Salon | 27 |')).to.equal(
      '| Room | Temp |\n| Salon | 27 |',
    );
  });

  it('should remove the placeholder characters coming from the input', () => {
    const withPlaceholderChars = `a${String.fromCharCode(0)}0${String.fromCharCode(1)}b`;
    expect(markdownToTelegramHtml(withPlaceholderChars)).to.equal('a0b');
  });

  it('should convert a full AI answer', () => {
    const answer = [
      '## Salon',
      '',
      'La température actuelle est de **27 °C**, et l’humidité de *55 %*.',
      '',
      '- Capteur : `temperature-salon`',
      '- [Voir le détail](https://gladysassistant.com/dashboard)',
    ].join('\n');
    expect(markdownToTelegramHtml(answer)).to.equal(
      [
        '<b>Salon</b>',
        '',
        'La température actuelle est de <b>27 °C</b>, et l’humidité de <i>55 %</i>.',
        '',
        '• Capteur : <code>temperature-salon</code>',
        '• <a href="https://gladysassistant.com/dashboard">Voir le détail</a>',
      ].join('\n'),
    );
  });
});
