const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

import {synchronizeParagraphs} from './components/textarea-handling.js'
import {saveNoteWithFootnotesAndHighlights, saveNotesToFile} from './components/notes-handling.js'
import {triggerSaveButton} from './components/save-handling.js'
import {loadJapaneseText, getTranslations} from './components/load-handling.js'



// Add an event listener for key presses
window.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault(); // Prevent the default browser save action
        triggerSaveButton();
    }
});

// Initialize the application
window.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const saveButton = document.getElementById('save-button');
    const japanesePanel = document.getElementById('japanese-panel');
    const englishPanel = document.getElementById('english-panel');
    const notesPanel = document.getElementById('notes-panel');
    let originalFilePath = ''; // Store the path of the loaded file
    let selectedParagraphIndex = null; // To store which paragraph is selected
    let highlightedWords = []; // To store highlighted words

    // Theme toggle logic
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
    }

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
    });

    // Scroll synchronization logic
    function syncScroll(source, targets) {
        const scrollPercentage = source.scrollTop / (source.scrollHeight - source.clientHeight);
        targets.forEach(target => {
            target.scrollTop = scrollPercentage * (target.scrollHeight - target.clientHeight);
        });
    }

    [japanesePanel, englishPanel, notesPanel].forEach(panel => {
        panel.addEventListener('scroll', () => {
            syncScroll(panel, [japanesePanel, englishPanel, notesPanel].filter(p => p !== panel));
        });
    });

    // Handle file selection
    document.getElementById('select-file').addEventListener('click', async () => {
        const filePath = await ipcRenderer.invoke('select-file');
        originalFilePath = filePath; // Store the original file path
        if (filePath) {
            await loadJapaneseText(filePath);
            synchronizeParagraphs();
        }
    });

    // Save translations
    saveButton.addEventListener('click', async () => {
        const translations = getTranslations();
        await ipcRenderer.invoke('save-translations', translations, originalFilePath);
    });

    // Create the popup for adding notes
    const notePopup = document.createElement('div');
    notePopup.id = 'note-popup';
    notePopup.style.display = 'none'; // Hide by default
    notePopup.innerHTML = `
        <div id="note-popup-header">
            <button id="note-popup-close" title="Close">×</button>
        </div>
        <textarea id="note-text" placeholder="Enter note..."></textarea>
        <button id="confirm-note">Confirm</button>
    `;
    document.body.appendChild(notePopup);

    // Handle note popup actions
    document.getElementById('note-popup-close').addEventListener('click', () => {
        notePopup.style.display = 'none';
        document.getElementById('note-text').value = ''; // Clear text
    });

    document.getElementById('confirm-note').addEventListener('click', saveNote);
    document.getElementById('note-text').addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            saveNote();
        }
    });

    window.addEventListener('click', (event) => {
        if (event.target === notePopup) {
            notePopup.style.display = 'none';
            document.getElementById('note-text').value = ''; // Clear text
        }
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            notePopup.style.display = 'none';
            document.getElementById('note-text').value = ''; // Clear text
        }
    });

    // Handle selection and highlighting
    japanesePanel.addEventListener('mouseup', (event) => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText) {
            const range = selection.getRangeAt(0);
            const parentParagraph = range.startContainer.parentElement;
            selectedParagraphIndex = Array.from(japanesePanel.children).indexOf(parentParagraph);

            // Reset highlighted words for the new note
            highlightedWords = [selectedText];

            const { top, left } = parentParagraph.getBoundingClientRect();
            notePopup.style.top = `${top + window.scrollY + 20}px`;
            notePopup.style.left = `${left + window.scrollX}px`;
            notePopup.style.display = 'block';
            document.getElementById('note-popup').focus();
        }
    });


    // Event listener for save button
    document.getElementById('save-button').addEventListener('click', async () => {
        const translations = getTranslations();
        await ipcRenderer.invoke('save-translations', translations, originalFilePath);
    });

    function saveNote() {
        const noteText = document.getElementById('note-text').value.trim();

        if (noteText && selectedParagraphIndex !== null) {
            let noteContainer = notesPanel.children[selectedParagraphIndex];
            if (!noteContainer) {
                noteContainer = document.createElement('div');
                notesPanel.appendChild(noteContainer);
            }

            const notePara = document.createElement('p');
            notePara.textContent = noteText;
            noteContainer.appendChild(notePara);

            // Save notes and highlights
            saveNoteWithFootnotesAndHighlights(originalFilePath, noteText, selectedParagraphIndex, highlightedWords);
            saveNotesToFile(noteText, selectedParagraphIndex, originalFilePath);

            // Clear note input and hide popup
            document.getElementById('note-text').value = '';
            notePopup.style.display = 'none';

            // Reset selected paragraph and highlighted words
            selectedParagraphIndex = null;
            highlightedWords = [];
        }
    }

});
