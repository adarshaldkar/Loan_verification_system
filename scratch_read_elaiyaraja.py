import pdfplumber

pdf_path = r"c:\Users\shrut\Desktop\Loan_verification_system\sampledocs,pdf, and excel\3005CA0029097 - ELAIYARAJA P.pdf"
with pdfplumber.open(pdf_path) as p:
    print(f"Pages: {len(p.pages)}")
    for idx, page in enumerate(p.pages):
        print(f"\n--- PAGE {idx+1} ---")
        print(page.extract_text())
