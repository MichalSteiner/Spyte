const { ipcRenderer } = require('electron');

import { appendEditButton, saveTextareaContent, focusNextElement } from './textarea-handling.js';

// Load Japanese and English text from file
export async function loadJapaneseText(filePath) {
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
                event.preventDefault()
                const activeElement = document.activeElement;
                if (activeElement.tagName === 'TEXTAREA') {
                    saveTextareaContent(activeElement);
                    focusNextElement(activeElement);
                }
            }
        });

    } catch (err) {
        console.error('Failed to load text:', err);
    }
}

// Function to gather translations from both text areas and paragraphs
export function getTranslations() {
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
