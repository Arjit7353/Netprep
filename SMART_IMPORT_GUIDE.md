/**
 * ═══════════════════════════════════════════════════════════════
 * SMART IMPORT USAGE GUIDE
 * Advanced PYQ Auto-Detection System
 * ═══════════════════════════════════════════════════════════════
 */

# Advanced PYQ Import System - Complete Guide

## Overview

The new **Smart Import System** automatically detects and imports PYQ (Previous Year Questions) data WITHOUT requiring manual clicking on the PYQ section. It intelligently routes data to the appropriate handler based on metadata analysis.

**Key Features:**
- ✅ **Automatic PYQ Detection** - No manual selection needed
- ✅ **Multi-Year Support** - Handles data spanning multiple years seamlessly
- ✅ **Flexible Metadata** - Works with various date/session/shift formats
- ✅ **Batch Import** - Processes multiple year-session combinations in one request
- ✅ **Backward Compatible** - Old import methods still work
- ✅ **Intelligent Routing** - Distinguishes PYQ from regular questions automatically

---

## API Endpoint

### Smart Import (NEW - Recommended)
```
POST /api/questions/smart-import
```

**This replaces the need to manually choose between:**
- POST /api/questions/import (regular questions)
- POST /api/pyq/import (PYQ questions)

---

## How It Works

### 1. Detection Algorithm

The system analyzes your JSON for PYQ indicators:

| Indicator | Priority | Examples |
|-----------|----------|----------|
| Year field | HIGH | `2023`, `2022`, `2021` |
| Session field | HIGH | `"june"`, `"december"`, `"mixed"` |
| Shift field | MEDIUM | `"shift1"`, `"shift2"`, `"none"` |
| Paper field | MEDIUM | `"paper1"`, `"paper2"`, `"p1"`, `"p2"` |
| Source field | MEDIUM | `"UGC NET PYQ"`, `"Previous Year"`, etc. |
| Analysis data | MEDIUM | Stats, weightage, concepts tracking |
| Multi-year flag | MEDIUM | `multiYear: true` |

**Confidence Score:** >= 40% = PYQ, < 40% = Regular Questions

---

## Import Scenarios

### Scenario 1: Single Year PYQ Import

**JSON Format:**
```json
{
  "year": 2023,
  "session": "june",
  "shift": "shift1",
  "paper": "paper1",
  "language": "hi",
  "unit": "Logical Reasoning",
  "source": "UGC NET Previous Year Questions",
  "questions": [
    {
      "type": "mcq",
      "question": "Question text...",
      "options": ["Option 1", "Option 2", ...],
      "correct": 0,
      "explanation": "..."
    },
    ...
  ]
}
```

**Request:**
```bash
curl -X POST http://localhost:5000/api/questions/smart-import \
  -H "Content-Type: application/json" \
  -d @data.json
```

**Response:**
```json
{
  "success": true,
  "message": "Imported: 2023 June Shift1",
  "data": {
    "id": "64a8f2...",
    "displayLabel": "2023 June (Shift 1)",
    "totalQuestions": 100,
    "questionsWithContent": 100
  },
  "routing": {
    "route": "pyq",
    "type": "single_year"
  },
  "detection": {
    "isPYQ": true,
    "confidence": 95
  }
}
```

---

### Scenario 2: Multi-Year Batch Import

**Case A: Explicit batches array**

```json
{
  "multiYear": true,
  "language": "hi",
  "paper": "paper1",
  "unit": "Logical Reasoning",
  "source": "UGC NET Previous Year Questions",
  "batches": [
    {
      "year": 2023,
      "session": "june",
      "shift": "shift1",
      "questions": [...]
    },
    {
      "year": 2023,
      "session": "december",
      "shift": "shift2",
      "questions": [...]
    },
    {
      "year": 2022,
      "session": "june",
      "shift": "shift1",
      "questions": [...]
    }
  ]
}
```

**Case B: yearSessions array**

