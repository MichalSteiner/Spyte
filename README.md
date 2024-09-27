# Spyte - A translation app for Japanese light novels
## Context:
This is a side-project I am developing in order to develop my front-end development skills in JavaScript, CSS and HTML. Due to the nature of this project, the repository is updated on irregular basis and its functions are not fully implemented. In particular, only the bare skeleton of the app is build right now.

There are three main purposes for Spyte:
1. Provide a clean, simple interface for translating japanese light-novels, including interface for translation notes and highlighting.
2. Provide a viewer for the given translation, that will allow the user to view the translation, the original ("raw") novel, and translation notes well integrated into it. 
3. Create a community-based rating system for rating the translation within the viewer, and community-raised errors in translation feedback.

The reason for development of this app is that, to my knowledge, there is no good open-source tool allowing for the purpose of manual translation of text (not a translator, but an editor). As such, people are typically using a standard text-editors of their choices, which does not allow side-by-side comparison, note section and more, which is what I envisioned.
The second reason is something that is being commonly done by fan translations (but generally disregarded by publishers) to provide context about the translation. As Japanese is completely different language to English with very few similarities, many translations lose a lot of context (for example, non-translation of name suffixes loses information on speakers view of the targeted person).
For the third purpose, due to massive differences between languages, there is large set of examples of mistranslations in published works. The idea here is based on the Twitter community notes system, adapted for translation rating. 

## Usage
### Translation part
1. Decide on source for the novel through the backend script
    - Syosetu - a web scraping tool is available to download all chapters of the novel. There is a short timelag in between each chapter request to avoid overloading the web. 
    - epub convertion
2. Open the novel through the app frontend
3. Translate the text and save
4. Output will be viewable properly by viewer.

Note:
- The output of the convertion to text file is a `.txt` file. This means all ruby elements are removed, effectivelly removing ALL furigana characters. If necessary, a ruby compatible format will be developed. 
    - By ruby, it is not meant the programming language. Ruby characters in this meaning are type of annotative characters commonly used in Eastern Asia languages ([Wikipedia link](https://en.wikipedia.org/wiki/Ruby_character)). They are commonly used to anotate pronunciation of characters, either due to less used version, specific terms, like names and places are commonly annotated with Furigana.


### Viewer part
- To be implemented
