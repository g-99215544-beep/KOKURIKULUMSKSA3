# CLAUDE.md - AI Assistant Guide for e-KOKURIKULUM SK SRI AMAN

## Project Overview

This is **e-KOKURIKULUM SK SRI AMAN** - a comprehensive co-curricular management system (Sistem Pengurusan Kokurikulum) for SK Sri Aman primary school in Malaysia. The system manages attendance tracking, weekly reports, organizational charts, annual planning, achievements gallery, and coordinator reminders.

**Language**: The UI is in **Bahasa Malaysia (Malay)**. Maintain this language for all user-facing text.

## Tech Stack

- **Frontend**: React 18 + TypeScript 5.2
- **Build Tool**: Vite 5.2
- **Styling**: Tailwind CSS (via CDN)
- **Animations**: Framer Motion 11.0
- **Database**: Firebase Realtime Database (Asia-Southeast1 region)
- **File Storage**: Google Drive (via Google Apps Script)
- **PDF Generation**: html2pdf.js (CDN)

## Directory Structure

```
/
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI primitives (Button, Input, Card)
│   ├── Header.tsx       # App header with admin login trigger
│   ├── DeleteConfirmationModal.tsx
│   └── PDFViewerModal.tsx
├── modules/             # Feature pages/views
│   ├── AdminDashboard.tsx        # Super admin compliance overview
│   ├── AnnualPlanManager.tsx     # Rancangan Tahunan management
│   ├── AttendanceForm.tsx        # Kehadiran entry form
│   ├── AttendanceList.tsx        # View attendance records
│   ├── CoordinatorManager.tsx    # Flare/reminder assignments
│   ├── ExternalTab.tsx           # Achievements/Hall of Fame
│   ├── GalleryManager.tsx        # Photo gallery
│   ├── MeetingScheduleManager.tsx # Admin meeting deadlines
│   ├── OrgChartManager.tsx       # Carta Organisasi
│   ├── TeacherManager.tsx        # Teacher list management
│   ├── UnitDashboard.tsx         # Unit navigation hub
│   ├── UnitSelector.tsx          # Homepage unit selection
│   └── WeeklyReportForm.tsx      # Laporan Mingguan (largest module)
├── services/            # Business logic & external integrations
│   ├── firebaseService.ts       # Firebase CRUD operations
│   ├── gasService.ts            # Google Apps Script integration
│   └── complianceService.ts     # Deadline compliance checking
├── data/
│   └── studentData.ts           # Static student roster by unit/class
├── scripts/
│   └── populateTeachersToFirebase.ts  # Data migration script
├── App.tsx              # Main app component with routing/state
├── types.ts             # TypeScript interfaces and enums
├── index.tsx            # React entry point
└── index.html           # HTML template with CDN imports
```

## Key Commands

```bash
npm run dev          # Start development server (Vite)
npm run build        # Production build to dist/
npm run preview      # Preview production build
npm run populate-teachers  # Run teacher migration script
```

## Core Concepts

### Unit Categories (UnitCategory enum)

Three types of co-curricular units:
- `UNIT_BERUNIFORM` - Uniformed units (Scouts, TKRS, Puteri Islam, etc.)
- `KELAB_PERSATUAN` - Clubs & associations
- `SATU_M_SATU_S` (1M1S) - 1 Student 1 Sport program

### User Roles (UserRole enum)

- `GUEST` - Default, read-only access
- `UNIT_ADMIN` - Unit-level administration (currently unused)
- `SUPER_ADMIN` - Full admin access (password: "admin123")

### App Views

Navigation state controlled by `AppState.view`:
- `HOME` - Unit selector / Achievements tab
- `UNIT_DASHBOARD` - Unit-specific navigation hub
- `FORM_REPORT` - Weekly report submission
- `VIEW_ATTENDANCE` / `FORM_ATTENDANCE` - Attendance management
- `VIEW_ORG` - Organizational chart
- `VIEW_PLAN` - Annual plan
- `VIEW_GALLERY` - Photo gallery
- `MANAGE_TEACHERS` - Teacher list (admin)
- `MEETING_SCHEDULE` - Meeting deadlines (admin)
- `COORDINATOR` - Flare assignments (admin)
- `ADMIN_DASHBOARD` - Compliance overview (admin)

## Firebase Data Structure

Database nodes in `kokodata-5d5e2` (Asia-Southeast1):

| Node | Purpose | Key Fields |
|------|---------|------------|
| `kehadiran_murid` | Attendance records | unitName, week, date, classes[], percentage |
| `laporan_mingguan` | Weekly reports | unitName, year, tarikh, aktiviti1-3, pdfUrl |
| `carta_organisasi` | Org charts | unitName, year, pengerusi, setiausaha, etc. |
| `rancangan_tahunan` | Annual plans | unitName, year, planItems[] |
| `meeting_schedules` | Meeting deadlines | category, weekNumber, deadline, year |
| `unit_flares` | Reminders/notifications | unitName, flareType, weekNumber, year |
| `achievements` | Hall of Fame | year, level, event, result, imageUrl |
| `unit_teachers` | Teacher assignments | unitId, teachers[] |

