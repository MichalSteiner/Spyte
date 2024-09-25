// Save note with footnotes and highlighted words
export async function saveNoteWithFootnotesAndHighlights(originalFilePath, noteText, paragraphIndex, highlightedWords) {
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
export async function saveNotesToFile(noteText, paragraphIndex, originalFilePath) {
    try {
        const notesFilePath = path.join(path.dirname(originalFilePath), '../notes/', originalFilePath.replace(/^.*[\\\/]/, ''));
        const noteEntry = `Paragraph ${paragraphIndex + 1}:\n${noteText}\n\n`;
        fs.appendFileSync(notesFilePath, noteEntry, 'utf-8');

        console.log('Notes saved successfully to:', notesFilePath);
    } catch (err) {
        console.error('Failed to save notes to file:', err);
    }
}