import { describe, it, expect } from 'vitest';
import { parseTemplate, parseTemplateWithOptionals } from '../src/utils/template.js';
import { DEFAULT_HINTS } from '../src/hint-storage.js';

describe('Variable hints with optional blocks', () => {
  it('should test individual mask combinations', () => {
    const torrentName = 'My Game - My Book [v1][2024.01.01][Pages] {CAT1234}.pdf';
    
    const mask2 = '${game} - ${name} [${version:v*}][${date}][${layout}] {${product}}.${ext}';
    const result2 = parseTemplate(mask2, torrentName, true, DEFAULT_HINTS);
    
    const mask3 = '${game} - ${name} [${language}][${date}][${layout}] {${product}}.${ext}';
    const result3 = parseTemplate(mask3, torrentName, true, DEFAULT_HINTS);
    
    expect(result2.version).toBe('v1');
    expect(result3.language).toBe('v1');
  });
  
  it('should disambiguate adjacent optionals with hints', () => {
    const mask = '${game} - ${name} {?[${version:v*}]?}{?[${language}]?}[${date}][${layout}] {${product}}.${ext}';
    
    const result1 = parseTemplateWithOptionals(
      mask,
      'Better - My Book [English][2024.01.01][Pages] {CAT1234}.pdf',
      DEFAULT_HINTS
    );
    
    expect(result1.language).toBe('English');
    expect(result1.version).toBeUndefined();
    
    const result2 = parseTemplateWithOptionals(
      mask,
      'My Game - My Book [v1][2024.01.01][Pages] {CAT1234}.pdf',
      DEFAULT_HINTS
    );
    
    expect(result2.version).toBe('v1');
    expect(result2.language).toBeUndefined();
  });
  
  it('should prefer both optionals when both match without hints', () => {
    const mask = '${game} - ${name} {?[${version:version}]?}{?[${language}]?}[${date}][${layout}] {${product}}.${ext}';
    
    const result = parseTemplateWithOptionals(
      mask,
      'My Game - My Book [v1][English][2024.01.01][Pages] {CAT1234}.pdf',
      DEFAULT_HINTS
    );
    
    expect(result.version).toBe('v1');
    expect(result.language).toBe('English');
    expect(result._matchedOptionals).toEqual([true, true]);
  });
  
  it('should prefer first optional when both have equal score', () => {
    const mask = '${game} - ${name} {?[${version:version}]?}{?[${language}]?}[${date}][${layout}] {${product}}.${ext}';
    
    const result = parseTemplateWithOptionals(
      mask,
      'My Game - My Book [v1][2024.01.01][Pages] {CAT1234}.pdf',
      DEFAULT_HINTS
    );
    
    expect(result.version).toBe('v1');
    expect(result.language).toBeUndefined();
    expect(result._matchedOptionals).toEqual([true, false]);
  });
  
  it('should prefer second optional when first does not match', () => {
    const mask = '${game} - ${name} {?[${version:version}]?}{?[${language}]?}[${date}][${layout}] {${product}}.${ext}';
    
    const result = parseTemplateWithOptionals(
      mask,
      'My Game - My Book [English][2024.01.01][Pages] {CAT1234}.pdf',
      DEFAULT_HINTS
    );
    
    expect(result.version).toBeUndefined();
    expect(result.language).toBe('English');
    expect(result._matchedOptionals).toEqual([false, true]);
  });
  
  it('should prefer three optionals over two when all match', () => {
    const mask = '${game} {?[${version:version}]?}{?[${language}]?}{?[${edition}]?}[${date}].${ext}';
    
    const result = parseTemplateWithOptionals(
      mask,
      'My Game [v1][English][Special][2024.01.01].pdf',
      DEFAULT_HINTS
    );
    
    expect(result.version).toBe('v1');
    expect(result.language).toBe('English');
    expect(result.edition).toBe('Special');
    expect(result._matchedOptionals).toEqual([true, true, true]);
  });
  
  it('should use position tiebreaker for three equal optionals', () => {
    const mask = '${game} {?[${opt1}]?}{?[${opt2}]?}{?[${opt3}]?}[${date}].${ext}';
    
    const result = parseTemplateWithOptionals(
      mask,
      'My Game [value][2024.01.01].pdf',
      DEFAULT_HINTS
    );
    
    expect(result.opt1).toBe('value');
    expect(result.opt2).toBeUndefined();
    expect(result.opt3).toBeUndefined();
    expect(result._matchedOptionals).toEqual([true, false, false]);
  });
});
