/**
 * Test file demonstrating the enhanced label detection for form fields
 * 
 * This test demonstrates how the label detection now handles:
 * 1. Simple one input case (already worked)
 * 2. Multiple inputs with direct <label for="..."> tags
 * 3. Nested tables with hierarchical labels
 * 4. Labels with links in brackets (e.g., "Book Website: [<a>Search</a>]")
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getFieldLabel, cleanLabelText } from '../src/utils/form.js';

describe('Enhanced Label Detection', () => {
  let container;
  const config = {}; // Empty config for standard fields

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should handle simple one input case', () => {
    container.innerHTML = `
      <table>
        <tr>
          <td class="label">Aliases</td>
          <td>
            <input type="text" id="aliases" name="aliases" />
          </td>
        </tr>
      </table>
    `;

    const input = container.querySelector('input[name="aliases"]');
    const label = getFieldLabel(input, config);
    
    expect(label).toBe('Aliases');
  });

  it('should prefer direct label over parent td.label for checkboxes', () => {
    container.innerHTML = `
      <table>
        <tr id="torrent_file">
          <td class="label">Torrent File</td>
          <td>
            <input id="file" type="file" name="file_input" />
            <input type="checkbox" name="empty_group" id="empty_group" />
            <label for="empty_group">Upload Later?</label>
          </td>
        </tr>
      </table>
    `;

    const checkbox = container.querySelector('input[name="empty_group"]');
    const label = getFieldLabel(checkbox, config);
    
    // Should combine parent td.label with direct label for better context
    expect(label).toBe('Torrent File - Upload Later?');
  });

  it('should build hierarchical labels for nested table fields - metascore', () => {
    container.innerHTML = `
      <table>
        <tr>
          <td class="label">Game Rating</td>
          <td>
            <table id="reviews_table">
              <tbody>
                <tr>
                  <td class="weblinksTitle">
                    Metascore: <br />
                    <a href="http://www.metacritic.com/games">Search Metacritic</a>
                  </td>
                  <td>
                    <input type="number" id="meta" name="meta" /> / 100
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </table>
    `;

    const input = container.querySelector('input[name="meta"]');
    const label = getFieldLabel(input, config);
    
    expect(label).toBe('Game Rating - Metascore - / 100');
  });

  it('should build hierarchical labels for nested table fields - metacritic link', () => {
    container.innerHTML = `
      <table>
        <tr>
          <td class="label">Game Rating</td>
          <td>
            <table id="reviews_table">
              <tbody>
                <tr>
                  <td class="weblinksTitle">
                    Metascore: <br />
                    <a href="http://www.metacritic.com/games">Search Metacritic</a>
                  </td>
                  <td>
                    <input type="number" id="meta" name="meta" /> / 100 <br />
                    <input type="url" id="metauri" name="metauri" /> Metacritic Link
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </table>
    `;

    const input = container.querySelector('input[name="metauri"]');
    const label = getFieldLabel(input, config);
    
    expect(label).toBe('Game Rating - Metascore - Metacritic Link');
  });

  it('should handle IGN score nested field', () => {
    container.innerHTML = `
      <table>
        <tr>
          <td class="label">Game Rating</td>
          <td>
            <table id="reviews_table">
              <tbody>
                <tr>
                  <td class="weblinksTitle">
                    IGN Score: <br />
                    <a href="http://search.ign.com">Search IGN</a>
                  </td>
                  <td>
                    <input type="number" id="ignscore" name="ignscore" /> / 10 <br />
                    <input type="url" id="ignuri" name="ignuri" /> IGN Link
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </table>
    `;

    const scoreInput = container.querySelector('input[name="ignscore"]');
    const scoreLabel = getFieldLabel(scoreInput, config);
    expect(scoreLabel).toBe('Game Rating - IGN Score - / 10');

    const linkInput = container.querySelector('input[name="ignuri"]');
    const linkLabel = getFieldLabel(linkInput, config);
    expect(linkLabel).toBe('Game Rating - IGN Score - IGN Link');
  });

  it('should still append field name when multiple visible inputs exist in same cell', () => {
    container.innerHTML = `
      <table>
        <tr>
          <td class="label">Release Date</td>
          <td>
            <input type="text" name="year" />
            <input type="text" name="month" />
            <input type="text" name="day" />
          </td>
        </tr>
      </table>
    `;

    const yearInput = container.querySelector('input[name="year"]');
    const label = getFieldLabel(yearInput, config);
    
    // When multiple inputs are in same cell, field name should be appended
    expect(label).toBe('Release Date (year)');
  });

  it('should remove empty brackets from labels with links', () => {
    container.innerHTML = `
      <table>
        <tr>
          <td class="label">Web Links</td>
          <td>
            <div class="weblink">
              <label for="gameswebsiteuri">
                Book Website: [<a href="https://www.google.com/search" target="_blank">Search</a>]
              </label>
              <input type="url" id="gameswebsiteuri" name="gameswebsiteuri" />
            </div>
          </td>
        </tr>
      </table>
    `;

    const input = container.querySelector('input[name="gameswebsiteuri"]');
    const label = getFieldLabel(input, config);
    
    // Should combine parent td.label with direct label
    expect(label).toBe('Web Links - Book Website');
  });

  it('should handle multiple web link fields with brackets', () => {
    container.innerHTML = `
      <table>
        <tr>
          <td class="label">Web Links</td>
          <td>
            <div class="weblink">
              <label for="wikipediauri">
                Wikipedia: [<a href="https://en.wikipedia.org" target="_blank">Search</a>]
              </label>
              <input type="url" id="wikipediauri" name="wikipediauri" />
            </div>
            <div class="weblink">
              <label for="amazonuri">
                Amazon: [<a href="https://www.amazon.com" target="_blank">Search</a>]
              </label>
              <input type="url" id="amazonuri" name="amazonuri" />
            </div>
          </td>
        </tr>
      </table>
    `;

    const wikipediaInput = container.querySelector('input[name="wikipediauri"]');
    const wikipediaLabel = getFieldLabel(wikipediaInput, config);
    expect(wikipediaLabel).toBe('Web Links - Wikipedia');

    const amazonInput = container.querySelector('input[name="amazonuri"]');
    const amazonLabel = getFieldLabel(amazonInput, config);
    expect(amazonLabel).toBe('Web Links - Amazon');
  });

  it('should ignore hidden label elements', () => {
    container.innerHTML = `
      <table>
        <tr id="year_tr">
          <td class="label">
            <span id="year_label_not_remaster">Year</span>
            <span id="year_label_remaster" class="hidden">Year of first release</span>
          </td>
          <td>
            <input type="number" id="year" name="year" value="" />
          </td>
        </tr>
      </table>
    `;

    const input = container.querySelector('input[name="year"]');
    const label = getFieldLabel(input, config);
    
    expect(label).toBe('Year');
    expect(label).not.toContain('Year of first release');
  });
});

describe('cleanLabelText', () => {
  it('should remove empty brackets after removing links', () => {
    const input = 'Book Website: [<a href="#">Search</a>]';
    const result = cleanLabelText(input);
    expect(result).toBe('Book Website');
  });

  it('should handle multiple spaces around brackets', () => {
    const input = 'Wikipedia:  [ <a href="#">Search</a> ]';
    const result = cleanLabelText(input);
    expect(result).toBe('Wikipedia');
  });

  it('should still remove trailing colons when no brackets present', () => {
    const input = 'Simple Label:';
    const result = cleanLabelText(input);
    expect(result).toBe('Simple Label');
  });

  it('should handle labels with both brackets and trailing colons', () => {
    const input = 'Goodreads: [<a href="#">Search</a>]:';
    const result = cleanLabelText(input);
    expect(result).toBe('Goodreads');
  });

  it('should remove hidden elements from labels', () => {
    const input = '<span id="year_label_not_remaster">Year</span><span id="year_label_remaster" class="hidden">Year of first release</span>';
    const result = cleanLabelText(input);
    expect(result).toBe('Year');
  });

  it('should handle multiple hidden elements', () => {
    const input = '<span>Visible</span><span class="hidden">Hidden 1</span><span class="hidden">Hidden 2</span>';
    const result = cleanLabelText(input);
    expect(result).toBe('Visible');
  });

  it('should preserve text from standalone label links', () => {
    const input = '<a href="#">Steam ID</a>:';
    const result = cleanLabelText(input);
    expect(result).toBe('Steam ID');
  });

  it('should preserve text from standalone links without trailing colon', () => {
    const input = '<a href="#">Label Name</a>';
    const result = cleanLabelText(input);
    expect(result).toBe('Label Name');
  });

  it('should handle mixed standalone and bracketed links', () => {
    const input = '<a href="#">Main Label</a>: [<a href="#">Search</a>]';
    const result = cleanLabelText(input);
    expect(result).toBe('Main Label');
  });

  it('should preserve inline link text', () => {
    const input = 'Text before <a href="#">Link Text</a> text after';
    const result = cleanLabelText(input);
    expect(result).toBe('Text before Link Text text after');
  });

  it('should handle multiple standalone links', () => {
    const input = '<a href="#">First</a> and <a href="#">Second</a>';
    const result = cleanLabelText(input);
    expect(result).toBe('First and Second');
  });
});