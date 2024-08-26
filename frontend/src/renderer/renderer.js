const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// Load Japanese and English text from file
async function loadJapaneseText(filePath) {
    try {
        // Load Japanese and English text
        const { japaneseContent, englishContent } = await ipcRenderer.invoke('load-text-file', filePath);
        const japaneseTextDiv = document.getElementById('japanese-text');
        const englishTextDiv = document.getElementById('english-text');

        // Divide text into paragraphs
        const jpParagraphs = japaneseContent.split('\n\n');
        const engParagraphs = englishContent ? englishContent.split('\n\n') : [];

        // Remove all child element and text in them. Reseting the values.
        japaneseTextDiv.innerHTML = '';
        englishTextDiv.innerHTML = '';

        // Create a paragraph for each paragraph in the Japanese text
        jpParagraphs.forEach((paragraph, index) => {
            const jpParagraph = document.createElement('p');
            jpParagraph.textContent = paragraph;
            japaneseTextDiv.appendChild(jpParagraph);

            const container = document.createElement('div');
            container.className = 'paragraph-container';

            let engElement;


            // If English translation already exists
            if (engParagraphs[index]) {
                engElement = document.createElement('p');
                engElement.textContent = engParagraphs[index];
                container.appendChild(engElement);
            } else { 
                engElement = document.createElement('textarea');
                engElement.className = 'text-box';
                engElement.placeholder = 'Enter translation here...';
                container.appendChild(engElement);
            }

            // Attach the Edit button
            appendEditButton(container, engElement);

            // Immediately set paragraph height of english translation to corresponding JP paragraph
            setTimeout(() => {
                const paragraphHeight = jpParagraph.offsetHeight;
                engElement.style.height = `${paragraphHeight}px`;
                engElement.offsetHeight = jpParagraph.offsetHeight;
            }, 0);

            englishTextDiv.appendChild(container);

            const hr = document.createElement('hr');
            hr.className = 'paragraph-separator';
            japaneseTextDiv.appendChild(hr);

            const hrClone = hr.cloneNode();
            englishTextDiv.appendChild(hrClone);
        });

        // Handle Enter key press for saving edits
        document.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                const activeElement = document.activeElement;
                if (activeElement.tagName === 'TEXTAREA') {
                    const container = activeElement.parentElement;
                    saveTextareaContent(container, activeElement);
                    focusNextElement(activeElement);
                }
            }
        });

    } catch (err) {
        console.error('Failed to load text:', err);
    }
}

function focusNextElement(currentElement) {
    const focusableElements = document.querySelectorAll(
        'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    const focusArray = Array.prototype.slice.call(focusableElements);
    const currentIndex = focusArray.indexOf(currentElement);
    
    // If there's a next focusable element, focus on it
    if (currentIndex > -1 && currentIndex < focusArray.length - 1) {
        focusArray[currentIndex + 2].focus();
    }
}

// Synchronize the height of paragraphs between Japanese and English panels
async function synchronizeParagraphs() {
    const japaneseTextDiv = document.getElementById('japanese-text');
    const englishTextDiv = document.getElementById('english-text');

    const jpParagraphs = Array.from(japaneseTextDiv.children);
    const engParagraphs = Array.from(englishTextDiv.children);

    jpParagraphs.forEach((jpParagraph, index) => {
        if (engParagraphs[index]) {
            const jpHeight = jpParagraph.offsetHeight;
            engParagraphs[index].style.height = `${jpHeight}px`;
        }
    });
}

// Save note with footnotes and highlighted words
async function saveNoteWithFootnotesAndHighlights(originalFilePath, noteText, paragraphIndex, highlightedWords) {
    try {
        const { japaneseContent } = await ipcRenderer.invoke('load-text-file', originalFilePath);

        let jpParagraphs = japaneseContent.split('\n\n');
        const footnoteMarker = `[${paragraphIndex + 1}]`;

        jpParagraphs[paragraphIndex] += ` ${footnoteMarker}`;
        jpParagraphs.push(`${footnoteMarker} ${noteText}`);

        highlightedWords.forEach(word => {
            jpParagraphs[paragraphIndex] = jpParagraphs[paragraphIndex].replace(word, `**${word}**`);
        });

        const newContent = jpParagraphs.join('\n\n');
        fs.writeFileSync(originalFilePath, newContent, 'utf-8');

        console.log('Note and highlights saved successfully!');
    } catch (err) {
        console.error('Failed to save note and highlights:', err);
    }
}

// Save notes to a separate file
async function saveNotesToFile(noteText, paragraphIndex) {
    try {
        const notesFilePath = path.join(path.dirname(originalFilePath), 'notes.txt');
        const noteEntry = `Paragraph ${paragraphIndex + 1}:\n${noteText}\n\n`;

        fs.appendFileSync(notesFilePath, noteEntry, 'utf-8');

        console.log('Notes saved successfully to:', notesFilePath);
    } catch (err) {
        console.error('Failed to save notes to file:', err);
    }
}

// Function to trigger the click event of the save button
function triggerSaveButton() {
    const saveButton = document.getElementById('save-button');
    if (saveButton) {
        saveButton.click();
    }
}

// Add an event listener for key presses
window.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault(); // Prevent the default browser save action
        triggerSaveButton();
    }
});

