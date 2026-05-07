# Grant Manager App Walkthrough

This walkthrough covers every major flow in the app, from setup to export. Use it as a step-by-step guide for demos, QA checks, or onboarding.

## 1) Start the app

1. Open a terminal in the project root.
2. Run the dev server:

```bash
npm install
npm run dev
```

3. Open the URL shown in the terminal (usually `http://localhost:5173`).

## 2) Dashboard overview

The Dashboard is the landing page. It shows:
- Recent applications (latest 5)
- Search + group filters
- Quick navigation to Common Information and Applications

### Check Dashboard filters

1. In **Search & Filters**, type a keyword in “Search by name”.
2. Click one or more group chips to filter by common field group.
3. Click **Clear filters** to reset.

Expected result: The “Recent Applications” table updates immediately based on filters.

## 3) Common Information (field setup)

This is where you define reusable common fields across applications.

### View grouped common fields

1. Click **Common Information** in the tabs.
2. Expand/collapse groups to see fields.

### Add a new field

1. Scroll to **Add New Field**.
2. Enter a label, choose a group, and select a type.
3. Click **Add Field**.

### Edit values + view history

1. In **Edit Field Values**, update a field value.
2. Click **Show History** on that field to see version history.
3. Click **Restore** on a prior entry to roll back that field.

Expected result: Each field has its own history log and restore flow.

## 4) Create a new application

1. Click **+ Create New Application**.
2. Enter an application name.
3. Select the common fields to include.
4. Add any application-specific fields.
5. Click **Save Application**.

Expected result:
- The application is saved.
- A snapshot is created automatically (“Created”).
- Per-application field values are captured so later global changes don’t overwrite this app.

## 5) View an application

Open an application to see all details and export tools.

### Common fields included
- Shows the **per-application** common field values (frozen at the time of save).

### Application-specific fields
- Lists custom fields and their values.

### Version history
- Shows saved versions of the application.
- Click **Restore** to revert to a previous version.

### Export preview
- Scroll to **FINAL EXPORT** and **Export Preview**.
- Click **Copy All** or **Download TXT**.

Expected result:
- Export output groups common fields by group name.
- Groups appear in the predefined order.

## 6) Edit an application

1. Click **Edit** on any application.
2. Update the name, selected common fields, or custom fields.
3. Click **Save Changes**.

Expected result:
- A new snapshot is created (“Edited”).
- Per-application field values are updated.
- Older apps keep their prior values.

## 7) Application snapshot history (per save)

Snapshots are saved each time you create or edit an application.

1. Open any application.
2. Scroll to **Saved Snapshots**.
3. Click **View** to preview a snapshot.
4. Toggle **Also restore common field values** on/off.
5. Click **Restore** to apply it.

Expected result:
- Snapshot restore updates the application fields.
- If the toggle is on, it also restores common field values.

## 8) Field-level versioning per application

This ensures global field edits don’t mutate older applications.

1. Create an application and save it.
2. Go to **Common Information** and change a common field value.
3. Return to the saved application.

Expected result:
- The application still shows its **previous** common field values.
- Only that application’s saved values are displayed and exported.

## 9) Search + group filters (Applications list)

1. Go to **Applications**.
2. Use **Search by name** and **Group filters**.
3. Click **Clear filters**.

Expected result: The list updates immediately based on filters.

## 10) Export template ordering

Open any application and check the export preview.

Expected output order:
- Header (Application + Created)
- Common Fields grouped by **group name**
- Groups listed in the predefined order
- Application-specific fields

## 11) Troubleshooting

- If the API is unavailable, you’ll see a banner with **Retry**.
- If values appear inconsistent, refresh the page and retry.

## 12) Optional: Build a production bundle

```bash
npm run build
```

This generates a production build in `dist/`.
