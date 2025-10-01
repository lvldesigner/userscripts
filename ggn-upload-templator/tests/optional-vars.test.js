import { parseTemplateWithOptionals, parseMaskStructure, validateMaskWithDetails } from '../src/utils/template.js';

const tests = [
  {
    name: "Basic optional - present",
    mask: "{?[${pub}] ?}${game}",
    input: "[Pub] Game",
    expect: { pub: "Pub", game: "Game" }
  },
  {
    name: "Basic optional - absent",
    mask: "{?[${pub}] ?}${game}",
    input: "Game",
    expect: { game: "Game" }
  },
  {
    name: "Multiple optionals - all present",
    mask: "${game}{? (${year})?}{? [${ver}]?}",
    input: "Game (2024) [v1.0]",
    expect: { game: "Game", year: "2024", ver: "v1.0" }
  },
  {
    name: "Multiple optionals - partial match",
    mask: "${game}{? (${year})?}{? [${ver}]?}",
    input: "Game [v1.0]",
    expect: { game: "Game", ver: "v1.0" }
  },
  {
    name: "Multiple optionals - none present",
    mask: "${game}{? (${year})?}{? [${ver}]?}",
    input: "Game",
    expect: { game: "Game" }
  },
  {
    name: "Optional at start",
    mask: "{?${prefix}.?}${name}",
    input: "PREFIX.Name",
    expect: { prefix: "PREFIX", name: "Name" }
  },
  {
    name: "Optional at start - absent",
    mask: "{?${prefix}.?}${name}",
    input: "Name",
    expect: { name: "Name" }
  },
  {
    name: "Optional at end",
    mask: "${name}{?.${suffix}?}",
    input: "Name.SUFFIX",
    expect: { name: "Name", suffix: "SUFFIX" }
  },
  {
    name: "Optional at end - absent",
    mask: "${name}{?.${suffix}?}",
    input: "Name",
    expect: { name: "Name" }
  },
  {
    name: "Complex pattern with spaces",
    mask: "${game}{? - ${edition}?}{? (${platform})?}",
    input: "Super Game - Deluxe Edition (PS5)",
    expect: { game: "Super Game", edition: "Deluxe Edition", platform: "PS5" }
  },
  {
    name: "Complex pattern - partial",
    mask: "${game}{? - ${edition}?}{? (${platform})?}",
    input: "Super Game (PS5)",
    expect: { game: "Super Game", platform: "PS5" }
  },
  {
    name: "No optionals - regular parsing",
    mask: "${name}.${ext}",
    input: "file.txt",
    expect: { name: "file", ext: "txt" }
  },
  {
    name: "Adjacent optionals",
    mask: "${game}{?[${tag1}]?}{?[${tag2}]?}",
    input: "Game[A][B]",
    expect: { game: "Game", tag1: "A", tag2: "B" }
  },
  {
    name: "Adjacent optionals - partial",
    mask: "${game}{?[${tag1}]?}{?[${tag2}]?}",
    input: "Game[B]",
    expect: { game: "Game", tag2: "B" }
  },
  {
    name: "Greedy matching with optionals",
    mask: "${name}{? v${version}?}.${ext}",
    input: "My.Long.File.Name v2.txt",
    expect: { name: "My.Long.File.Name", version: "2", ext: "txt" }
  }
];

const errorTests = [
  {
    name: "Nested optional blocks",
    mask: "{?{?${nested}?}?}",
    expectError: "Nested optional blocks not allowed at position"
  },
  {
    name: "Unclosed optional block",
    mask: "{?${unclosed",
    expectError: "Unclosed optional block starting at position"
  },
  {
    name: "Empty optional block",
    mask: "${game}{??}",
    expectError: "Empty optional block at position"
  },
  {
    name: "Too many optional blocks",
    mask: "${a}{?1?}{?2?}{?3?}{?4?}{?5?}{?6?}{?7?}{?8?}{?9?}",
    expectError: "Too many optional blocks (9). Maximum is 8"
  },
  {
    name: "Mismatched closing bracket",
    mask: "${game}?}",
    expectError: null
  }
];

function runTests() {
  console.log("🧪 Running Optional Variables Tests\n");
  
  let passed = 0;
  let failed = 0;

  console.log("=== Success Cases ===\n");
  
  tests.forEach((test, index) => {
    try {
      const result = parseTemplateWithOptionals(test.mask, test.input);
      
      const cleanResult = {};
      for (const key in result) {
        if (!key.startsWith('_')) {
          cleanResult[key] = result[key];
        }
      }
      
      const success = JSON.stringify(cleanResult) === JSON.stringify(test.expect);
      
      if (success) {
        console.log(`✅ Test ${index + 1}: ${test.name}`);
        passed++;
      } else {
        console.log(`❌ Test ${index + 1}: ${test.name}`);
        console.log(`   Expected: ${JSON.stringify(test.expect)}`);
        console.log(`   Got:      ${JSON.stringify(cleanResult)}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ Test ${index + 1}: ${test.name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
  });

  console.log("\n=== Error Cases ===\n");
  
  errorTests.forEach((test, index) => {
    try {
      const validation = validateMaskWithDetails(test.mask);
      
      if (!validation.valid) {
        const hasExpectedError = test.expectError 
          ? validation.errors.some(e => e.message.includes(test.expectError))
          : true;
        
        if (hasExpectedError) {
          console.log(`✅ Error Test ${index + 1}: ${test.name}`);
          console.log(`   Got expected error: ${validation.errors[0]?.message}`);
          passed++;
        } else {
          console.log(`❌ Error Test ${index + 1}: ${test.name}`);
          console.log(`   Expected error containing: "${test.expectError}"`);
          console.log(`   Got: ${validation.errors[0]?.message}`);
          failed++;
        }
      } else {
        if (test.expectError === null) {
          console.log(`✅ Error Test ${index + 1}: ${test.name}`);
          console.log(`   Correctly passed validation`);
          passed++;
        } else {
          console.log(`❌ Error Test ${index + 1}: ${test.name}`);
          console.log(`   Expected error but validation passed`);
          failed++;
        }
      }
    } catch (error) {
      console.log(`❌ Error Test ${index + 1}: ${test.name}`);
      console.log(`   Unexpected error: ${error.message}`);
      failed++;
    }
  });

  console.log("\n=== Performance Test ===\n");
  
  const perfMask = "${a}{?1}{?2}{?3}{?4}{?5}{?6}{?7}{?8}";
  const perfInput = "Test12345678";
  const iterations = 100;
  
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    try {
      parseTemplateWithOptionals(perfMask, perfInput);
    } catch (e) {
    }
  }
  const end = performance.now();
  const avgTime = (end - start) / iterations;
  
  if (avgTime < 10) {
    console.log(`✅ Performance: ${avgTime.toFixed(2)}ms average (${iterations} iterations)`);
    passed++;
  } else {
    console.log(`❌ Performance: ${avgTime.toFixed(2)}ms average - Too slow! (expected < 10ms)`);
    failed++;
  }

  console.log("\n=== Results ===\n");
  console.log(`Total: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  if (failed === 0) {
    console.log("\n🎉 All tests passed!");
  } else {
    console.log(`\n❌ ${failed} test(s) failed`);
  }
  
  return failed === 0;
}

if (typeof window === 'undefined') {
  const success = runTests();
  process.exit(success ? 0 : 1);
} else {
  window.runOptionalVarsTests = runTests;
}
