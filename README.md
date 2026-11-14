## NativeSearchSelect
Native select with a searchable option list, over an enumeration or a list of objects

## Features
Mendix's own native Drop-down binds an enumeration and gives you the whole list at once, with
no way to search it. That is fine for six options and unworkable for sixty: the reader has to
scroll a wheel past everything they are not looking for. This widget keeps the enumeration
binding — the options and their captions still come from the attribute itself, so there is
nothing extra to model — and puts a search box above the list.

The same widget also covers a lookup over a list of objects, where the options come from a
data source and the choice is written to an association.

* Binds an enumeration attribute, or a data source plus a reference association
* Captions come from the enumeration's own translations, in the session's language
* Search ignores accents and letter case, so `plantacion` finds **Plantación**
* Emoji and punctuation are ignored when searching and sorting, so a caption written as
  🍀Weeding still sorts under W and is still found by typing `weeding`
* Three match modes: anywhere in the text, start of a word, or all words in any order
* Options shown as modelled, or ordered by caption, ignoring accents and letter case
* Objects can carry a subtitle line and hidden extra search text, both searchable
* The search box can be hidden until the list is long enough to need it
* Optional clearing row for an attribute that is allowed to be empty
* Every part styleable, and every icon mappable
* Works offline, on both iOS and Android

## Requirements
Studio Pro **11.12** or higher. Built against Mendix Pluggable Widgets Tools 11.12.1
(React 19, React Native 0.84).

## Version history

**1.0.0** — initial release.

