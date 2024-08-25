const { ipcRenderer } = require('electron');

// Update the loadJapaneseText function to accept the file content directly
async function loadJapaneseText(filePath) {
    try {
        const { japaneseContent, englishContent } = await ipcRenderer.invoke('load-text-file', filePath);
        const japaneseTextDiv = document.getElementById('japanese-text');
        const englishTextDiv = document.getElementById('english-text');

        const jpParagraphs = japaneseContent.split('\n\n');
        const engParagraphs = englishContent ? englishContent.split('\n\n') : [];

        japaneseTextDiv.innerHTML = '';
        englishTextDiv.innerHTML = '';

        jpParagraphs.forEach((paragraph, index) => {
            const jpParagraph = document.createElement('p');
            jpParagraph.textContent = paragraph;
            japaneseTextDiv.appendChild(jpParagraph);

            const engBox = document.createElement('textarea');
            engBox.className = 'text-box';
            engBox.placeholder = 'Enter translation here...';

            if (engParagraphs[index]) {
                engBox.value = engParagraphs[index];
            }

            // Ensure the textarea matches the height of the Japanese paragraph
            // Use a fixed height for the textarea or set it after rendering
            setTimeout(() => {
                const paragraphHeight = jpParagraph.offsetHeight; // Ensure this is correct
                engBox.style.height = `${paragraphHeight}px`;
            }, 0);
            

            englishTextDiv.appendChild(engBox);

            // Add the horizontal line across all panels
            const hr = document.createElement('hr');
            hr.className = 'paragraph-separator';
            japaneseTextDiv.appendChild(hr);

            // Clone and append horizontal line to English panel
            const hrClone = hr.cloneNode();
            englishTextDiv.appendChild(hrClone);
        });
    } catch (err) {
        console.error('Failed to load text:', err);
    }
}

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


async function saveNoteWithFootnotesAndHighlights(originalFilePath, noteText, paragraphIndex, highlightedWords) {
    try {
        const { japaneseContent } = await ipcRenderer.invoke('load-text-file', originalFilePath);

        let jpParagraphs = japaneseContent.split('\n\n');
        const footnoteMarker = `[${paragraphIndex + 1}]`;

        // Append footnote marker to the relevant paragraph
        jpParagraphs[paragraphIndex] += ` ${footnoteMarker}`;

        // Append footnote text to the end of the document
        jpParagraphs.push(`${footnoteMarker} ${noteText}`);

        // Modify the paragraph to include highlighted markers (e.g., wrap with **)
        highlightedWords.forEach(word => {
            jpParagraphs[paragraphIndex] = jpParagraphs[paragraphIndex].replace(word, `**${word}**`);
        });

        // Save the modified Japanese content back to the file
        const newContent = jpParagraphs.join('\n\n');
        fs.writeFileSync(originalFilePath, newContent, 'utf-8');

        console.log('Note and highlights saved successfully!');
    } catch (err) {
        console.error('Failed to save note and highlights:', err);
    }
}

async function saveNotesToFile(noteText, paragraphIndex) {
    try {
        const notesFilePath = path.join(path.dirname(originalFilePath), 'notes.txt');
        const noteEntry = `Paragraph ${paragraphIndex + 1}:\n${noteText}\n\n`;

        // Append to the notes file
        fs.appendFileSync(notesFilePath, noteEntry, 'utf-8');

        console.log('Notes saved successfully to:', notesFilePath);
    } catch (err) {
        console.error('Failed to save notes to file:', err);
    }
}


