import translations, { englishText, fillValues } from '../src/i18n/translations';

describe('translations', () => {
  it('has every English key in Bangla too, and no extra Bangla keys', () => {
    expect(Object.keys(translations.bn).sort()).toEqual(Object.keys(translations.en).sort());
  });

  it('never has an empty text', () => {
    ['en', 'bn'].forEach((language) => {
      Object.entries(translations[language]).forEach(([key, text]) => {
        expect(`${language}:${key}:${text.trim().length > 0}`).toBe(`${language}:${key}:true`);
      });
    });
  });

  it('keeps the same {values} in both languages', () => {
    const getValues = (text) => (text.match(/\{\w+\}/g) || []).sort();
    Object.keys(translations.en).forEach((key) => {
      expect(`${key}:${getValues(translations.bn[key])}`).toBe(`${key}:${getValues(translations.en[key])}`);
    });
  });
});

describe('fillValues', () => {
  it('fills the named places', () => {
    expect(fillValues('{n} min ago', { n: 5 })).toBe('5 min ago');
  });

  it('leaves a place alone when its value is missing', () => {
    expect(fillValues('{n} min ago', {})).toBe('{n} min ago');
  });

  it('returns the text as it is without values', () => {
    expect(fillValues('Hello')).toBe('Hello');
  });
});

describe('englishText', () => {
  it('translates a key to English', () => {
    expect(englishText('time.minAgo', { n: 3 })).toBe('3 min ago');
  });

  it('returns the key itself when it does not exist', () => {
    expect(englishText('no.such.key')).toBe('no.such.key');
  });
});

describe('phrases (English sentences used as keys)', () => {
  // Reads every source file and collects the texts written as t('English sentence')
  const fs = require('fs');
  const path = require('path');
  const bnPhrases = require('../src/i18n/phrases').default;

  const collect = (folder, found) => {
    fs.readdirSync(folder, { withFileTypes: true }).forEach((entry) => {
      const fullPath = path.join(folder, entry.name);
      if (entry.isDirectory()) {
        collect(fullPath, found);
      } else if (entry.name.endsWith('.js') && !fullPath.includes(`${path.sep}i18n${path.sep}`)) {
        const source = fs.readFileSync(fullPath, 'utf8');
        // t('text') or t("text"), where the text may hold an escaped quote
        const pattern = /\bt\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g;
        let match = pattern.exec(source);
        while (match) {
          found.add((match[1] !== undefined ? match[1] : match[2]).replace(/\\'/g, "'"));
          match = pattern.exec(source);
        }
      }
    });
    return found;
  };

  const used = Array.from(collect(path.join(__dirname, '..', 'src'), new Set())).filter(
    (key) => !/^[a-z]+(\.[A-Za-z]+)+$/.test(key),
  );

  it('has a Bangla text for every sentence used in the code', () => {
    const missing = used.filter((key) => !bnPhrases[key]);
    expect(missing).toEqual([]);
  });

  it('keeps the same {values} in the Bangla text', () => {
    const getValues = (text) => (text.match(/\{\w+\}/g) || []).sort().join(',');
    Object.keys(bnPhrases).forEach((key) => {
      expect(`${key}:${getValues(bnPhrases[key])}`).toBe(`${key}:${getValues(key)}`);
    });
  });
});
