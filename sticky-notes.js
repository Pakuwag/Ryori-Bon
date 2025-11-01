/**
 * Sticky Notes Module for Ryori-Bon
 * A lightweight JavaScript module for creating and managing sticky notes
 */

class StickyNotesManager {
    constructor(options = {}) {
        this.storageKey = options.storageKey || 'ryori-bon-sticky-notes';
        this.containerSelector = options.container || 'body';
        this.notes = this.loadNotes();
        this.dragState = {
            isDragging: false,
            currentNote: null,
            offset: { x: 0, y: 0 }
        };
        
        this.resizeState = {
            isResizing: false,
            currentNote: null,
            startX: 0,
            startY: 0,
            startWidth: 0,
            startHeight: 0
        };
        
        // Throttle saving during resize to improve performance
        this.resizeSaveTimeout = null;
        
        // Initialize the module
        this.init();
    }

    init() {
        this.injectStyles();
        this.bindEvents();
        this.renderExistingNotes();
    }

    injectStyles() {
        const styleId = 'sticky-notes-styles';
        if (document.getElementById(styleId)) return;

        const styles = `
            @import url('https://fonts.googleapis.com/css2?family=Aleo:wght@300;400;700&display=swap');
            
            .sticky-notes-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9999;
            }

            .sticky-note {
                position: absolute;
                width: 200px;
                min-width: 150px;
                max-width: 400px;
                min-height: 120px;
                max-height: 600px;
                background: linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%);
                border: 1px solid #e91e63;
                border-radius: 4px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                font-family: "Aleo", serif;
                font-size: 14px;
                cursor: move;
                pointer-events: auto;
                transform: rotate(-2deg);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                overflow: hidden;
            }

            .sticky-note:nth-child(even) {
                transform: rotate(1deg);
            }

            .sticky-note:hover {
                transform: rotate(0deg) scale(1.02);
                box-shadow: 0 6px 12px rgba(0,0,0,0.3);
                z-index: 10000;
            }

            .sticky-note.dragging {
                transform: rotate(0deg) scale(1.05);
                box-shadow: 0 8px 16px rgba(0,0,0,0.4);
                z-index: 10001;
            }

            .sticky-note.resizing {
                transform: rotate(0deg);
                box-shadow: 0 8px 16px rgba(0,0,0,0.4);
                z-index: 10001;
            }

            .sticky-note-header {
                background: rgba(245, 127, 23, 0.2);
                padding: 6px 8px;
                border-bottom: 1px solid rgba(245, 127, 23, 0.3);
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: move;
            }

            .sticky-note-timestamp {
                font-size: 10px;
                color: #666;
                font-weight: normal;
            }

            .sticky-note-close {
                background: #999;
                color: white;
                border: none;
                border-radius: 50%;
                width: 14px;
                height: 14px;
                font-size: 10px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            }

            .sticky-note-close:hover {
                background: #666;
            }

            .sticky-note-content {
                padding: 8px;
                height: calc(100% - 32px);
                min-height: 80px;
                position: relative;
            }

            .sticky-note-textarea {
                width: 100%;
                height: 100%;
                border: none;
                background: transparent;
                resize: none;
                outline: none;
                font-family: inherit;
                font-size: inherit;
                line-height: 1.4;
            }

            .sticky-note-resize-handle {
                position: absolute;
                bottom: 0;
                right: 0;
                width: 12px;
                height: 12px;
                cursor: nw-resize;
                background: linear-gradient(-45deg, transparent 30%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.1) 40%, transparent 40%, transparent 60%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.1) 70%, transparent 70%);
                border-radius: 0 0 4px 0;
            }

            .sticky-note-resize-handle:hover {
                background: linear-gradient(-45deg, transparent 30%, rgba(0,0,0,0.2) 30%, rgba(0,0,0,0.2) 40%, transparent 40%, transparent 60%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.2) 70%, transparent 70%);
            }

            .sticky-note-create-btn {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #4caf50, #388e3c);
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 9998;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                font-weight: bold;
            }

            .sticky-note-create-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 16px rgba(0,0,0,0.4);
            }

            .sticky-note-create-btn:active {
                transform: scale(0.95);
            }

            /* Color variants */
            .sticky-note.color-pink {
                background: linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%);
                border-color: #e91e63;
            }

            .sticky-note.color-lavender {
                background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
                border-color: #9c27b0;
            }

            .sticky-note.color-blue {
                background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                border-color: #2196f3;
            }
        `;

        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }

