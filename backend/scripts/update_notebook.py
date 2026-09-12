import json
import os

notebook_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../rebuild_model.ipynb'))

with open(notebook_path, 'r', encoding='utf-8') as f:
    nb = json.load(f)

for cell in nb.get('cells', []):
    if cell.get('cell_type') == 'code':
        source = cell.get('source', [])
        for i, line in enumerate(source):
            if 'df_people = load_and_clean_csv("01_people.csv")' in line:
                source[i] = line.replace('01_people.csv', '01_people_FINAL.csv')
            elif "df_people_clean = df_people.drop(columns=['email', 'phone', 'linkedin'], errors='ignore')" in line:
                source[i] = line.replace("['email', 'phone', 'linkedin']", "['email', 'phone', 'linkedin', 'Name']")
            elif "df_master['target_role'] = df_master['latest_job_title'].fillna(df_master['name'])" in line:
                source[i] = line.replace("df_master['name']", "df_master['Role']")

with open(notebook_path, 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=1)

print("Successfully updated rebuild_model.ipynb")
