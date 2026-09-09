#!/usr/bin/env python3
"""Read Charles's workbook without changing it. Requires openpyxl.
Usage: python scripts/o7-normalize-workbook.py INPUT.xlsx OUTPUT.json
Keep OUTPUT.json outside the repository and load it through Costs & revenue.
"""
import argparse
import datetime
import json
import math
from pathlib import Path
import openpyxl

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('input', type=Path)
parser.add_argument('output', type=Path)
args = parser.parse_args()
workbook = openpyxl.load_workbook(args.input, read_only=True, data_only=True)
mapping = {'A':'date','B':'lot','C':'sku','D':'product','E':'plannedCases','G':'producedCases','H':'unitsPerCase','I':'looseUnits','J':'sourceWeight','N':'pricePerCase','Q':'material','R':'standardMaterial','U':'regularHours','V':'overtimeHours','W':'doubleHours','X':'hourlyRate','Z':'standardLaborRate','AM':'comment'}
text_fields = {'date','lot','sku','product','comment'}
records = []
for cells in workbook['Main Production'].iter_rows(min_row=2, max_col=39):
    if not cells[3].value:
        continue
    row = cells[0].row
    raw = {openpyxl.utils.get_column_letter(i+1): c.value for i,c in enumerate(cells)}
    item = {'id':f'main-{row}', 'sourceRow':row, 'rawIssues':[]}
    for col, key in mapping.items():
        value = raw.get(col)
        if isinstance(value, (datetime.datetime, datetime.date)):
            value = value.isoformat()[:10]
        if key in text_fields:
            if isinstance(value, (int,float)) and value == int(value):
                value = str(int(value))
            item[key] = str(value).strip() if value is not None else None
        elif value is None or value == '':
            item[key] = None
        elif isinstance(value, (int,float)) and math.isfinite(value) and value >= 0:
            item[key] = value
        else:
            item[key] = None
            item['rawIssues'].append(f'{col}{row}: {value!s} (not a numeric input)')
    item['source'] = {key:raw.get(key) for key in ['K','L','M','O','P','S','Y','AA','AB','AD','AE','AF','AG','AH','AI','AJ','AK','AL']}
    records.append(item)
overhead = {key:workbook['Sheet2'][key].value for key in ['H2','G5','G6','G7','G9','G13','E20','E21','K46']}
output = {'sourceName':args.input.name,'records':records,'overhead':overhead,
          'currencyAssumption':'USD assumed from client context; workbook does not explicitly label currency',
          'excludedSheets':['Sheet1 (empty)','Sheet3 (archive / different schema)'],
          'rules':{'overheadMultiplier':1.35,'otMultiplier':1.5,'doubleMultiplier':2,'standardLaborBasis':'Cases according to AA formula; Z header says per unit'}}
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding='utf-8')
workbook.close()
print(f'Wrote {len(records)} rows; {sum(bool(r["rawIssues"]) for r in records)} rows contain non-numeric source inputs. Original workbook unchanged.')