    bindEvents() {
        // Create floating action button
        this.createFloatingButton();

        // Bind global events
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Touch events for mobile
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    createFloatingButton() {
        const existingBtn = document.getElementById('sticky-notes-fab');
        if (existingBtn) return;

        const fab = document.createElement('button');
        fab.id = 'sticky-notes-fab';
        fab.className = 'sticky-note-create-btn';
        fab.innerHTML = '+';
        fab.title = 'Add sticky note';
        fab.addEventListener('click', () => this.createNote());
        
        document.body.appendChild(fab);
    }

    createNotesContainer() {
        let container = document.getElementById('sticky-notes-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'sticky-notes-container';
            container.className = 'sticky-notes-container';
            document.body.appendChild(container);
        }
        return container;
    }

    createNote(x = null, y = null, text = '', color = 'pink', width = 200, height = 120) {
        const container = this.createNotesContainer();
        const note = {
            id: this.generateId(),
            x: x !== null ? x : Math.random() * (window.innerWidth - 220) + 20,
            y: y !== null ? y : Math.random() * (window.innerHeight - 150) + 50,
            width: width,
            height: height,
            text: text,
            color: color,
            timestamp: new Date().toLocaleString(),
            zIndex: this.getNextZIndex()
        };

        this.notes.push(note);
        this.saveNotes();
        this.renderNote(note, container);
        
        // Focus on the textarea
        setTimeout(() => {
            const noteElement = document.querySelector(`[data-note-id="${note.id}"] textarea`);
            if (noteElement) noteElement.focus();
        }, 100);

        return note;
    }

    renderNote(note, container) {
        const noteElement = document.createElement('div');
        noteElement.className = `sticky-note color-${note.color}`;
        noteElement.setAttribute('data-note-id', note.id);
        noteElement.style.left = `${note.x}px`;
        noteElement.style.top = `${note.y}px`;
        
        // Ensure width and height are properly set
        const width = note.width || 200;
        const height = note.height || 120;
        noteElement.style.width = `${width}px`;
        noteElement.style.height = `${height}px`;
        noteElement.style.zIndex = note.zIndex;
        
        // Update note data if it was missing width/height
        if (!note.width || !note.height) {
            note.width = width;
            note.height = height;
            this.saveNotes();
        }

        const colors = ['pink', 'lavender', 'blue'];
        const colorOptions = colors.map(c => 
            `<option value="${c}" ${c === note.color ? 'selected' : ''}>${c}</option>`
        ).join('');

        noteElement.innerHTML = `
            <div class="sticky-note-header">
                <div class="sticky-note-timestamp">${note.timestamp}</div>
                <select class="sticky-note-color-picker" style="font-size: 10px; border: none; background: transparent;">
                    ${colorOptions}
                </select>
                <button class="sticky-note-close" title="Delete note">×</button>
            </div>
            <div class="sticky-note-content">
                <textarea class="sticky-note-textarea" placeholder="Type your note here...">${note.text}</textarea>
                <div class="sticky-note-resize-handle" title="Drag to resize"></div>
            </div>
        `;

        // Bind events
        const closeBtn = noteElement.querySelector('.sticky-note-close');
        const textarea = noteElement.querySelector('.sticky-note-textarea');
        const colorPicker = noteElement.querySelector('.sticky-note-color-picker');
        const resizeHandle = noteElement.querySelector('.sticky-note-resize-handle');

        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteNote(note.id);
        });

        textarea.addEventListener('input', (e) => {
            this.updateNoteText(note.id, e.target.value);
        });

        colorPicker.addEventListener('change', (e) => {
            this.updateNoteColor(note.id, e.target.value);
        });

