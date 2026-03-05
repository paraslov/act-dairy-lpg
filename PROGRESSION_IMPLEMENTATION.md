# Progression Loop Implementation Summary

## Completed Tasks

### 1. Balance Configuration Updates
- **Added** `moveRewardConfig` section to balance configuration
  - `towardXp: 1` - XP awarded per TOWARD move
  - `awayXp: 1` - XP awarded per AWAY move  
- Updated types, defaults, and Zod schemas in `src/lib/balance/`
- Configuration is tunable via admin UI without redeployment

### 2. Database Schema Changes
- **Added** `shadow_xp` column to `global_progress` table
- **Added** `shadow_xp` column to `sub_value_progress` table
- Migration applied successfully via script

### 3. Progression Service
- **Created** `src/lib/progression/progression-service.ts`
- Implements `processMove()` function that:
  - Inserts move record into `moves` table
  - Creates `moveSubValueLinks` if sub-value is specified
  - Upserts `subValueProgress` with XP (TOWARD adds to currentXp, AWAY adds to shadowXp)
  - Upserts `globalProgress` with XP (TOWARD adds to currentXp, AWAY adds to shadowXp)
  - Inserts audit records into `xpHistory`
  - Updates `diaryDays.towardMovesCount` or `awayMovesCount`
  - All operations run in a single database transaction

### 4. API Integration
- **Updated** `POST /api/diary/notes` to call `processMove()` when `moveType` is set
- **Updated** `PATCH /api/diary/notes/[id]` with minimal moveType change handling:
  - If moveType is added (null → TOWARD/AWAY), processes the move
  - If moveType is changed or removed, logs a warning (XP reversal not implemented in MVP)
- **Created** `GET /api/user/progress` endpoint that:
  - Reads globalProgress, subValueProgress for the user
  - Aggregates sub-value XP into core value XP (grouped by base value)
  - Calls balance engine functions to compute:
    - Path Level and Shadow Path Level
    - Ranks for all sub-values and core values (light + shadow)
    - Integrity Rating
  - Returns comprehensive progress snapshot as JSON

### 5. UI Updates
- **Updated** home page (`src/app/page.tsx`) to:
  - Fetch `/api/user/progress` on mount
  - Display real Path Level instead of hardcoded value
  - Show Integrity Rating prominently
  - Display Core Values with their light and shadow ranks in cards
  - Show loading state while fetching progress
- MilestonesBar now receives real progress percentage

### 6. Testing
- Added basic test file for progression service
- All existing tests pass (34 tests across 4 suites)

## Data Flow

```
User creates diary note with moveType=TOWARD + subValue
  ↓
POST /api/diary/notes
  ↓
processMove() called
  ↓
DB Transaction:
  - INSERT moves
  - INSERT moveSubValueLinks
  - UPSERT subValueProgress (currentXp += 1)
  - UPSERT globalProgress (currentXp += 1)
  - INSERT xpHistory (2 records: SUB_VALUE, GLOBAL)
  - UPDATE diaryDays (towardMovesCount += 1)
  ↓
User navigates to home page
  ↓
GET /api/user/progress
  ↓
Reads XP tables, aggregates core values, calls balance engine
  ↓
Returns: pathLevel, integrityRating, coreValues, subValues
  ↓
UI displays real progression data
```

## Limitations (Deferred for Future Iterations)

1. **Stat XP**: No stat XP tracking yet (requires move-to-stat mapping design)
2. **XP Reversal**: Editing/deleting notes does NOT reverse XP (audit trail preserved)
3. **Shadow Mitigation**: 10% penalty reduction rule not implemented
4. **Quest Completion XP**: Quest lifecycle not yet wired to XP
5. **ACT Narrative**: Story quests, achievements, monsters not implemented

## What Works Now

✅ Create diary note with TOWARD/AWAY moveType + sub-value link
✅ Automatic XP award to personal value, global progress
✅ Shadow XP tracking for AWAY moves  
✅ Path Level calculation from global XP
✅ Core value ranks aggregated from sub-values
✅ Integrity Rating computed from all factors
✅ Real-time progress display on home page
✅ Admin can tune XP rewards via balance config UI

## Next Steps

To test the full loop:
1. Log in as a user
2. Go to /diary
3. Create a note with:
   - Content: "Went for a run"
   - Move Type: TOWARD
   - Sub-Value: (select one, e.g., "Fitness")
4. Go back to home page
5. See Path Level, Integrity Rating, and Core Value ranks update!