// Function to gather translations from both text areas and paragraphs
function getTranslations() {
    const englishTextDiv = document.getElementById('english-text');
    const allDivs = Array.from(englishTextDiv.children);
    return allDivs.map(child => {
        const firstChild = child.children[0];
        if (firstChild) {
            if (firstChild.tagName.toLowerCase() === 'textarea') {
                return firstChild.value;
            } else if (firstChild.tagName.toLowerCase() === 'p') {
                return firstChild.textContent;
            }
        }
        return null; // Default case for unexpected elements or if firstChild is undefined
    }).filter(value => value !== null); // Filtering nulls from the array.
}

// Function to handle the edit button functionality
function handleEditButtonClick(event) {
    const container = event.target.parentElement;
    const contentElement = container.querySelector('p, textarea');

    if (contentElement.tagName === 'P') {
        // Change paragraph to textarea
        createTextareaFromParagraph(container, contentElement);
    } else if (contentElement.tagName === 'TEXTAREA') {
        // Do nothing since it's already a textarea
    }
}

// Create a textarea from a paragraph
function createTextareaFromParagraph(container, paragraph) {
    const textarea = document.createElement('textarea');
    textarea.className = 'text-box';
    textarea.style.height = paragraph.style.height; 
    textarea.value = paragraph.textContent;

    // Replace paragraph with textarea
    container.replaceChild(textarea, paragraph);

    // Focus on the textarea for editing
    textarea.focus();

    // Add "Enter" key listener to save the content
    textarea.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            saveTextareaContent(textarea);
        }
    });
}

// Save content from textarea and switch back to paragraph
function saveTextareaContent(textarea) {
    const paragraph = document.createElement('p');
    paragraph.textContent = textarea.value;

    const container = textarea.parentElement;

    // Replace the textarea with paragraph
    container.replaceChild(paragraph, textarea);
}

// Append the Edit button to the container
function appendEditButton(container, contentElement) {
    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.className = 'edit-button';

    editButton.onclick = handleEditButtonClick;

    container.appendChild(editButton);
}

// Event listener for save button
document.getElementById('save-button').addEventListener('click', async () => {
    const translations = getTranslations();
    await ipcRenderer.invoke('save-translations', translations, originalFilePath);
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
            highlightedWords.push(selectedText);

            const { top, left } = parentParagraph.getBoundingClientRect();
            notePopup.style.top = `${top + window.scrollY + 20}px`;
            notePopup.style.left = `${left + window.scrollX}px`;
            notePopup.style.display = 'block';
            document.getElementById('note-text').focus();
        }
    });

    // Save note function
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

            saveNoteWithFootnotesAndHighlights(originalFilePath, noteText, selectedParagraphIndex, highlightedWords);
            saveNotesToFile(noteText, selectedParagraphIndex);

            document.getElementById('note-text').value = '';
            notePopup.style.display = 'none';

            highlightedWords = []; // Clear highlighted words
        }
    }
});
