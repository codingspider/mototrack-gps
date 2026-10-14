import { makeFileName } from '../src/utils/appDownload';

describe('makeFileName', () => {
  it('keeps letters, digits, dash and underscore', () => {
    expect(makeFileName('DM GA 32-4468', '8')).toBe('certificate-DM_GA_32-4468.pdf');
  });

  it('keeps Bangla letters and digits', () => {
    expect(makeFileName('ঢাকা মেট্রো ট ১১-৯৫৭১', '8')).toBe('certificate-ঢাকা_মেট্রো_ট_১১-৯৫৭১.pdf');
  });

  it('removes characters a file name cannot have', () => {
    expect(makeFileName('Bogura / NA: 11*1516?', '8')).toBe('certificate-Bogura_NA_11_1516.pdf');
  });

  it('uses the fallback when nothing is left', () => {
    expect(makeFileName('   ', '12')).toBe('certificate-12.pdf');
    expect(makeFileName(null, '12')).toBe('certificate-12.pdf');
    expect(makeFileName('???', '12')).toBe('certificate-12.pdf');
  });
});
