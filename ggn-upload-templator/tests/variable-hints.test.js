import { describe, it, expect } from 'vitest';
import {
  parseVariableWithHint,
  parseHint,
  compileHintToRegex,
  parseTemplate,
  parseTemplateWithOptionals,
  applyValueMap
} from '../src/utils/template.js';

describe('Variable Hints', () => {
  describe('parseVariableWithHint', () => {
    it('should parse variable without hint', () => {
      const result = parseVariableWithHint('varName');
      expect(result).toEqual({ varName: 'varName', hint: null });
    });

    it('should parse variable with hint', () => {
      const result = parseVariableWithHint('varName:v*');
      expect(result).toEqual({ varName: 'varName', hint: 'v*' });
    });

    it('should handle multiple colons', () => {
      const result = parseVariableWithHint('varName:hint:extra');
      expect(result).toEqual({ varName: 'varName', hint: 'hint:extra' });
    });
  });

  describe('parseHint', () => {
    it('should detect regex pattern', () => {
      const result = parseHint('/v\\d+/');
      expect(result).toEqual({ type: 'regex', data: 'v\\d+' });
    });

    it('should detect simple pattern', () => {
      const result = parseHint('v*');
      expect(result).toEqual({ type: 'pattern', data: 'v*' });
    });

    it('should detect named hint', () => {
      const hints = {
        version: { type: 'pattern', pattern: 'v*' }
      };
      const result = parseHint('version', hints);
      expect(result).toEqual({ type: 'pattern', data: hints.version });
    });

    it('should return unknown for unrecognized hint', () => {
      const result = parseHint('unknown');
      expect(result).toEqual({ type: 'unknown', data: 'unknown' });
    });
  });

  describe('compileHintToRegex', () => {
    it('should compile wildcard pattern', () => {
      const result = compileHintToRegex('v*');
      expect(result).toBe('v.*?');
    });

    it('should compile digit pattern', () => {
      const result = compileHintToRegex('##.##.####');
      expect(result).toBe('\\d{2}\\.\\d{2}\\.\\d{4}');
    });

    it('should compile letter pattern', () => {
      const result = compileHintToRegex('@@');
      expect(result).toBe('[a-zA-Z]{2}');
    });

    it('should compile mixed pattern', () => {
      const result = compileHintToRegex('v#.#');
      expect(result).toBe('v\\d\\.\\d');
    });

    it('should handle + quantifier', () => {
      const result = compileHintToRegex('#+');
      expect(result).toBe('\\d+');
    });

    it('should compile value map hint', () => {
      const hints = {
        lang: {
          type: 'map',
          mappings: { 'en-US': 'English', 'fr-FR': 'French' }
        }
      };
      const result = compileHintToRegex('lang', hints);
      expect(result).toBe('(?:en-US|fr-FR)');
    });
  });

  describe('parseTemplate with hints', () => {
    it('should parse template with wildcard hint', () => {
      const mask = '${name} [${version:v*}]';
      const torrentName = 'My Game [v1.0]';
      const result = parseTemplate(mask, torrentName);
      expect(result).toEqual({ name: 'My Game', version: 'v1.0' });
    });

    it('should parse template with digit pattern hint', () => {
      const mask = '${name} [${date:##.##.####}]';
      const torrentName = 'My Game [01.23.2024]';
      const result = parseTemplate(mask, torrentName);
      expect(result).toEqual({ name: 'My Game', date: '01.23.2024' });
    });

    it('should parse template with regex hint', () => {
      const mask = '${name} [${version:/v\\d+\\.\\d+/}]';
      const torrentName = 'My Game [v1.0]';
      const result = parseTemplate(mask, torrentName);
      expect(result).toEqual({ name: 'My Game', version: 'v1.0' });
    });

    it('should fail to match when hint does not match', () => {
      const mask = '${name} [${version:v*}]';
      const torrentName = 'My Game [English]';
      const result = parseTemplate(mask, torrentName);
      expect(result).toEqual({});
    });
  });

  describe('Adjacent optionals disambiguation', () => {
    it('should disambiguate version and language with hints', () => {
      const hints = {
        lang_codes: {
          type: 'map',
          mappings: { 'English': 'English', 'French': 'French' }
        }
      };

      const mask = '${game} - ${name} {?[${version:v*}]?}{?[${language:lang_codes}]?}[${date}]';
      
      // Test with version
      const result1 = parseTemplateWithOptionals(
        mask,
        'My Game - My Book [v1][01.23.2024]',
        hints
      );
      expect(result1.version).toBe('v1');
      expect(result1.language).toBeUndefined();

      // Test with language
      const result2 = parseTemplateWithOptionals(
        mask,
        'Better - My Book [English][01.23.2024]',
        hints
      );
      expect(result2.language).toBe('English');
      expect(result2.version).toBeUndefined();
    });

    it('should handle both optional variables present', () => {
      const hints = {
        lang_codes: {
          type: 'map',
          mappings: { 'English': 'English' }
        }
      };

      const mask = '${game} - ${name} {?[${version:v*}]?}{?[${language:lang_codes}]?}[${date}]';
      
      const result = parseTemplateWithOptionals(
        mask,
        'My Game - My Book [v1][English][01.23.2024]',
        hints
      );
      expect(result.version).toBe('v1');
      expect(result.language).toBe('English');
    });
  });

  describe('applyValueMap', () => {
    it('should map values from value map hint', () => {
      const hints = {
        lang: {
          type: 'map',
          mappings: { 'en-US': 'English', 'fr-FR': 'French' }
        }
      };

      const mask = '${name} [${language:lang}]';
      const variables = { name: 'My Game', language: 'en-US' };
      
      const result = applyValueMap(variables, mask, hints);
      expect(result).toEqual({ name: 'My Game', language: 'English' });
    });

    it('should use literal value when strict=false and key not in map', () => {
      const hints = {
        lang: {
          type: 'map',
          strict: false,
          mappings: { 'en-US': 'English' }
        }
      };

      const mask = '${name} [${language:lang}]';
      const variables = { name: 'My Game', language: 'ja-JP' };
      
      const result = applyValueMap(variables, mask, hints);
      expect(result).toEqual({ name: 'My Game', language: 'ja-JP' });
    });

    it('should not include variable when strict=true (default) and key not in map', () => {
      const hints = {
        lang: {
          type: 'map',
          mappings: { 'en-US': 'English' }
        }
      };

      const mask = '${name} [${language:lang}]';
      const variables = { name: 'My Game', language: 'ja-JP' };
      
      const result = applyValueMap(variables, mask, hints);
      expect(result).toEqual({ name: 'My Game' });
    });
  });
});