```json
{
  "language": "hi",
  "paper": "paper1",
  "unit": "Logical Reasoning",
  "source": "UGC NET Previous Year Questions",
  "yearSessions": [
    {
      "year": 2023,
      "session": "june",
      "shift": "shift1"
    },
    {
      "year": 2023,
      "session": "december",
      "shift": "shift2"
    }
  ],
  "questions": [
    {
      "year": 2023,
      "session": "june",
      "shift": "shift1",
      "type": "mcq",
      "question": "...",
      ...
    },
    {
      "year": 2023,
      "session": "december",
      "shift": "shift2",
      "type": "mcq",
      "question": "...",
      ...
    }
  ]
}
```

**Case C: Per-question metadata (auto-grouped)**

```json
{
  "language": "hi",
  "paper": "paper1",
  "unit": "Logical Reasoning",
  "source": "UGC NET Previous Year Questions",
  "questions": [
    {
      "year": 2023,
      "session": "june",
      "shift": "shift1",
      "type": "mcq",
      "question": "Question 1...",
      "options": [...],
      "correct": 0
    },
    {
      "year": 2023,
      "session": "june",
      "shift": "shift2",
      "type": "mcq",
      "question": "Question 2...",
      "options": [...],
      "correct": 1
    },
    {
      "year": 2022,
      "session": "december",
      "shift": "shift1",
      "type": "mcq",
      "question": "Question 3...",
      "options": [...],
      "correct": 2
    }
  ]
}
```

**Response (Multi-Year):**
```json
{
  "success": true,
  "message": "Imported 3/3 year-session combinations",
  "data": {
    "success": true,
    "total": 3,
    "successful": 3,
    "failed": 0,
    "outcomes": [
      {
        "batch": 1,
        "year": 2023,
        "session": "june",
        "shift": "shift1",
        "status": "success",
        "message": "Imported: 2023 June (Shift 1)"
      },
      {
        "batch": 2,
        "year": 2023,
        "session": "december",
        "shift": "shift2",
        "status": "success",
        "message": "Imported: 2023 December (Shift 2)"
      },
      {
        "batch": 3,
        "year": 2022,
        "session": "december",
        "shift": "shift1",
        "status": "success",
        "message": "Imported: 2022 December (Shift 1)"
      }
    ]
  },
  "routing": {
    "route": "pyq",
    "type": "multi_year"
  }
}
```

---

### Scenario 3: Regular Questions (Auto-Detected)

If JSON has NO year/session/shift metadata, it's automatically routed to regular question import:

```json
{
  "language": "hi",
  "unit": "General Knowledge",
  "chapter": "History",
  "topic": "Indian Independence",
  "questions": [
    {
      "type": "mcq",
      "question": "Question text...",
      "options": ["A", "B", "C", "D"],
      "correct": 0
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Import: 1 saved",
  "data": {
    "questions": 1,
    "passages": 0,
    "diData": 0
  },
  "routing": {
    "route": "questions"
  },
  "detection": {
    "isPYQ": false,
    "confidence": 15
  }
}
```

---

## Advanced Features

### Query Parameters

```bash
# Disable auto-translation
?translate=false

# Skip duplicate questions
?skipDuplicates=true

# Both
?translate=false&skipDuplicates=true
```

### JSON-level Options

```json
{
  "year": 2023,
  "session": "june",
  "questions": [...],
  "_translateEnabled": false,
  "_skipDuplicates": true
}
```

---

## Flexible Metadata Formats

The system is **forgiving** with input formats:

### Year Formats (All recognized)
- `2023`, `"2023"`, `2023`, `'2023'`
- Matches any 4-digit number between 2000-2030

### Session Formats
| Input | Normalized To |
|-------|---|
| `"june"`, `"June"`, `"JUNE"`, `"जून"` | `"june"` |
| `"december"`, `"Dec"`, `"दिसंबर"` | `"december"` |
| `"mixed"`, `"both"` | `"mixed"` |

### Shift Formats
| Input | Normalized To |
|-------|---|
| `"shift1"`, `"1st_shift"`, `"morning"`, `"1"`, `"s1"` | `"shift1"` |
| `"shift2"`, `"2nd_shift"`, `"evening"`, `"2"`, `"s2"` | `"shift2"` |
| `"none"`, `"na"`, `"single"`, `"-"` | `"none"` |

