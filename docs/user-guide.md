# neuDiff User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Basic Usage](#basic-usage)
4. [Features](#features)
5. [Navigation](#navigation)
6. [Tips & Tricks](#tips-tricks)
7. [Troubleshooting](#troubleshooting)

## Introduction

**neuDiff** is a comparative visualization tool for exploring and comparing cell type pages from neuroscience datasets. It provides a simple side-by-side interface that lets you view two cell type pages simultaneously, making it easy to compare morphology, connectivity, and other properties.

### What neuDiff Does

- **Side-by-Side Comparison**: View two cell type pages at the same time
- **Cross-Dataset Support**: Compare cell types from different datasets
- **Flexible Combinations**: Compare different cell types, same cell type across datasets, or any combination
- **Smart Synchronization**: Dropdowns automatically update when you navigate within pages
- **Shareable Links**: URL updates automatically so you can bookmark or share specific comparisons

### What neuDiff Doesn't Do

neuDiff is a simple viewer that doesn't provide new data or analysis. It just shows existing cell type pages side-by-side. Think of it as opening two browser windows, but more convenient.

## Getting Started

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Wide monitor recommended for best viewing experience
- Internet connection to load cell type data

### Accessing neuDiff

1. Open neuDiff in your web browser
2. You'll see a welcome screen with four dropdown menus
3. No installation or setup required!

### Display Recommendations

neuDiff works best on wide monitors where both viewers can be displayed side-by-side. For smaller screens or tablets, consider opening cell type pages in separate browser tabs instead.

## Basic Usage

### Selecting Cell Types

1. **Choose Dataset A**
   - Click the "Dataset A" dropdown
   - Select a dataset (e.g., "Male CNS")

2. **Choose Cell Type A**
   - Click the "Cell Type A" dropdown
   - Select a cell type (e.g., "LC11")
   - Type letters to jump quickly (e.g., type "LC" to jump to LC cell types)

3. **Choose Hemisphere A** (if available)
   - Select "Combined", "Left", or "Right"
   - Some cell types only have combined views

4. **Repeat for Viewer B**
   - Select Dataset B and Cell Type B
   - Both viewers are independent

### Resetting Your Selection

Click the **neuDiff** button in the top-left corner at any time to:
- Clear all selections
- Return to the welcome screen
- Start a new comparison

## Features

### Automatic Dropdown Synchronization

When you click links inside the cell type pages, the dropdown menus automatically update to reflect your current location.

#### How It Works

1. Select a cell type using the dropdowns
2. Click any link within the page (e.g., in a connectivity table)
3. Watch the dropdowns update automatically
4. No manual adjustment needed!

#### Example: Navigating via Connectivity Table

You're viewing **LC11** in Viewer A:
- Current: `Cell Type A: LC11`, `Hemisphere A: Combined`
- You click **T4a** in the downstream connectivity table
- Dropdowns update to: `Cell Type A: T4a`, `Hemisphere A: Combined`

#### Example: Switching Hemispheres

You're viewing **Mi1** (combined):
- Current: `Cell Type: Mi1`, `Hemisphere: Combined`
- You click a link to the left hemisphere version
- Dropdowns update to: `Cell Type: Mi1`, `Hemisphere: Left`

#### What Gets Synchronized

✅ Cell Type dropdown - Updates when navigating to different cell types

✅ Hemisphere dropdown - Updates when switching between combined/left/right

✅ URL parameters - Browser URL updates for bookmarking/sharing

✅ Independent viewers - Viewer A and B sync independently

#### What Doesn't Get Synchronized

❌ Dataset changes - Navigation to different datasets won't change dropdowns

❌ External links - Links to external websites don't trigger sync

❌ Manual scrolling - Only page navigation triggers sync, not scrolling

### URL State Management

The browser URL automatically updates to include your current selections:
```
?datasetA=Male%20CNS&celltypeA=lc11&hemisphereA=combined&datasetB=...
```

This means you can:
- **Bookmark** specific comparisons
- **Share** URLs with colleagues
- **Use browser history** to revisit previous comparisons

### Hemisphere Support

Many cell types have separate pages for left and right hemispheres:
- **Combined**: Shows both hemispheres together
- **Left**: Shows only the left hemisphere
- **Right**: Shows only the right hemisphere

The hemisphere dropdown automatically populates based on what's available for each cell type. If a cell type doesn't have hemisphere-specific data, the dropdown will be disabled.

## Navigation

### Within Cell Type Pages

You can interact with the cell type pages normally:
- **Click links** to navigate to related cell types
- **Scroll** to view different sections
- **Interact with visualizations** (if supported by the page)
- **Use browser back/forward** buttons

### Keyboard Shortcuts

When dropdown menus are open:
- Type letters to jump to cell types starting with those letters
- Use arrow keys to move through options
- Press Enter to select
- Press Esc to close without selecting

### Multiple Comparisons

To compare multiple cell types:
1. Set up your first comparison in Viewers A and B
2. Note the URL or bookmark it
3. Open a new browser tab for a different comparison
4. Switch between tabs to compare

## Tips & Tricks

### Tip 1: Quick Cell Type Exploration

Use the auto-sync feature to explore related cell types:
1. Select a cell type in Viewer A
2. Click through connectivity partners
3. Manually select the same partners in Viewer B
4. Now you have a side-by-side comparison

### Tip 2: Cross-Dataset Comparison

Compare how the same cell type is represented in different datasets:
1. Set Dataset A to "Male CNS"
2. Set Cell Type A to "LC11"
3. Set Dataset B to "Female Adult Fly Brain"
4. Set Cell Type B to "LC11"
5. Compare the differences!

### Tip 3: Hemisphere Comparison

Compare left and right hemispheres of the same cell type:
1. Set both viewers to the same dataset
2. Set both to the same cell type
3. Set Viewer A to "Left hemisphere"
4. Set Viewer B to "Right hemisphere"

### Tip 4: Using Type-Ahead

Dropdowns support type-ahead search:
- Open the Cell Type dropdown
- Start typing the cell type name
- The list jumps to matching entries
- Much faster than scrolling!

### Tip 5: Sharing Comparisons

To share a specific comparison with a colleague:
1. Set up the comparison you want to share
2. Copy the URL from the browser address bar
3. Send it via email or chat
4. Your colleague opens the URL and sees the same comparison

## Troubleshooting

### Dropdowns Not Updating After Navigation

**Possible Reasons:**
- The new cell type isn't in the current dataset
- You navigated to an external page
- The iframe-bridge script isn't loaded in the cell type pages

**Solution:**
- Manually select the cell type using the dropdown
- The core functionality still works even without auto-sync

### Wrong Hemisphere Selected

**Possible Reasons:**
- The target hemisphere isn't available for the new cell type
- System defaulted to "Combined" as a fallback

**Solution:**
- Use the hemisphere dropdown to manually select your preferred view

### Cell Type Page Not Loading

**Possible Reasons:**
- Network connection issue
- The cell type page doesn't exist in the selected dataset
- Server hosting the dataset is down

**Solution:**
- Check your internet connection
- Try a different cell type
- Try again later if the server is down

### Dropdowns Are Empty

**Possible Reasons:**
- Dataset hasn't finished loading yet
- Network error prevented data from loading

**Solution:**
- Wait a moment for the dataset to load
- Refresh the page
- Check browser console for error messages

### URL Doesn't Update

**Possible Reasons:**
- Navigation is still in progress
- You scrolled within the same page (not a new page)
- Browser settings prevent URL changes

**Solution:**
- Wait a moment for navigation to complete
- Manually copy the current state if needed

### Display Issues on Small Screens

**Problem:**
Side-by-side view is cramped on small screens

**Solution:**
- Use a wider monitor if available
- Zoom out in your browser (Ctrl/Cmd + minus)
- Consider opening separate browser tabs instead of using neuDiff

### Slow Performance

**Possible Reasons:**
- Cell type pages contain large visualizations
- Many browser tabs open
- Slow internet connection

**Solution:**
- Close other browser tabs
- Wait for pages to fully load before navigating
- Check your internet connection speed

## Available Datasets

neuDiff currently supports these datasets:

1. **Male CNS**
   - Comprehensive cell type catalogue for male Drosophila CNS
   - URL: https://reiserlab.github.io/celltype-explorer-drosophila-male-cns

2. **Female Adult Fly Brain**
   - Cell type catalogue for female Drosophila adult fly brain
   - URL: https://reiserlab.github.io/celltype-explorer-drosophila-female-adult-fly-brain/

More datasets can be added by the development team.

## Feedback and Support

If you encounter issues or have suggestions:
- Check the browser console for error messages (F12 → Console tab)
- Note which cell types and datasets you were viewing
- Report issues to the development team

## Privacy and Data

- **No data collection**: neuDiff doesn't track or store your usage
- **Local processing**: All processing happens in your browser
- **No external servers**: Data loads directly from dataset repositories
- **Privacy-friendly**: No cookies, no analytics, no tracking

---

**Last Updated:** 2025  
**Version:** 1.0  
**Project:** neuDiff - A simple comparative visualization tool for neuroscience datasets