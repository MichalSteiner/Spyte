
export function focusNextElement(currentElement) {
    // Select all textareas in English panel
    const focusableElements = document.querySelectorAll(
        '#english-panel textarea, [tabindex]:not([tabindex="-1"])'
    );
    const focusArray = Array.prototype.slice.call(focusableElements);
    const currentIndex = focusArray.indexOf(currentElement);

    // If there's a next focusable element, focus on it
    if (focusArray.length !== 0) {
        focusArray[0].focus();
        focusArray[0].value = ''
    }
}

// Synchronize the height of paragraphs between Japanese and English panels
export async function synchronizeParagraphs() {
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

// Function to handle the edit button functionality
export function handleEditButtonClick(event) {
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
export function createTextareaFromParagraph(container, paragraph) {
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
            event.preventDefault()
            activeElement = document.activeElement
            saveTextareaContent(textarea);
            focusNextElement(activeElement);
            
        }
    });
}


// Save content from textarea and switch back to paragraph
export function saveTextareaContent(textarea) {
    const paragraph = document.createElement('p');
    paragraph.textContent = textarea.value;

    const container = textarea.parentElement;

    // Replace the textarea with paragraph
    container.replaceChild(paragraph, textarea);
}

// Append the Edit button to the container
export function appendEditButton(container, contentElement) {
    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.className = 'edit-button';

    editButton.onclick = handleEditButtonClick;

    container.appendChild(editButton);
}
