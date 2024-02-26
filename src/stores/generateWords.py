import csv

SRC_PATH = './src/stores/'
OUTPUT_FILE = 'wordsDatabase.js'
INPUT_FILE = '43 seconds word list - Sheet1.csv'


def cleanWords(words):
    # Remove duplicates
    words = list(set(words))
    # Sort the words
    words = sorted(words)
    return words


with open(SRC_PATH + INPUT_FILE, encoding="utf-8") as csvfile:
    # Read the file
    reader = csv.reader(csvfile, delimiter=',')
    # Remove the first 4 rows (they do not contain wanted values)
    reader = [line for line in reader][4:]
    # Loop over the rows
    words = []
    for row in reader:
        # Only select even rows, the other rows contain categories
        row_words = [w for i, w in enumerate(row) if (i+1) % 2 == 0 and w != '']
        words += row_words
    # Clean up the resulting word list
    words = cleanWords(words)
    
    # Write found words to an output file
    with open(SRC_PATH + OUTPUT_FILE, 'w', encoding="utf-8") as g:
        # Format words as a JavaScript variable
        g.write('export const interActief = [\n')
        for word in words:
            g.write(f'    "{word}",\n')
        g.write('] // end interActief')
    print(f'Succesfully wrote {len(words)} words to a file!')

    g.close()
csvfile.close()
