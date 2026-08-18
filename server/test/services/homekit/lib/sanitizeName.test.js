const { expect } = require('chai');

const { sanitizeName } = require('../../../../services/homekit/lib/sanitizeName');

// The rule hap-nodejs applies, kept here so a test failure says which side moved.
const HOMEKIT_NAME = /^[\p{L}\p{N}][\p{L}\p{N}’ '.,-]*[\p{L}\p{N}’]$/u;

describe('Sanitize name', () => {
  const cases = [
    // what integrations and users really produce
    ['Detecteur_Cave', 'Detecteur Cave'],
    ['Prise n°1', 'Prise n 1'],
    ['Salon ', 'Salon'],
    [' Salon', 'Salon'],
    ['Salon (bas)', 'Salon bas'],
    ['Capteur — cave', 'Capteur cave'],
    ['Chambre  des   parents', 'Chambre des parents'],
    // a name that ends on a character allowed only in the middle
    ['Salon.', 'Salon'],
    ['Salon,', 'Salon'],
    ['Salon-', 'Salon'],
    // accented letters are letters: a French name goes through untouched
    ['Détecteur Cave', 'Détecteur Cave'],
    ["Chambre d'amis", "Chambre d'amis"],
    ['Chambre d’amis', 'Chambre d’amis'],
    ['Pièce n° 2, étage 1', 'Pièce n 2, étage 1'],
    ['Chambre-1', 'Chambre-1'],
  ];

  cases.forEach(([given, expected]) => {
    it(`should rewrite ${JSON.stringify(given)} as ${JSON.stringify(expected)}`, () => {
      const sanitized = sanitizeName(given);

      expect(sanitized).to.equal(expected);
      expect(sanitized).to.match(HOMEKIT_NAME);
    });
  });

  it('should fall back when nothing usable is left', () => {
    expect(sanitizeName('__ ()')).to.equal('Gladys');
    expect(sanitizeName('')).to.equal('Gladys');
    expect(sanitizeName(null)).to.equal('Gladys');
    expect(sanitizeName(undefined)).to.equal('Gladys');
  });

  it('should use the given fallback rather than the default one', () => {
    expect(sanitizeName('()', 'Capteur')).to.equal('Capteur');
  });

  it('should cut a name at 64 characters, without leaving a separator at the end', () => {
    // 63 letters then a space and a letter: truncating lands on the space, which may not end a name
    const longName = `${'a'.repeat(63)} b`;
    const sanitized = sanitizeName(longName);

    expect(sanitized).to.equal('a'.repeat(63));
    expect(sanitized).to.match(HOMEKIT_NAME);
  });
});
