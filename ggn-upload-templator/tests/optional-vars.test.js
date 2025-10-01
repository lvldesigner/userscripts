import { describe, it, expect } from 'vitest';
import { parseTemplateWithOptionals, parseMaskStructure, validateMaskWithDetails } from '../src/utils/template.js';

describe('Optional Variables', () => {
  describe('Success Cases', () => {
    it('should parse basic optional - present', () => {
      const result = parseTemplateWithOptionals("{?[${pub}] ?}${game}", "[Pub] Game");
      expect(result).toMatchObject({ pub: "Pub", game: "Game" });
    });

    it('should parse basic optional - absent', () => {
      const result = parseTemplateWithOptionals("{?[${pub}] ?}${game}", "Game");
      expect(result).toMatchObject({ game: "Game" });
    });

    it('should parse multiple optionals - all present', () => {
      const result = parseTemplateWithOptionals("${game}{? (${year})?}{? [${ver}]?}", "Game (2024) [v1.0]");
      expect(result).toMatchObject({ game: "Game", year: "2024", ver: "v1.0" });
    });

    it('should parse multiple optionals - partial match', () => {
      const result = parseTemplateWithOptionals("${game}{? (${year})?}{? [${ver}]?}", "Game [v1.0]");
      expect(result).toMatchObject({ game: "Game", ver: "v1.0" });
    });

    it('should parse multiple optionals - none present', () => {
      const result = parseTemplateWithOptionals("${game}{? (${year})?}{? [${ver}]?}", "Game");
      expect(result).toMatchObject({ game: "Game" });
    });

    it('should parse optional at start', () => {
      const result = parseTemplateWithOptionals("{?${prefix}.?}${name}", "PREFIX.Name");
      expect(result).toMatchObject({ prefix: "PREFIX", name: "Name" });
    });

    it('should parse optional at start - absent', () => {
      const result = parseTemplateWithOptionals("{?${prefix}.?}${name}", "Name");
      expect(result).toMatchObject({ name: "Name" });
    });

    it('should parse optional at end', () => {
      const result = parseTemplateWithOptionals("${name}{?.${suffix}?}", "Name.SUFFIX");
      expect(result).toMatchObject({ name: "Name", suffix: "SUFFIX" });
    });

    it('should parse optional at end - absent', () => {
      const result = parseTemplateWithOptionals("${name}{?.${suffix}?}", "Name");
      expect(result).toMatchObject({ name: "Name" });
    });

    it('should parse complex pattern with spaces', () => {
      const result = parseTemplateWithOptionals("${game}{? - ${edition}?}{? (${platform})?}", "Super Game - Deluxe Edition (PS5)");
      expect(result).toMatchObject({ game: "Super Game", edition: "Deluxe Edition", platform: "PS5" });
    });

    it('should parse complex pattern - partial', () => {
      const result = parseTemplateWithOptionals("${game}{? - ${edition}?}{? (${platform})?}", "Super Game (PS5)");
      expect(result).toMatchObject({ game: "Super Game", platform: "PS5" });
    });

    it('should handle no optionals - regular parsing', () => {
      const result = parseTemplateWithOptionals("${name}.${ext}", "file.txt");
      expect(result).toMatchObject({ name: "file", ext: "txt" });
    });

    it('should parse adjacent optionals', () => {
      const result = parseTemplateWithOptionals("${game}{?[${tag1}]?}{?[${tag2}]?}", "Game[A][B]");
      expect(result).toMatchObject({ game: "Game", tag1: "A", tag2: "B" });
    });

    it('should parse adjacent optionals - partial', () => {
      const result = parseTemplateWithOptionals("${game}{?[${tag1}]?}{?[${tag2}]?}", "Game[B]");
      expect(result).toMatchObject({ game: "Game", tag1: "B" });
    });

    it('should handle greedy matching with optionals', () => {
      const result = parseTemplateWithOptionals("${name}{? v${version}?}.${ext}", "My.Long.File.Name v2.txt");
      expect(result).toMatchObject({ name: "My.Long.File.Name", version: "2", ext: "txt" });
    });
  });

  describe('Error Cases', () => {
    it('should reject nested optional blocks', () => {
      const validation = validateMaskWithDetails("{?{?${nested}?}?}");
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.message.includes("Nested optional blocks not allowed"))).toBe(true);
    });

    it('should reject unclosed optional block', () => {
      const validation = validateMaskWithDetails("{?${unclosed");
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.message.includes("Unclosed optional block"))).toBe(true);
    });

    it('should reject empty optional block', () => {
      const validation = validateMaskWithDetails("${game}{??}");
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.message.includes("Empty optional block"))).toBe(true);
    });

    it('should reject too many optional blocks', () => {
      const validation = validateMaskWithDetails("${a}{?1?}{?2?}{?3?}{?4?}{?5?}{?6?}{?7?}{?8?}{?9?}");
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.message.includes("Too many optional blocks"))).toBe(true);
    });

    it('should allow mismatched closing bracket (not an optional block)', () => {
      const validation = validateMaskWithDetails("${game}?}");
      expect(validation.valid).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should parse complex masks efficiently', () => {
      const mask = "${a}{?1?}{?2?}{?3?}{?4?}{?5?}{?6?}{?7?}{?8?}";
      const input = "Test12345678";
      const iterations = 100;
      
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        try {
          parseTemplateWithOptionals(mask, input);
        } catch (e) {
        }
      }
      const end = performance.now();
      const avgTime = (end - start) / iterations;
      
      expect(avgTime).toBeLessThan(10);
    });
  });
});