        // Resize handle events
        resizeHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.startResizing(noteElement, e.clientX, e.clientY);
        });

        resizeHandle.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const touch = e.touches[0];
            this.startResizing(noteElement, touch.clientX, touch.clientY);
        }, { passive: false });

        container.appendChild(noteElement);
    }

    renderExistingNotes() {
        const container = this.createNotesContainer();
        container.innerHTML = ''; // Clear existing notes
        
        this.notes.forEach(note => {
            this.renderNote(note, container);
        });
    }

    updateNoteText(id, text) {
        const note = this.notes.find(n => n.id === id);
        if (note) {
            note.text = text;
            this.saveNotes();
        }
    }

    updateNoteColor(id, color) {
        const note = this.notes.find(n => n.id === id);
        if (note) {
            note.color = color;
            const noteElement = document.querySelector(`[data-note-id="${id}"]`);
            if (noteElement) {
                noteElement.className = `sticky-note color-${color}`;
            }
            this.saveNotes();
        }
    }

    deleteNote(id) {
        this.notes = this.notes.filter(n => n.id !== id);
        const noteElement = document.querySelector(`[data-note-id="${id}"]`);
        if (noteElement) {
            noteElement.remove();
        }
        this.saveNotes();
    }

    // Drag and drop functionality
    handleMouseDown(e) {
        const noteElement = e.target.closest('.sticky-note');
        if (!noteElement || e.target.closest('.sticky-note-close, .sticky-note-textarea, .sticky-note-color-picker, .sticky-note-resize-handle')) return;

        this.startDragging(noteElement, e.clientX, e.clientY);
    }

    handleTouchStart(e) {
        const noteElement = e.target.closest('.sticky-note');
        if (!noteElement || e.target.closest('.sticky-note-close, .sticky-note-textarea, .sticky-note-color-picker, .sticky-note-resize-handle')) return;

        e.preventDefault();
        const touch = e.touches[0];
        this.startDragging(noteElement, touch.clientX, touch.clientY);
    }

    startDragging(noteElement, clientX, clientY) {
        const rect = noteElement.getBoundingClientRect();
        const noteId = noteElement.getAttribute('data-note-id');
        
        this.dragState = {
            isDragging: true,
            currentNote: noteElement,
            noteId: noteId,
            offset: {
                x: clientX - rect.left,
                y: clientY - rect.top
            }
        };

        noteElement.classList.add('dragging');
        noteElement.style.zIndex = this.getNextZIndex();
        
        // Update z-index in data
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            note.zIndex = parseInt(noteElement.style.zIndex);
            this.saveNotes();
        }
    }

    handleMouseMove(e) {
        if (this.dragState.isDragging) {
            this.updateNotePosition(e.clientX, e.clientY);
        } else if (this.resizeState.isResizing) {
            this.updateNoteSize(e.clientX, e.clientY);
        }
    }

    handleTouchMove(e) {
        if (this.dragState.isDragging || this.resizeState.isResizing) {
            e.preventDefault();
            const touch = e.touches[0];
            if (this.dragState.isDragging) {
                this.updateNotePosition(touch.clientX, touch.clientY);
            } else if (this.resizeState.isResizing) {
                this.updateNoteSize(touch.clientX, touch.clientY);
            }
        }
    }

    updateNotePosition(clientX, clientY) {
        const { currentNote, offset } = this.dragState;
        const x = clientX - offset.x;
        const y = clientY - offset.y;

        // Keep note within viewport bounds
        const maxX = window.innerWidth - currentNote.offsetWidth;
        const maxY = window.innerHeight - currentNote.offsetHeight;
        
        const boundedX = Math.max(0, Math.min(x, maxX));
        const boundedY = Math.max(0, Math.min(y, maxY));

        currentNote.style.left = `${boundedX}px`;
        currentNote.style.top = `${boundedY}px`;
    }

    handleMouseUp() {
        if (this.dragState.isDragging) {
            this.stopDragging();
        } else if (this.resizeState.isResizing) {
            this.stopResizing();
        }
    }

    handleTouchEnd() {
        if (this.dragState.isDragging) {
            this.stopDragging();
        } else if (this.resizeState.isResizing) {
            this.stopResizing();
        }
    }

    stopDragging() {
        if (!this.dragState.isDragging) return;

        const { currentNote, noteId } = this.dragState;
        currentNote.classList.remove('dragging');

        // Update note position in data
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            note.x = parseInt(currentNote.style.left);
            note.y = parseInt(currentNote.style.top);
            this.saveNotes();
        }

        this.dragState = {
            isDragging: false,
            currentNote: null,
            offset: { x: 0, y: 0 }
        };
    }

    // Resize functionality
    startResizing(noteElement, clientX, clientY) {
        const noteId = noteElement.getAttribute('data-note-id');
        const rect = noteElement.getBoundingClientRect();
        
        this.resizeState = {
            isResizing: true,
            currentNote: noteElement,
            noteId: noteId,
            startX: clientX,
            startY: clientY,
            startWidth: rect.width,
            startHeight: rect.height
        };

        noteElement.classList.add('resizing');
        noteElement.style.zIndex = this.getNextZIndex();
        
        // Update z-index in data
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            note.zIndex = parseInt(noteElement.style.zIndex);
            this.saveNotes();
        }
    }

    updateNoteSize(clientX, clientY) {
        const { currentNote, startX, startY, startWidth, startHeight, noteId } = this.resizeState;
        
        const deltaX = clientX - startX;
        const deltaY = clientY - startY;
        
        let newWidth = startWidth + deltaX;
        let newHeight = startHeight + deltaY;
        
        // Apply constraints
        newWidth = Math.max(150, Math.min(newWidth, 400));
        newHeight = Math.max(120, Math.min(newHeight, 600));
        
        currentNote.style.width = `${newWidth}px`;
        currentNote.style.height = `${newHeight}px`;
        
        // Throttled save during resize (debounced by 100ms)
        if (this.resizeSaveTimeout) {
            clearTimeout(this.resizeSaveTimeout);
        }
        
        this.resizeSaveTimeout = setTimeout(() => {
            const note = this.notes.find(n => n.id === noteId);
            if (note) {
                note.width = newWidth;
                note.height = newHeight;
                this.saveNotes();
            }
        }, 100);
    }

    stopResizing() {
        if (!this.resizeState.isResizing) return;

        const { currentNote, noteId } = this.resizeState;
        currentNote.classList.remove('resizing');

        // Clear any pending save timeout
        if (this.resizeSaveTimeout) {
            clearTimeout(this.resizeSaveTimeout);
            this.resizeSaveTimeout = null;
        }

        // Final save when resize is complete
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            note.width = parseInt(currentNote.style.width);
            note.height = parseInt(currentNote.style.height);
            this.saveNotes();
        }

        this.resizeState = {
            isResizing: false,
            currentNote: null,
            startX: 0,
            startY: 0,
            startWidth: 0,
            startHeight: 0
        };
    }

    // Utility methods
    generateId() {
        return 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getNextZIndex() {
        const maxZ = Math.max(...this.notes.map(n => n.zIndex || 1000), 1000);
        return maxZ + 1;
    }

    loadNotes() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            const notes = stored ? JSON.parse(stored) : [];
            
            // Migrate notes that don't have width/height data
            let needsMigration = false;
            notes.forEach(note => {
                if (typeof note.width === 'undefined' || typeof note.height === 'undefined') {
                    note.width = note.width || 200;
                    note.height = note.height || 120;
                    needsMigration = true;
                }
            });
            
            // Save migrated data immediately
            if (needsMigration) {
                console.log('Migrating sticky notes with missing size data...');
                localStorage.setItem(this.storageKey, JSON.stringify(notes));
            }
            
            return notes;
        } catch (error) {
            console.warn('Failed to load sticky notes:', error);
            return [];
        }
    }

    saveNotes() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.notes));
        } catch (error) {
            console.warn('Failed to save sticky notes:', error);
        }
    }

    // Public API methods
    getAllNotes() {
        return [...this.notes];
    }

    addNote(text = '', x = null, y = null, color = 'pink', width = 200, height = 120) {
        return this.createNote(x, y, text, color, width, height);
    }

    removeNote(id) {
        this.deleteNote(id);
    }

    clearAllNotes() {
        this.notes = [];
        const container = document.getElementById('sticky-notes-container');
        if (container) {
            container.innerHTML = '';
        }
        this.saveNotes();
    }

    exportNotes() {
        return {
            notes: this.notes,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
    }

    importNotes(data) {
        if (data && Array.isArray(data.notes)) {
            this.notes = data.notes;
            this.saveNotes();
            this.renderExistingNotes();
        }
    }

    // Destroy the module
    destroy() {
        // Clear any pending timeouts
        if (this.resizeSaveTimeout) {
            clearTimeout(this.resizeSaveTimeout);
            this.resizeSaveTimeout = null;
        }
        
        // Remove all notes
        const container = document.getElementById('sticky-notes-container');
        if (container) container.remove();
        
        // Remove floating button
        const fab = document.getElementById('sticky-notes-fab');
        if (fab) fab.remove();
        
        // Remove styles
        const styles = document.getElementById('sticky-notes-styles');
        if (styles) styles.remove();
        
        // Remove event listeners
        document.removeEventListener('mousedown', this.handleMouseDown);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('touchstart', this.handleTouchStart);
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchend', this.handleTouchEnd);
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StickyNotesManager;
} else if (typeof define === 'function' && define.amd) {
    define([], function() { return StickyNotesManager; });
} else {
    window.StickyNotesManager = StickyNotesManager;
}