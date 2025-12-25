# Survey/Feedback Feature Setup Instructions

## Prerequisites
Before setting up surveys, make sure you have run the basic database setup:
1. Run `supabase-setup.sql` first (creates all base tables)
2. Run `add-feedback-table.sql` (creates the feedback table)
3. Then run `add-surveys-table.sql` (creates surveys table and links to feedback)

## Step-by-Step Setup

### Step 1: Create Feedback Table
1. Go to your Supabase SQL Editor: https://supabase.com/dashboard
2. Open `add-feedback-table.sql`
3. Copy the entire contents
4. Paste into SQL Editor and click "Run"

### Step 2: Create Surveys Table
1. In the same SQL Editor, open `add-surveys-table.sql`
2. Copy the entire contents
3. Paste into SQL Editor and click "Run"
4. This will:
   - Create the `surveys` table
   - Add `survey_id` column to the `feedback` table
   - Enable realtime subscriptions

## Verification

After running both scripts, verify the setup:

```sql
-- Check if both tables exist
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('feedback', 'surveys')
ORDER BY tablename;

-- Check if survey_id column exists in feedback table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'feedback' 
  AND column_name = 'survey_id';

-- Check if Realtime is enabled
SELECT 
  tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename IN ('feedback', 'surveys')
    ) 
    THEN '✅ Realtime Enabled' 
    ELSE '❌ Realtime Not Enabled' 
  END as realtime_status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('feedback', 'surveys');
```

## Usage

Once set up:
- Management users (Admin/Management/HOD) can create surveys from the Feedback page
- All users can see active surveys and provide feedback
- Feedback can be linked to specific surveys
- Management can close or delete surveys

