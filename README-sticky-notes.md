# Sticky Notes Module for Ryori-Bon

A lightweight, vanilla JavaScript module that adds an interactive sticky notes system to your website. Perfect for recipe annotations, cooking reminders, and personal notes.

## Features

- 🗒️ **Create & Edit Notes**: Click to create, type to edit
- 🎨 **5 Color Options**: Yellow, blue, green, pink, and orange themes
- 🖱️ **Drag & Drop**: Intuitive note positioning with mouse and touch support
- 💾 **Auto-Save**: Notes persist between browser sessions using localStorage
- 📱 **Mobile Friendly**: Touch gestures for mobile devices
- 🎯 **Easy Integration**: Simple drop-in module with minimal setup
- 📤 **Import/Export**: Backup and restore your notes as JSON files

## Quick Start

1. **Include the module** in your HTML:
```html
<script src="sticky-notes.js"></script>
```

2. **Initialize** the sticky notes system:
```javascript
document.addEventListener('DOMContentLoaded', function() {
    const stickyNotes = new StickyNotesManager({
        storageKey: 'my-app-notes',
        container: 'body'
    });
});
```

3. **Start using**! A floating "+" button will appear in the bottom-right corner.

## Demo

Open `sticky-notes-demo.html` in your browser to see the sticky notes system in action with sample functionality.

## API Reference

### Constructor Options

```javascript
new StickyNotesManager({
    storageKey: 'my-notes',  // localStorage key (default: 'ryori-bon-sticky-notes')
    container: 'body'        // Container selector (default: 'body')
})
```

### Public Methods

#### `addNote(text, x, y, color)`
Create a new sticky note programmatically.
```javascript
stickyNotes.addNote('Hello World!', 100, 100, 'yellow');
```

#### `getAllNotes()`
Get all notes data.
```javascript
const notes = stickyNotes.getAllNotes();
```

#### `removeNote(id)`
Delete a specific note by ID.
```javascript
stickyNotes.removeNote('note_12345');
```

#### `clearAllNotes()`
Delete all notes.
```javascript
stickyNotes.clearAllNotes();
```

#### `exportNotes()`
Export all notes as JSON data.
```javascript
const exportData = stickyNotes.exportNotes();
```

#### `importNotes(data)`
Import notes from JSON data.
```javascript
stickyNotes.importNotes(exportData);
```

#### `destroy()`
Clean up and remove the sticky notes system.
```javascript
stickyNotes.destroy();
```

## User Interface

### Creating Notes
- Click the green "+" floating action button (bottom-right corner)
- Notes appear with a random position and default yellow color
- Click inside the note area to start typing

### Moving Notes
- Click and hold the note header (top section with timestamp)
- Drag to reposition the note anywhere on screen
- Notes stay within viewport bounds automatically

### Customizing Notes
- Use the color dropdown in the header to change note colors
- Available colors: Yellow, Blue, Green, Pink, Orange
- Each color has a unique gradient and border styling

### Deleting Notes
- Click the "×" button in the note header
- Deletion is immediate (no confirmation dialog)

## Data Storage

Notes are automatically saved to browser localStorage with the following structure:

```json
{
  "notes": [
    {
      "id": "note_1635789012345_abc123",
      "x": 100,
      "y": 150,
      "text": "My recipe note",
      "color": "yellow",
      "timestamp": "11/1/2025, 10:30:15 AM",
      "zIndex": 1001
    }
  ],
  "exportDate": "2025-11-01T17:30:15.123Z",
  "version": "1.0"
}
```

## Styling

The module injects CSS automatically, but you can customize colors and appearance by overriding these CSS classes:

- `.sticky-note` - Main note container
- `.sticky-note-header` - Note header area
- `.sticky-note-content` - Note content area
- `.sticky-note-textarea` - Text input area
- `.sticky-note-create-btn` - Floating action button

### Color Classes
- `.sticky-note.color-yellow`
- `.sticky-note.color-blue`
- `.sticky-note.color-green`
- `.sticky-note.color-pink`
- `.sticky-note.color-orange`

## Browser Compatibility

- ✅ Modern browsers (Chrome 60+, Firefox 55+, Safari 12+, Edge 79+)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile, Samsung Internet)
- ✅ Touch and mouse input supported
- ⚠️ Requires ES6 features (classes, arrow functions, template literals)

## Integration with Ryori-Bon

The sticky notes module is designed to complement the Ryori-Bon recipe app:

1. **Recipe Annotations**: Add notes to specific recipes with cooking tips
2. **Shopping Lists**: Create shopping reminders for recipe ingredients  
3. **Cooking Timers**: Set visual reminders for cooking times and temperatures
4. **Rating System**: Rate and comment on tried recipes
5. **Family Notes**: Share cooking tips between family members

## File Structure

```
/Ryori-Bon/
├── sticky-notes.js          # Main module file
├── sticky-notes-demo.html   # Standalone demo page
├── index.html              # Main app (with sticky notes integrated)
└── README-sticky-notes.md  # This documentation
```

## Customization Examples

### Custom Colors
```css
.sticky-note.color-custom {
    background: linear-gradient(135deg, #e1bee7 0%, #ce93d8 100%);
    border-color: #8e24aa;
}
```

### Different Sizes
```css
.sticky-note.size-large {
    width: 300px;
    min-height: 200px;
}
```

### Custom Positioning
```javascript
// Create note at specific position
stickyNotes.addNote('Top-left note', 20, 20, 'blue');

// Create note relative to an element
const rect = document.getElementById('recipe-card').getBoundingClientRect();
stickyNotes.addNote('Recipe note', rect.right + 10, rect.top, 'green');
```

## Troubleshooting

### Notes not saving
- Check if localStorage is available and enabled
- Ensure the storage key doesn't conflict with other apps
- Check browser storage quota (usually not an issue with text notes)

### Performance with many notes
- The module handles hundreds of notes efficiently
- Consider implementing pagination for 1000+ notes
- Use `clearAllNotes()` periodically to clean up old notes

### Mobile touch issues
- Ensure viewport meta tag is set: `<meta name="viewport" content="width=device-width, initial-scale=1">`
- Test with `touch-action: none` CSS if needed
- Some browsers may require pointer events polyfill

## License

This module is part of the Ryori-Bon project and follows the same licensing terms.

## Contributing

Feel free to submit issues and enhancement requests! The module is designed to be lightweight and focused, but improvements are always welcome.

---

**Happy note-taking! 📝🍜**