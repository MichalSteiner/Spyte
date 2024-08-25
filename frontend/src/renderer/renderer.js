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

            const paragraphHeight = jpParagraph.offsetHeight + 20; // Account for margin
            engBox.style.height = `${paragraphHeight}px`;
            englishTextDiv.appendChild(engBox);

            const line = document.createElement('div');
            line.className = 'line';
            line.style.top = `${jpParagraph.offsetTop}px`;
            line.style.height = `${jpParagraph.offsetHeight}px`;
            document.getElementById('english-panel').appendChild(line);

            // Add the horizontal line across all panels
            const hr = document.createElement('hr');
            hr.className = 'paragraph-separator';
            japaneseTextDiv.appendChild(hr);
            englishTextDiv.appendChild(hr.cloneNode()); // Clone to add the same HR in the English panel
        });
    } catch (err) {
        console.error('Failed to load text:', err);
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
            loadJapaneseText(filePath);
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

    japanesePanel.addEventListener('mouseup', (event) => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText) {
            const range = selection.getRangeAt(0);
            const parentParagraph = range.startContainer.parentElement;
            selectedParagraphIndex = Array.from(japanesePanel.children).indexOf(parentParagraph);

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
        }
    
        // Clear and hide the popup
        document.getElementById('note-text').value = '';
        notePopup.style.display = 'none';
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
