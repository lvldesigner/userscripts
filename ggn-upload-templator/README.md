## GGn Upload Templator (GUT)

The source code is [available on Github](https://github.com/lvldesigner/userscripts/tree/main/ggn-upload-templator)

Install the userscript from [Greasy Fork](https://greasyfork.org/en/scripts/550898-ggn-upload-templator).

![](https://files.catbox.moe/d55y7g.png)

## Changelog

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