### Paper Formats
| Input | Normalized To |
|-------|---|
| `"paper1"`, `"p1"`, `"1"`, `"general"` | `"paper1"` |
| `"paper2"`, `"p2"`, `"2"`, `"history"` | `"paper2"` |

---

## Confidence Scoring

The system explains its decision:

```json
{
  "detection": {
    "isPYQ": true,
    "confidence": 95,
    "type": "multi_year",
    "reasons": [
      "✓ Valid year detected: 2023",
      "✓ Valid session detected: june",
      "✓ Valid shift detected: shift1",
      "✓ Paper specification: paper1",
      "✓ PYQ source indicator: \"UGC NET Previous Year Questions\"",
      "✓ Batch/multi-year structure detected"
    ],
    "indicators": {
      "hasYear": true,
      "hasSession": true,
      "hasShift": true,
      "hasPaper": true,
      "hasSource": true,
      "hasQMetadata": false,
      "hasAnalysis": false,
      "hasMultiYear": true,
      "hasBatches": true
    }
  }
}
```

---

## Migration Guide

### Before (Manual Selection)

```bash
# User had to know: Is this PYQ or regular?
# Regular import
curl -X POST http://localhost:5000/api/questions/import -d @data.json

# OR PYQ import (had to click in UI first)
curl -X POST http://localhost:5000/api/pyq/import -d @data.json
```

### After (Automatic)

```bash
# Just use smart-import - system figures it out!
curl -X POST http://localhost:5000/api/questions/smart-import -d @data.json
```

---

## Error Handling

### Confidence Too Low

```json
{
  "success": false,
  "message": "Import routing failed",
  "reason": "Data does not appear to be PYQ data (low confidence)",
  "warnings": [
    "Confidence score: 25%. If you're sure this is PYQ data, set 'year', 'session', or 'shift' field explicitly."
  ],
  "detection": {
    "isPYQ": false,
    "confidence": 25
  }
}
```

**Solution:** Add explicit year/session metadata:
```json
{
  "year": 2023,
  "session": "june",
  "questions": [...]
}
```

### Multi-Year Partial Failure

```json
{
  "success": false,
  "message": "Imported 2/3 year-session combinations (1 failed)",
  "data": {
    "total": 3,
    "successful": 2,
    "failed": 1,
    "outcomes": [
      { "batch": 1, "status": "success", ... },
      { "batch": 2, "status": "success", ... },
      { "batch": 3, "status": "failed", "error": "..." }
    ]
  }
}
```

---

## Performance Tips

### Large Multi-Year Imports

For very large datasets (1000+ questions × multiple years):

```bash
# Disable translation (faster)
curl -X POST http://localhost:5000/api/questions/smart-import?translate=false \
  -H "Content-Type: application/json" \
  -d @large_data.json
```

### Batch Optimization

Organize questions by year to allow parallel processing:

```json
{
  "batches": [
    { "year": 2023, "session": "june", "questions": [...] },
    { "year": 2023, "session": "december", "questions": [...] },
    { "year": 2022, "session": "june", "questions": [...] }
  ]
}
```

---

## Support for Legacy Endpoints

The old endpoints still work:

- `POST /api/questions/import` - Regular questions (old)
- `POST /api/pyq/import` - PYQ questions (old)
- `POST /api/questions/smart-import` - **NEW: Smart auto-detection (recommended)**

---

## Summary

| Feature | Before | After |
|---------|--------|-------|
| PYQ Import | Manual click → endpoint | Auto-detected via metadata |
| Multi-year | Multiple separate uploads | Single batch upload |
| Flexibility | Strict format required | Flexible formats accepted |
| User Experience | Confusing choice | Transparent auto-routing |
| Auto-translation | Only for PYQ | For both, auto-enabled |

---

## Questions or Issues?

The system provides detailed detection info in every response to help troubleshoot.
