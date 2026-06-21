# FSG grade-calculator data

Static JSON files for a client-side estimated-grade calculator.

- `index.json`: lightweight parcours selector and file manifest.
- `parcours/{CODE}.json`: complete semesters, teaching units, subjects,
  coefficients, credits, regimes, and hours for one parcours.
- `validation.json`: structural validation and source warnings.

Recommended loading flow:

1. Fetch `index.json`.
2. Let the student choose a parcours.
3. Fetch the selected entry's `dataFile`.
4. Cache that response in the browser.

Records with `hasPlan: false` remain in the index because the university
directory lists them, but its public page currently provides no study plan.