## State Management Patterns

### Global State
- Single `AppState` object in `App.tsx` using `useState`
- Navigation via `setState` updates to `view` property
- No external state library (Redux, Zustand, etc.)

### Local Storage
- Weekly report drafts auto-saved with key: `weeklyReportDraft_${unitId}_${year}`
- Clear on successful submission

### Data Fetching
- On-demand fetching, not real-time subscriptions
- All Firebase operations in `firebaseService.ts`
- Google Drive operations in `gasService.ts`

## Code Conventions

### TypeScript
- Strict mode enabled
- Interfaces in `types.ts` for shared types
- Service-specific interfaces in service files (e.g., `OrgChartData`, `AnnualPlanData`)

### Component Patterns
- Functional components with hooks
- Props destructuring in function signature
- Event handlers named `handle*` (e.g., `handleSubmit`, `handleDelete`)

### Styling
- Tailwind CSS utility classes
- Consistent color scheme: red-600/700 primary, gray/slate neutrals
- Framer Motion for page transitions (200ms duration)
- Mobile-first responsive design

### Error Handling
- Try-catch in all async operations
- Console logging for debugging (Malay comments)
- User-friendly alert messages in Malay

### Naming Conventions
- Components: PascalCase (e.g., `WeeklyReportForm`)
- Functions: camelCase (e.g., `submitAttendance`)
- Constants: UPPER_SNAKE_CASE (e.g., `CATEGORY_LABELS`)
- Malay terms preserved in data fields (e.g., `perjumpaanKali`, `tarikh`)

## Important Interfaces

```typescript
// Weekly report data structure
interface WeeklyReportData {
  unitId: string;
  unitName: string;
  year: number;
  perjumpaanKali: string;  // Meeting number
  tarikh: string;          // Date
  hari: string;            // Day
  masa: string;            // Time
  tempat: string;          // Venue
  muridHadir: string;      // Students present
  jumlahMurid: string;     // Total students
  selectedTeachers: string[];
  aktiviti1-3: string;     // Activities
  pikebm: string;          // PIKEBM reference
  refleksi: string;        // Reflection
  imageUrls?: string[];
  pdfUrl?: string;
}

// Attendance record structure
interface AttendanceRecord {
  unitId: string;
  unitName: string;
  week: string;
  date: string;
  classes: {
    className: string;
    students: { name: string; status: 'HADIR' | 'TIDAK HADIR' }[];
  }[];
}

// Flare/reminder types
type FlareType = 'KEHADIRAN' | 'LAPORAN_MINGGUAN' | 'CARTA_ORGANISASI' | 'RANCANGAN_TAHUNAN';
```

## Common Development Tasks

### Adding a New Module/View

1. Create component in `modules/` directory
2. Add view type to `AppState.view` union in `types.ts`
3. Add navigation hierarchy in `App.tsx` `viewHierarchy` object
4. Add rendering case in `renderContent()` function
5. Add navigation button/link from appropriate parent view

### Adding Firebase Operations

1. Add interface in `firebaseService.ts` if new data type
2. Implement CRUD functions following existing patterns
3. Use `serverTimestamp()` for timestamps
4. Handle errors with try-catch, log in Malay

### Working with PDFs

- PDF generation uses `html2pdf.js` (client-side)
- PDFs uploaded to Google Drive via `gasService.uploadPDF()`
- Transaction pattern: Save to Firebase first, then generate/upload PDF

## Data Protection Pattern

For forms with important data (like WeeklyReportForm):

1. **Auto-save to LocalStorage** on every change
2. **Save to Firebase** before PDF generation
3. **Generate PDF** from form data
4. **Upload to Google Drive**
5. **Update Firebase** with PDF URL
6. **Clear LocalStorage** only on full success

## Testing Guidance

No automated tests currently. When testing manually:

- Test admin login (password: "admin123")
- Test CRUD operations for each module
- Test offline/error scenarios
- Verify Firebase data persistence
- Check PDF generation and Drive upload
- Test on mobile viewport (PWA-ready)

## Environment Notes

- Firebase config is hardcoded (not env vars)
- GAS endpoints in `gasService.ts`
- No `.env` file required for basic development
- Database region: Asia-Southeast1 (Singapore)

## Browser Compatibility

- Modern browsers (ES2020 target)
- PWA manifest for mobile app-like experience
- Custom back button handling for SPA navigation

## Deployment

Build produces static files in `dist/`:
```bash
npm run build
```

Deploy to any static hosting (Vercel, Netlify, Firebase Hosting).

## Recent Development Focus

Based on git history:
- Coordinator system with flare/reminder assignments
- Data protection improvements for weekly reports
- Teacher management with Firebase storage
- Admin dashboard with compliance tracking
- Notification badge system cleanup
