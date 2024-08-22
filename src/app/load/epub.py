"""
This is a loading library for SPYTE.


"""
#%%
import ebooklib
from ebooklib import epub



def load_epub(filename: str):
    book = epub.read_epub(filename)
    cover_image = book.get_item_with_id('cover-image')
    return book
    ...
    
def load_pdf(filename: str):
    
    ...
    
    
    
#%%
if __name__ == '__main__':
    test_filename = r'C:\Users\Chamaeleontis\Desktop\light_novels\Tobakushi wa Inoranai\Tobakushi_wa_Inoranai_1.epub'
    load_epub(filename= test_filename)