## Usage
Download one of the [releases](https://github.com/Entidad/mendix-react-native-searchselect/releases)
or build from source as follows

```
git clone https://github.com/Entidad/mendix-react-native-searchselect.git
cd ./mendix-react-native-searchselect
npm install
npm run build
```

Deploy `entidad.io.native.NativeSearchSelect.mpk` to `$PROJ/widgets`, then run
`Synchronize App Directory` in Studio Pro (`F4`, or `Menu / App / Synchronize App Directory`).

The widget needs an entity context, so place it inside a **Data view** or a **List view** row.

### Enumeration
Set **Options from** to `Enumeration` and bind **Value** to an enumeration attribute. Nothing
else is required. The options are the enumeration's values in the order they are modelled, and
each caption is the value's own caption for the session's language.

### Objects
Set **Options from** to `Objects`, point **Options** at a data source, set **Option caption**
to the text to show per object, and bind **Selected** to a reference association from the
context entity to the option entity.

The whole data source is retrieved and searched on the device, so it suits a reference list of
a few hundred rows rather than an open-ended table.

### Properties

| Property | Description |
| --- | --- |
| `optionsSource` | Where the options come from: the bound enumeration, or a data source |
| `enumAttribute` | Enumeration attribute holding the selection |
| `objects` | Data source holding the options |
| `selection` | Reference association the chosen object is written to |
| `optionCaption` | Text shown per object, in the list and in the closed field |
| `optionSubtitle` | Optional second line per object; searched along with the caption |
| `optionSearchText` | Further text matched against the query but never shown |
| `placeholder` | Shown in the closed field while nothing is selected |
| `dropdownIcon` | Trailing icon on the closed field; the Drop-down's own chevron is drawn when unset |
| `allowClear` | Add a row at the top of the list that empties the selection |
| `clearCaption` | Caption of that row; falls back to the placeholder |
| `searchPlaceholder` | Hint shown in the empty search box |
| `minOptionsForSearch` | Hide the search box until there are at least this many options; 0 always shows it |
| `matchMode` | `contains`, `startsWith` (start of any word) or `allWords` |
| `autoFocusSearch` | Raise the keyboard as soon as the list opens |
| `searchIcon` | Leading icon inside the search box; a magnifier is drawn when unset |
| `sortOrder` | `model` (as modelled / the data source's own order), `captionAsc` or `captionDesc` |
| `modalTitle` | Heading above the search box |
| `emptyCaption` | Shown in place of the list when nothing matches |
| `closeIcon` | Icon that closes the list; a cross is drawn when unset |
| `selectedIcon` | Icon marking the selected option; a check mark is drawn when unset |
| `onOpenAction` | Runs when the list opens, before anything is chosen |
| `onChangeAction` | Runs after a new selection has been written, and after a clear |
| `onCloseAction` | Runs when the list closes, chosen or not |

### Styling
`style` accepts the usual Mendix native design properties. The keys are

| Key | Applies to |
| --- | --- |
| `container` / `containerDisabled` | the closed field |
| `value` / `placeholder` | the closed field's text, filled and empty |
| `icon` | the dropdown icon; `fontSize` is its size |
| `modal` | the open list's background |
| `header` / `title` / `closeIcon` | the bar above the search box |
| `searchContainer` / `searchInput` / `searchIcon` | the search box |
| `searchPlaceholderColor` | `color` only — the search box's placeholder |
| `list` / `listContent` / `separator` | the list itself |
| `option` / `optionSelected` | an option row, and the selected one |
| `optionText` / `optionTextSelected` / `optionSubtitle` | an option's text |
| `selectedIcon` | the mark on the selected option |
| `empty` | the no-results text |
| `loadingColor` | `color` only — the spinner shown while objects load |

The open list covers the status bar and pads its header by a measured inset on Android and an
estimated one on iOS. Set `paddingTop` on `header` to override it.

### Overriding the default styling
Mendix uses a theme export named after the widget id, with the dots turned into underscores,
as a widget's default style — the one every instance gets with no class set on the page. Atlas
does this for its own widgets: `com_mendix_widget_native_badge_Badge` styles the Badge. For
this widget the name is

```
entidad_io_native_nativesearchselect_NativeSearchSelect
```

Export it from a theme file the app loads — `theme/native/main.js`, or a module's
`themesource/<module>/native/main.js` — and every instance picks it up:

```js
import { brand, font, input, spacing } from "../../../theme/native/custom-variables";

export const entidad_io_native_nativesearchselect_NativeSearchSelect = {
    //  The closed field, shaped like Atlas's own DropDown.valueContainer.
    container: {
        borderWidth: input.input.borderWidth,
        borderRadius: input.input.borderRadius,
        borderColor: input.input.borderColor,
        backgroundColor: input.input.backgroundColor,
        paddingHorizontal: input.input.paddingHorizontal,
        minHeight: input.input.minHeight
    },
    optionSelected: {
        backgroundColor: brand.actionLight
    },
    optionTextSelected: {
        color: brand.primary
    },
    selectedIcon: {
        color: brand.primary,
        fontSize: font.sizeH2,
        marginLeft: spacing.small
    }
};
```

Reading the values from the app's own `input` and `font` variables — the ones Atlas builds its
Text Box and Drop Down from — is what makes the widget match the stock ones, and keeps it
matching when a token changes.

Styles merge key by key, so a class only needs to name what it changes and every key it leaves
out keeps the widget's own default. That cuts both ways: a default the class does not mention
survives, so to drop one, override it rather than omit it — `marginLeft: 0` on `separator`,
not silence.

A variant for a single page goes in the same file under any other name and is set on the
widget's **Class** property, which applies over the default rather than replacing it.

## Development notes
Pluggable Widgets Tools 11.12.1 declares `engines.node` as `^22.18.0` and refuses to run at
all on Node 24. `scripts/relax-tools-node-range.js` widens that ceiling after every install;
it is wired to `postinstall`, because `npm install` rewrites the file it edits.

The toolbox artwork — `src/NativeSearchSelect.{icon,tile}[.dark].png`, which the build copies
into the `.mpk` — is drawn by `scripts/make-icons.py`, in the palette Mendix uses for its own
native widgets. It is not part of the build; run it with Pillow installed only to redraw them.

`config.projectPath` in `package.json` points at a test app that is not in the repository, so
`npm run build` leaves the `.mpk` in `dist/<version>/` and copies it nowhere. Point it at a
real app to have the build deploy there.

## Issues, suggestions and feature requests
[File an issue](https://github.com/Entidad/mendix-react-native-searchselect/issues)
