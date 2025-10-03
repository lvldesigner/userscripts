## GGn Upload Templator (GUT)

The source code is [available on Github](https://github.com/lvldesigner/userscripts/tree/main/ggn-upload-templator)

Install the userscript from [Greasy Fork](https://greasyfork.org/en/scripts/550898-ggn-upload-templator).

![](https://files.catbox.moe/d55y7g.png)

## Changelog

### v0.11

This is mostly a UX/UI fixes and improvements release.

![](https://files.catbox.moe/mum36l.png)

- All variable hints are now treated equally, there's no more default/custom hints, this allows editing/deleting any hint, including previously default ones. You can reset to default using the new button.
- Matched variable values are now truncated to sane lengths, hover over them to see full match highlighted in the torrent name.
- Fix match highlights not working properly when the matched value is too long
- Modals get scaled down the further up the stack you go, i.e: if you have one modal open then you open another on top of it, that gets scaled down so you visually distinguish there are two modals
- Modal width can be resized to your liking by dragging on the left/right edge
- Show number of extracted variables under the template selector, even if the number is 0
- Fix regression: Changing selected template MUST NOT automatically apply the template.

### v0.10

![](https://files.catbox.moe/qtnzfw.png)

- Add variable hints that allows for viarble disambiguation and advanced pattern matching.
- Toggle to show compiled regex in Mask Sandbox
- Fix: Allow optionals to consist of white space
- UX: Modals have fixed headers and footers now


### v0.9

![](https://files.catbox.moe/g4mclk.png)

- Add Mask Sandbox for testing masks against multiple sample names

### v0.8

![](https://files.catbox.moe/7xkrsw.png)

- Add optional variables with `{? ... ?}` syntax for flexible filename matching
- Remove greedy matching setting (now uses smart non-greedy parsing by default)

### v0.7

![](https://files.catbox.moe/snd92p.png)

- Add mask validation and highlighting with helpful messages
- Fix: No longer inserts `${varname}` in fields if `${varname}` is empty/not found

### v0.6
- Added support for variables defined in the comment field of a torrent file. These are extracted as `${_foo}`, `${_bar}`, starting with an underscore. Mask variables cannot be defined with an underscore in the beginnig of their name.
The format for variables in the comment field is this:

```
foo=wowie;bar=fancy;
```
- Show variable count under the template selector. Clicking it shows a modal with all variables and their values.

### v0.5.1
- Fix: Use textarea for textarea fields instead of text input, respect newlines.

### v0.5
- BREAKING CHANGE: Templates are no longer auto-applied when a file is selected. You have to either press the new Apply Template button or use the default keybinding: Ctrl+Shift+A
- You can now customize keybindings for Form submission and Apply Template in the settings

### v0.4.1: Mocha Special
- Going forward, posting the unminified version of the userscript

### v0.4
- Added support for choosing select field values based on extracted variables

### v0.3
- Added support for extra custom fields to be included in the template (e.g: [GGn Infobox Builder](https://greasyfork.org/en/scripts/543815-ggn-infobox-builder/))

### v0.2
- Changed variable format from {var} to ${var}
- Added support to escape special characters, e.g: \$ \{ \}
- Added section to show list of extracted variables
- Add edit shortcut for selected template

### v0.1
Initial version
