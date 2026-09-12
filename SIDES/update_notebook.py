import nbformat

with open("rebuild_model.ipynb", "r", encoding="utf-8") as f:
    nb = nbformat.read(f, as_version=4)

# Update cell 8 (Step 4: Aggregate Features)
for cell in nb.cells:
    if cell.cell_type == "code" and "df_education_clean.groupby('person_id')['program']" in cell.source:
        cell.source = cell.source.replace(
            "df_agg_edu = df_education_clean.groupby('person_id')['program'].apply(lambda x: ' '.join(str(p) for p in x if pd.notna(p))).reset_index()\n"
            "df_agg_edu.rename(columns={'program': 'aggregated_education'}, inplace=True)",
            "import re\ndef get_degree_level(program_str):\n"
            "    text_lower = str(program_str).lower()\n"
            "    master_patterns = [r'\\bmaster\\b', r'\\bmsc\\b', r'\\bm\\.sc\\b', r'\\bmtech\\b', r'\\bm\\.tech\\b', r'\\bms\\b', r'\\bm\\.s\\b', r'\\bma\\b', r'\\bm\\.a\\b', r'\\bmba\\b']\n"
            "    if any(re.search(pat, text_lower) for pat in master_patterns): return 2.0\n"
            "    bachelor_patterns = [r'\\bbachelor\\b', r'\\bbsc\\b', r'\\bb\\.sc\\b', r'\\bbtech\\b', r'\\bb\\.tech\\b', r'\\bbs\\b', r'\\bb\\.s\\b', r'\\bba\\b', r'\\bb\\.a\\b', r'\\bbba\\b']\n"
            "    if any(re.search(pat, text_lower) for pat in bachelor_patterns): return 1.0\n"
            "    return 0.0\n\n"
            "df_education_clean['degree_level'] = df_education_clean['program'].apply(get_degree_level)\n"
            "df_max_degree = df_education_clean.groupby('person_id')['degree_level'].max().reset_index()\n\n"
            "df_agg_edu = df_education_clean.groupby('person_id')['program'].apply(lambda x: ' '.join(str(p) for p in x if pd.notna(p))).reset_index()\n"
            "df_agg_edu.rename(columns={'program': 'aggregated_education'}, inplace=True)\n"
            "df_agg_edu = df_agg_edu.merge(df_max_degree, on='person_id', how='left')"
        )

# Update cell 10 (Step 5: Merge Master)
for cell in nb.cells:
    if cell.cell_type == "code" and "df_master['aggregated_education'] = df_master['aggregated_education'].fillna('')" in cell.source:
        cell.source = cell.source.replace(
            "df_master['aggregated_education'] = df_master['aggregated_education'].fillna('')",
            "df_master['aggregated_education'] = df_master['aggregated_education'].fillna('')\n"
            "df_master['degree_level'] = df_master['degree_level'].fillna(0.0)"
        )

# Update cell 12 (Step 6: Train Multi-Modal ML Model)
for cell in nb.cells:
    if cell.cell_type == "code" and "X = df_train_subset[['profile_text', 'total_experience_years']]" in cell.source:
        cell.source = cell.source.replace(
            "X = df_train_subset[['profile_text', 'total_experience_years']]",
            "X = df_train_subset[['profile_text', 'total_experience_years', 'degree_level']]"
        )
        cell.source = cell.source.replace(
            "('exp', StandardScaler(), ['total_experience_years'])",
            "('exp_and_degree', StandardScaler(), ['total_experience_years', 'degree_level'])"
        )

with open("rebuild_model.ipynb", "w", encoding="utf-8") as f:
    nbformat.write(nb, f)
