import requests
from bs4 import BeautifulSoup
import re
from tqdm import tqdm
import time
import os

#%%
# Custom headers to mimic a browser
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
}

def get_chapter_links(novel_url: str) -> list:
    """
    Get chapter links from Syosetu to scrape.
    
    This does not do the actual scraping.
    
    Parameters
    ----------
    novel_url : str
        Link to the main page of the novel.

    Returns
    -------
    chapter_links : list
        List of the links to all chapters
    """
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

def download_chapter(chapter_url: str) -> str:
    """
    Download a single chapter from given URL link.

    Parameters
    ----------
    chapter_url : str
        Chapter url to scrape.

    Returns
    -------
    chapter_text : str
        Chapter text scraped.
        
    TODO:
        Check for furigana strings.
    """
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

def get_novel_title(novel_url: str) -> str:
    """
    Extract the title of the novel from the main page.
    
    Parameters
    ----------
    novel_url : str
        Link to the main page of the novel.
        
    Returns
    -------
    novel_title : str
        Title of the novel.
    
    # TODO
    """
    response = requests.get(novel_url, headers=HEADERS)
    response.raise_for_status()  # Ensure we notice bad responses

    soup = BeautifulSoup(response.text, 'html.parser')
    title = soup.title.string

    return title

def sanitize_filename(filename: str) -> str:
    """
    Sanitize the filename to remove or replace characters not allowed in filenames.
    
    Parameters
    ----------
    filename : str
        The filename to sanitize.
        
    Returns
    -------
    sanitized_filename : str
        Sanitized filename.
    """
    return "".join(c for c in filename if c.isalnum() or c in "._- ").rstrip()

def download_novel(novel_url: str,
                   output_dir: str) -> None:
    """
    Download all chapters for single novel from Syosetu, given the main link.
    
    The chapters will be saved in an output file. To avoid overloading servers, a 1 second pause is added in between chapter scraping.

    Parameters
    ----------
    novel_url : str
        Link to the main page of the novel.
    output_dir : str
        Output directory where to save the novel.
        
    TODO:
        Change the saving to output it in separate chapters.
    """
    # Get the novel title for directory name
    novel_title = get_novel_title(novel_url)
    output_dir = os.path.join('shared/novels', output_dir)
    novel_dir = os.path.join(output_dir, sanitize_filename(novel_title))

    # Create the directory if it doesn't exist
    os.makedirs(novel_dir, exist_ok=True)

    chapter_links = get_chapter_links(novel_url)
    
    for idx, chapter_url in enumerate(tqdm(chapter_links, desc="Downloading chapters"), start=1):
        chapter_text = download_chapter(chapter_url)
        if chapter_text:
            chapter_filename = f"Chapter_{idx:03}.txt"
            chapter_filepath = os.path.join(novel_dir, chapter_filename)
            
            with open(chapter_filepath, 'w', encoding='utf-8') as f:
                f.write(chapter_text)
            
        time.sleep(1)

if __name__ == '__main__': # Test on a singular novel.
    novel_url = "https://ncode.syosetu.com/n7505bx/"  # Replace with the actual novel URL
    output_directory = "test_novel"
    download_novel(novel_url, output_directory)

# %%
