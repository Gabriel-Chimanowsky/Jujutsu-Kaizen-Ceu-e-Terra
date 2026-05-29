import sys

libraries = ['pypdf', 'PyPDF2', 'pdfplumber', 'fitz', 'openpyxl']
available = []
for lib in libraries:
    try:
        __import__(lib)
        available.append(lib)
    except ImportError:
        pass

print("Available libraries:", available)
print("Python version:", sys.version)
