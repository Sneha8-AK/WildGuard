# 🧪 WildGuard - Test Cases Documentation

## Project Overview

**WildGuard** is an AI-powered wildlife protection system that combines real-time detection with live animal tracking to prevent wildlife-vehicle collisions and monitor animal movements in the Nallamalla Forest.

---

## Test Cases

### 1. Wildlife Detection System

#### TC-001: Image Upload and Detection

**Objective:** Verify that the system can detect animals in uploaded images

**Preconditions:**

- Application is running
- User is on the dashboard page

**Test Steps:**

1. Navigate to home page (http://localhost:3000)
2. Click on the upload area or drag an image
3. Select an image containing wildlife (e.g., tiger, elephant, deer)
4. Wait for detection to complete

**Expected Results:**

- ✅ Image uploads successfully
- ✅ Detection completes within 3-5 seconds
- ✅ Bounding boxes appear around detected animals
- ✅ Animal type is correctly identified
- ✅ Confidence score is displayed (>70%)
- ✅ Risk level is calculated (Critical/Warning/Caution/Safe)

**Test Data:**

- `dog.jpg` - Should detect dog
- `deer_sample.jpg` - Should detect deer
- Images from `/public/` directory

**Status:** ✅ PASS

---

#### TC-002: Risk Assessment Calculation

**Objective:** Verify accurate risk level assessment

**Test Steps:**

1. Upload image with detected animal
2. Check the risk assessment panel

**Expected Results:**

- ✅ Risk level badge displays correct color:
  - Red for Critical (>80% crossing probability)
  - Orange for Warning (60-80%)
  - Yellow for Caution (40-60%)
  - Green for Safe (<40%)
- ✅ Crossing probability percentage shown
- ✅ Distance to road calculated
- ✅ Vehicle speed considered in calculation

**Status:** ✅ PASS

---

#### TC-003: Multiple Detections

**Objective:** Test system with multiple animals in one image

**Test Steps:**

1. Upload image with multiple animals
2. Verify all animals are detected

**Expected Results:**

- ✅ All visible animals detected
- ✅ Separate bounding boxes for each
- ✅ Individual confidence scores
- ✅ Highest risk animal highlighted

**Status:** ✅ PASS

---

#### TC-004: Alert System

**Objective:** Verify alert notifications work correctly

**Test Steps:**

1. Upload high-risk detection image
2. Check ticker alert at top of page
3. Verify alert center sidebar

**Expected Results:**

- ✅ Ticker shows scrolling alert message
- ✅ Alert includes animal type and risk level
- ✅ Alert center shows detailed information
- ✅ Recommended actions displayed

**Status:** ✅ PASS

---

### 2. Live Animal Tracking System

#### TC-005: Map Initialization

**Objective:** Verify map loads correctly with satellite imagery

**Preconditions:**

- Navigate to /live-tracking page

**Test Steps:**

1. Open http://localhost:3000/live-tracking
2. Wait for map to load

**Expected Results:**

- ✅ Map loads within 2-3 seconds
- ✅ Satellite imagery visible (Esri)
- ✅ Map centered on Nallamalla Forest (16.4833°N, 79.0167°E)
- ✅ Zoom controls functional
- ✅ Pan/drag works smoothly

**Status:** ✅ PASS

---

#### TC-006: Animal Markers Display

**Objective:** Verify all animal markers appear on map

**Test Steps:**

1. Load live tracking page
2. Verify markers appear
3. Count visible markers

**Expected Results:**

- ✅ 10 initial markers appear (one per species)
- ✅ Markers use realistic pin icons
- ✅ Pin colors indicate activity:
  - Red = Running/Chasing
  - Green = Resting
  - Yellow = Eating/Drinking
  - Blue = Near Water
- ✅ All markers clickable

**Status:** ✅ PASS

---

#### TC-007: Animal Filtering

**Objective:** Test species filter functionality

**Test Steps:**

1. Click "Clear" to deselect all animals
2. Select individual species (e.g., Tiger)
3. Verify only selected species shown
4. Click "All" to select all species

**Expected Results:**

- ✅ Markers update immediately on filter change
- ✅ Only selected species visible
- ✅ Statistics update correctly
- ✅ "All" button selects all 10 species
- ✅ "Clear" removes all markers

**Status:** ✅ PASS

---

#### TC-008: Playback Controls

**Objective:** Test animation playback functionality

**Test Steps:**

1. Click "Start Tracking" button
2. Observe marker movement
3. Click "Pause Tracking"
4. Click "Reset" button

**Expected Results:**

- ✅ Animation starts smoothly
- ✅ Markers move to new positions
- ✅ Progress bar updates
- ✅ Active animal count increases
- ✅ Pause stops animation
- ✅ Reset reloads page

**Status:** ✅ PASS

---

#### TC-009: Tracking Paths

**Objective:** Verify movement path visualization

**Test Steps:**

1. Start tracking animation
2. Wait for 5-10 seconds
3. Observe dashed lines

**Expected Results:**

- ✅ Dashed lines appear showing paths
- ✅ Each species has unique color path
- ✅ Paths show last 20 positions
- ✅ Paths update in real-time
- ✅ Lines are semi-transparent (60% opacity)

**Status:** ✅ PASS

---

#### TC-010: Marker Popup Information

**Objective:** Test detailed animal information display

**Test Steps:**

1. Click on any animal marker
2. Read popup information

**Expected Results:**

- ✅ Popup appears immediately
- ✅ Shows animal type and ID
- ✅ Displays current activity
- ✅ Shows movement speed (m/s)
- ✅ Temperature reading present
- ✅ Step count visible
- ✅ Water proximity indicated
- ✅ Date and time stamp shown

**Status:** ✅ PASS

---

#### TC-011: Data Loading (50,000+ Records)

**Objective:** Verify system handles large dataset

**Test Steps:**

1. Load tracking page
2. Monitor browser console
3. Check performance

**Expected Results:**

- ✅ CSV loads without errors
- ✅ 50,000+ records parsed successfully
- ✅ No browser lag or freeze
- ✅ Memory usage acceptable (<500MB)
- ✅ Animation runs at 100ms intervals

**Status:** ✅ PASS

---

#### TC-012: Real-time Statistics

**Objective:** Test live statistics display

**Test Steps:**

1. Start tracking
2. Monitor status bar

**Expected Results:**

- ✅ Active animal count updates
- ✅ Progress counter increments
- ✅ Progress bar fills smoothly
- ✅ Playback status shows correctly
- ✅ Statistics accurate at all times

**Status:** ✅ PASS

---

### 3. Navigation & UI/UX

#### TC-013: Site Navigation

**Objective:** Test navigation between pages

**Test Steps:**

1. Click "Dashboard" in header
2. Click "Live Tracking" in header
3. Verify page transitions

**Expected Results:**

- ✅ Navigation links work
- ✅ Active page highlighted
- ✅ Header persists across pages
- ✅ Logo links to home
- ✅ System status indicator visible

**Status:** ✅ PASS

---

#### TC-014: Responsive Design

**Objective:** Test UI on different screen sizes

**Test Steps:**

1. Resize browser window
2. Test on mobile viewport (375px)
3. Test on tablet (768px)
4. Test on desktop (1920px)

**Expected Results:**

- ✅ Layout adapts to screen size
- ✅ Sidebar stacks on mobile
- ✅ Map remains functional
- ✅ Controls accessible
- ✅ No horizontal scroll

**Status:** ✅ PASS

---

#### TC-015: Performance

**Objective:** Verify application performance

**Test Steps:**

1. Load each page
2. Measure load times
3. Check animation smoothness

**Expected Results:**

- ✅ Home page loads < 2 seconds
- ✅ Tracking page loads < 3 seconds
- ✅ Detection completes < 5 seconds
- ✅ Animation runs at 10 FPS minimum
- ✅ No memory leaks during extended use

**Status:** ✅ PASS

---

## Test Summary

| Category         | Total Tests | Passed | Failed | Pass Rate |
| ---------------- | ----------- | ------ | ------ | --------- |
| Detection System | 4           | 4      | 0      | 100%      |
| Live Tracking    | 8           | 8      | 0      | 100%      |
| Navigation & UI  | 3           | 3      | 0      | 100%      |
| **TOTAL**        | **15**      | **15** | **0**  | **100%**  |

---

## Browser Compatibility

| Browser | Version | Status              |
| ------- | ------- | ------------------- |
| Chrome  | 120+    | ✅ Fully Compatible |
| Firefox | 121+    | ✅ Fully Compatible |
| Safari  | 17+     | ✅ Fully Compatible |
| Edge    | 120+    | ✅ Fully Compatible |

---

## Known Issues

1. **None** - All test cases passing

---

## Test Environment

- **OS:** macOS
- **Node.js:** v18+
- **Next.js:** 16.0.3
- **Browser:** Chrome 120+
- **Dataset:** 50,002 animal movement records

---

## Recommendations

1. ✅ Add automated testing with Jest/Cypress
2. ✅ Implement E2E testing for critical flows
3. ✅ Add performance monitoring
4. ✅ Create load testing for concurrent users
5. ✅ Add accessibility (a11y) testing

---

**Test Date:** December 12, 2024  
**Tester:** Development Team  
**Status:** All Tests Passing ✅
