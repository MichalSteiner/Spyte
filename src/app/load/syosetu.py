import requests
from bs4 import BeautifulSoup
import re
from tqdm import tqdm


#%%
# Custom headers to mimic a browser
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
}

def get_chapter_links(novel_url):
    """Get all chapter links from the main page of the novel."""
    response = requests.get(novel_url, headers=HEADERS)
    response.raise_for_status()  # Ensure we notice bad responses

    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Use BeautifulSoup to find all links to chapters
    chapter_links = []
    
    # Syosetu chapters usually have links in `a` tags within a specific structure.
    for link in soup.find_all('a', href=True):
        href = link['href']
        # We assume chapter links contain 'novelid' which is common for Syosetu chapters
        if (novel_url.split('/')[-2] in href and 
            not(href.endswith(novel_url.split('/')[-2]+'/') ) and
            not('?' in href.split('/')[-1])):
            full_url = requests.compat.urljoin(novel_url, href)  # Make sure it's a full URL
            chapter_links.append(full_url)
    
    return chapter_links

def download_chapter(chapter_url):
    """Download the text of a single chapter."""
    response = requests.get(chapter_url, headers=HEADERS)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Syosetu's main text is usually inside a div with class* 'novel_view'
    chapter_text_div = soup.find('div', class_='novel_view')
    if not chapter_text_div:
        return None

    # Extracting text while preserving paragraphs
    paragraphs = chapter_text_div.find_all('p')
    chapter_text = '\n'.join([para.get_text() for para in paragraphs])
    
    return chapter_text

def download_novel(novel_url, output_file):
    """Download all chapters of a novel and save them to a text file."""
    chapter_links = get_chapter_links(novel_url)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        for chapter_url in tqdm(chapter_links, desc="Downloading chapters"):
            chapter_text = download_chapter(chapter_url)
            if chapter_text:
                f.write(chapter_text)
                f.write('\n\n' + '='*80 + '\n\n')  # Separator between chapters

if __name__ == '__main__':
    novel_url = "https://ncode.syosetu.com/n7505bx/"  # Replace with the actual novel URL
    output_file = "novel_text.txt"
    download_novel(novel_url, output_file)

# %%
