const { ipcRenderer } = require('electron');

// Function to load and display the text from the file
async function loadJapaneseText(filePath) {
    try {
        const content = await ipcRenderer.invoke('load-text-file', filePath);
        const japaneseTextDiv = document.getElementById('japanese-text');
        const englishTextDiv = document.getElementById('english-text');

        // Split content by paragraphs
        const paragraphs = content.split('\n\n'); // Adjust based on paragraph separator

        // Clear previous content
        japaneseTextDiv.innerHTML = '';
        englishTextDiv.innerHTML = '';

        paragraphs.forEach((paragraph, index) => {
            // Create Japanese text element
            const jpParagraph = document.createElement('p');
            jpParagraph.textContent = paragraph;
            japaneseTextDiv.appendChild(jpParagraph);

            // Create English text box
            const engBox = document.createElement('textarea');
            engBox.className = 'text-box';
            engBox.placeholder = 'Enter translation here...';
            englishTextDiv.appendChild(engBox);

            // Create connecting linel
            const line = document.createElement('div');
            line.className = 'line';
            line.style.top = `${index * 60}px`; // Adjust positioning as needed
            line.style.height = '60px'; // Adjust height as needed
            document.getElementById('english-panel').appendChild(line);
        });
    } catch (err) {
        console.error('Failed to load text:', err);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    // Theme toggle logic
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
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

    const filePath = '../shared/novels/test_novel/ぼくは異世界で付与魔法と召喚魔法を天秤にかける/Chapter_001.txt'; // Update this path to your text file
    loadJapaneseText(filePath);

    document.getElementById('save-button').addEventListener('click', async () => {
        const textBoxes = document.querySelectorAll('#english-text textarea');
        const translations = Array.from(textBoxes).map(textBox => textBox.value);

        // Send translations to main process
        await ipcRenderer.invoke('save-translations', translations);
    });
});