window.addEventListener('DOMContentLoaded', () => {
    // Theme toggle logic
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // Check if the user has a saved preference for dark mode
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
    }

    // Toggle between light and dark mode
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');

        // Save the user's preference in localStorage
        if (body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });

    // Scroll synchronization logic
    const japanesePanel = document.getElementById('japanese-panel');
    const englishPanel = document.getElementById('english-panel');
    const notesPanel = document.getElementById('notes-panel');

    function syncScroll(source, targets) {
        const scrollPercentage = source.scrollTop / (source.scrollHeight - source.clientHeight);

        targets.forEach(target => {
            target.scrollTop = scrollPercentage * (target.scrollHeight - target.clientHeight);
        });
    }

    japanesePanel.addEventListener('scroll', () => {
        syncScroll(japanesePanel, [englishPanel, notesPanel]);
    });

    englishPanel.addEventListener('scroll', () => {
        syncScroll(englishPanel, [japanesePanel, notesPanel]);
    });

    notesPanel.addEventListener('scroll', () => {
        syncScroll(notesPanel, [japanesePanel, englishPanel]);
    });

    // Handle file selection
    document.getElementById('select-file').addEventListener('click', async () => {
        const filePath = await ipcRenderer.invoke('select-file');
        originalFilePath = filePath; // Store the original file path
        if (filePath) {
            loadJapaneseText(filePath).then(() => {
                synchronizeParagraphs();
            });
            
        }
    });

    let originalFilePath = ''; // Store the path of the loaded file
    const saveButton = document.getElementById('save-button');

    // Save translations with the original file path
    saveButton.addEventListener('click', async () => {
        const textBoxes = document.querySelectorAll('#english-text textarea');
        const translations = Array.from(textBoxes).map(textBox => textBox.value);

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

    let selectedParagraphIndex = null; // To store which paragraph is selected
    let highlightedWords = [];

    japanesePanel.addEventListener('mouseup', (event) => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
    
        if (selectedText) {
            const range = selection.getRangeAt(0);
            const parentParagraph = range.startContainer.parentElement;
            selectedParagraphIndex = Array.from(japanesePanel.children).indexOf(parentParagraph);
    
            highlightedWords.push(selectedText); // Add highlighted word to the array
    
            const { top, left } = parentParagraph.getBoundingClientRect();
            notePopup.style.top = `${top + window.scrollY + 20}px`;
            notePopup.style.left = `${left + window.scrollX}px`;
            notePopup.style.display = 'block';
    
            document.getElementById('note-text').focus();
        }
    });
    
    // Confirm note on button click or Enter key press
    document.getElementById('confirm-note').addEventListener('click', saveNote);
    document.getElementById('note-text').addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            saveNote();
        }
    });

    // Close note popup without saving
    document.getElementById('note-popup-close').addEventListener('click', () => {
        document.getElementById('note-popup').style.display = 'none';
    });


    function saveNote() {
        const noteText = document.getElementById('note-text').value.trim();
    
        if (noteText && selectedParagraphIndex !== null) {
            // Ensure the corresponding paragraph in the Notes panel is targeted
            let noteContainer = notesPanel.children[selectedParagraphIndex];
            if (!noteContainer) {
                noteContainer = document.createElement('div');
                notesPanel.appendChild(noteContainer);
            }
    
            const notePara = document.createElement('p');
            notePara.textContent = noteText;
            noteContainer.appendChild(notePara);
    
            // Save the note with highlights and to a separate file
            saveNoteWithFootnotesAndHighlights(originalFilePath, noteText, selectedParagraphIndex, highlightedWords);
            saveNotesToFile(noteText, selectedParagraphIndex);
    
            // Clear and hide the popup
            document.getElementById('note-text').value = '';
            notePopup.style.display = 'none';
    
            // Clear highlighted words after saving
            highlightedWords = [];
        }
    }
    
    
    // Bind the saveNote function to the confirm button
    document.getElementById('confirm-note').addEventListener('click', saveNote);
    
    // Close the popup without saving when clicking the cross button
    document.getElementById('note-popup-close').addEventListener('click', () => {
        document.getElementById('note-text').value = ''; // Clear text
        notePopup.style.display = 'none'; // Hide popup
    });
    
    // Also close the popup when clicking outside of it, or pressing the Escape key
    window.addEventListener('click', (event) => {
        if (event.target === notePopup) {
            document.getElementById('note-text').value = ''; // Clear text
            notePopup.style.display = 'none'; // Hide popup
        }
    });
    
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            document.getElementById('note-text').value = ''; // Clear text
            notePopup.style.display = 'none'; // Hide popup
        }
    });
});
