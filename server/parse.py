import os
import re
import xlrd
from pathlib import Path
from datetime import datetime
from xlrd.biffh import XLRDError, error_text_from_code
from xlrd.sheet import ctype_text
from pymongo import MongoClient

from pprint import pprint


po_re = re.compile('P[0-9]{6}(-[A-Z])?$')
pn_re = re.compile('((?P<mfgr>[\s\S]+)\s)?PN:\s(?P<pn>[A-Za-z0-9\-]+)')
header_pn_re = re.compile('((?P<mfgr>[\w]+)\s)PN[ \w-]*')
dim_re = re.compile('DIMENSIONS?:\s(?P<dim>[\s\S]+)')
holder_re = re.compile('HOLDER:\s(?P<holder>[\s\S]+)')


def extract_retailer(wb: xlrd.book.Book) -> str:
    sheet = wb.sheet_by_index(0)
    for index, cell in enumerate(sheet.col(0)):
        if 'PURCHASE ORDER TO' in cell.value:
            cell: xlrd.sheet.Cell = sheet.cell(index + 1, 0)
            assert ctype_text.get(cell.ctype) == 'text', 'invalid purchase order cell'
            return cell.value
    return None


def extract_po(wb: xlrd.book.Book) -> str:
    sheet = wb.sheet_by_index(0)
    # try col 9, 10
    for i in range(9, 11):
        cell: xlrd.sheet.Cell = sheet.cell(2, i)
        if ctype_text.get(cell.ctype) != 'text':
            continue
        po = cell.value
        if po_re.match(po):
            return po
    return None
    #return po if po_re.match(po) else None


def parse(f: Path): 
    try:
        wb: xlrd.book.Book = xlrd.open_workbook(f)
    except XLRDError as e:
        return

    retailer = extract_retailer(wb)
    assert retailer is not None, 'failed to extract retailer'

    po = extract_po(wb)
    assert po is not None, 'failed to extract po'
    #if po is None:
    #    print(wb.filestr)
    #    return

    for index, name in enumerate(wb.sheet_names()):
        if 'PO DESCRIPTIONS' in name:
            break
    else:
        raise Exception('failed to find descriptions sheet')

    sheet = wb.sheet_by_index(index)
    header_row = [c.value if ctype_text.get(c.ctype) else None for c in sheet.row(0)]

    desc_header_cols = [i for i, col in enumerate(header_row) if 'description' in col.lower()]

    pn_header_cols = [(i, m.group('mfgr')) for i, col in enumerate(header_row) if i not in desc_header_cols and (m := header_pn_re.match(col))]

    for price_col, col in enumerate(header_row):
        if 'PRICE' in col or 'ABR' in col:
            break
    else:
        raise Exception('failed to find price column')

    for i in range(1, sheet.nrows):
        doc = {'retailer': retailer, 'file': str(f)[12:],
                'file_modified_at': f.stat().st_mtime}
        row = sheet.row(i)
        doc['description'] = [{'title': header_row[i], 'value': None} for i in desc_header_cols]
        price_c = row[price_col]
        t = ctype_text.get(price_c.ctype)
        if t == 'number':
            price = price_c.value
        elif t == 'empty':
            price = None
        elif t == 'error':
            error_text_from_code.get(price_c.value)
            price = None
        else:
            raise Exception('you fucked up')

        #assert ctype_text.get(price.ctype) != 'number', 'invalid price cell'
        doc['price'] = price
        for j in desc_header_cols:
            cell = row[j]
            t = ctype_text.get(cell.ctype)
            if t == 'empty':
                value = ''
            elif t != 'text':
                print(t)
                raise Exception('you fucked up')
            else:
                value = cell.value
            doc['description'][j]['value'] = value

            m = pn_re.match(value)
            if m is not None:
                mfgr = m.group('mfgr')
                pn = m.group('pn')
                doc['part_number'] = doc.get('part_number', []) + [(pn, mfgr)]

            m = dim_re.match(value)
            if m is not None:
                dim = m.group('dim')
                doc['dimensions'] = doc.get('dimensions', []) + [dim]

            m = holder_re.match(value)
            if m is not None:
                holder = m.group('holder')
                doc['holder'] = doc.get('holder', []) + [dim]

        for j, mfgr in pn_header_cols:
            cell: xlrd.sheet.Cell = row[j]
            t = ctype_text.get(cell.ctype)
            if t  == 'number':
                if cell.value.is_integer():
                    pn = str(int(cell.value))
                else:
                    pn = str(cell.value)
            elif t == 'text':
                pn = cell.value
            doc['part_number'] = doc.get('part_number', []) + [(pn, mfgr)]

        yield doc


def main():
    root = Path.home().joinpath('f/PURCHASING/Purchase Orders/')
    docs = []
    for f in filter(lambda f: not str(f.name).startswith('~'), sorted(root.glob('**/*.xlsx'), key=lambda f: f.stat().st_mtime)):
        for doc in parse(f):
            docs.append(doc)

    client = MongoClient('localhost', 27017)
    client.qr.drop_collection('docs')
    res = client.qr.docs.insert_many(docs)
    print(dir(res))


if __name__ == '__main__':
    main()
