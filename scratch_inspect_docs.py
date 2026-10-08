import os
import glob
import pdfplumber
import docx

folder = r"c:\Users\shrut\Desktop\Loan_verification_system\sampledocs,pdf, and excel"
files = os.listdir(folder)

print("="*80)
print(f"TOTAL FILES FOUND: {len(files)}")
print("="*80)

for f in files:
    full_path = os.path.join(folder, f)
    ext = os.path.splitext(f)[1].lower()
    print(f"\n>>> FILE: {f}")
    
    if ext == ".pdf":
        try:
            with pdfplumber.open(full_path) as pdf:
                print(f"   [PDF] Total pages: {len(pdf.pages)}")
                text = ""
                for i in range(min(2, len(pdf.pages))):
                    page_text = pdf.pages[i].extract_text() or ""
                    text += f"\n--- Page {i+1} ---\n" + page_text[:1200]
                print(text[:2500])
        except Exception as e:
            print(f"   Error reading PDF: {e}")
            
    elif ext == ".docx":
        try:
            doc = docx.Document(full_path)
            paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
            print(f"   [DOCX] Paragraphs count: {len(paragraphs)}")
            print("   Top text:")
            for p in paragraphs[:15]:
                print(f"     - {p}")
            # Also inspect tables if any
            if doc.tables:
                print(f"   Tables found: {len(doc.tables)}")
                for t_idx, t in enumerate(doc.tables[:2]):
                    print(f"     Table {t_idx+1} rows: {len(t.rows)}, cols: {len(t.columns)}")
                    for row in t.rows[:5]:
                        row_text = [c.text.strip().replace('\n', ' ') for c in row.cells if c.text.strip()]
                        if row_text:
                            print(f"       | {' | '.join(row_text[:6])}")
        except Exception as e:
            print(f"   Error reading DOCX: {e}")
            
    elif ext == ".doc":
        # .doc files are OLE compound documents or RTF/binary
        # We can extract printable strings or basic text
        try:
            with open(full_path, "rb") as bf:
                raw = bf.read()
            # Simple ascii/utf-16 text extractor
            import re
            strings = re.findall(rb'[\x20-\x7E]{4,}', raw)
            sample_text = " ".join([s.decode('ascii', errors='ignore') for s in strings[:40]])
            print(f"   [DOC binary/text extract]: {sample_text[:1500]}")
        except Exception as e:
            print(f"   Error reading DOC: {e}")
            
    elif ext in [".xlsx", ".xls"]:
        print(f"   [EXCEL file]: {f}")
        try:
            import zipfile
            import xml.etree.ElementTree as ET
            with zipfile.ZipFile(full_path, 'r') as z:
                # read sharedStrings.xml if present
                if 'xl/sharedStrings.xml' in z.namelist():
                    tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
                    strings = [elem.text for elem in tree.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t') if elem.text]
                    print(f"   Excel sample shared strings ({len(strings)}):")
                    for s in strings[:20]:
                        print(f"     * {s}")
        except Exception as e:
            print(f"   Error inspecting Excel: {e}")
