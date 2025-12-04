# neuDiff Developer Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Iframe Synchronization System](#iframe-synchronization-system)
5. [Adding New Datasets](#adding-new-datasets)
6. [API Documentation](#api-documentation)
7. [Development Workflow](#development-workflow)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Contributing](#contributing)

## Architecture Overview

neuDiff is a **static, client-side web application** built with vanilla JavaScript, HTML, and CSS. It requires no build process, no backend server, and has zero runtime dependencies.

### Design Philosophy

- **Simplicity First**: No frameworks, no build tools, just standard web technologies
- **Zero Dependencies**: Everything runs in the browser
- **Static Hosting**: Can be deployed to any static file server
- **Progressive Enhancement**: Core functionality works without advanced features

### Technology Stack

- **HTML5**: Semantic markup
- **CSS3**: Styling with Plume CSS framework
- **Vanilla JavaScript (ES6+)**: No framework dependencies
- **Iframe Embedding**: For displaying cell type pages
- **PostMessage API**: For cross-origin communication

## Project Structure

```
neudiff/
├── index.html                      # Main application entry point
├── README.md                       # Project overview
├── test-iframe-sync.html          # Test harness for iframe sync
│
├── api/
│   ├── iframe-bridge.js           # Embedded in cell type pages
│   └── README.md                  # Iframe API documentation
│
├── assets/
│   └── images/                    # Image assets
│
├── docs/
│   ├── user-guide.md             # User-facing documentation
│   └── developer-guide.md        # This file
│
├── scripts/
│   └── main.js                    # Core application logic
│
└── styles/
    ├── plume-all.css             # UI framework
    └── main.css                   # Custom styles
```

### Key Files

#### `index.html`
- Main HTML structure
- Dropdown menus for dataset/cell type selection
- Two iframe containers (Viewer A and Viewer B)
- Welcome screen

#### `scripts/main.js`
- Dataset registry management
- Neuron data loading and parsing
- Dropdown population and event handling
- URL state management
- Iframe synchronization listener
- URL matching algorithm

#### `api/iframe-bridge.js`
- Embedded in cell type pages
- Detects URL changes via multiple methods
- Sends postMessage to parent window
- Configurable target origin and debug mode

## Core Components

### Dataset Registry

The dataset registry pattern allows easy addition of new datasets:

```javascript
const datasetRegistry = {
  datasets: [],
  
  add(name, baseUrl) {
    this.datasets.push({ name, baseUrl });
  },
  
  getAll() {
    return this.datasets;
  },
  
  getByName(name) {
    return this.datasets.find(d => d.name === name);
  }
};
```

**Default Datasets:**

```javascript
datasetRegistry.add(
  "Male CNS",
  "https://reiserlab.github.io/celltype-explorer-drosophila-male-cns"
);

datasetRegistry.add(
  "Female Adult Fly Brain",
  "https://reiserlab.github.io/celltype-explorer-drosophila-female-adult-fly-brain/"
);
```

### Viewer State Management

Each viewer (A and B) maintains its own state:

```javascript
const viewer = {
  id: 'viewerA',
  state: {
    dataset: null,      // Selected dataset object
    baseUrl: '',        // Base URL for the dataset
    neuronData: [],     // Array of neuron objects from neurons.json
    neuron: null,       // Currently selected neuron name
    hemisphere: null    // Currently selected hemisphere
  },
  elements: {
    iframe: null,           // Reference to iframe element
    datasetSelect: null,    // Dataset dropdown
    neuronSelect: null,     // Neuron dropdown
    hemisphereSelect: null  // Hemisphere dropdown
  }
};
```

### Neuron Data Structure

Neuron data is loaded from `neurons.json` (or `neuron_data.js`) in each dataset:

```javascript
{
  "name": "LC11",                    // Cell type name
  "urls": {
    "combined": "LC11.html",         // Combined hemisphere page
    "left": "LC11_L.html",          // Left hemisphere page
    "right": "LC11_R.html"          // Right hemisphere page
  }
}
```

**Note:** Not all cell types have all three hemispheres. The hemisphere dropdown is populated dynamically based on available URLs.

## Iframe Synchronization System

The iframe synchronization system allows dropdowns to automatically update when users navigate within cell type pages.

### Architecture

```
Cell Type Page (iframe)          Parent Window (neuDiff)
┌────────────────────┐          ┌────────────────────┐
│                    │          │                    │
│  iframe-bridge.js  │──────────│  Message Listener  │
│                    │ postMsg  │                    │
│  • URL Detection   │          │  • URL Matching    │
│  • Navigation      │          │  • Dropdown Update │
│    Monitoring      │          │  • State Update    │
│                    │          │                    │
└────────────────────┘          └────────────────────┘
```

### Message Flow

1. **User clicks link in iframe** → Cell type page navigates
2. **iframe-bridge.js detects URL change** → Multiple detection methods
3. **Sends postMessage to parent** → `{type: 'neuview-url-changed', url: '...'}`
4. **Parent receives message** → Validates and identifies source iframe
5. **Matches URL against neurons.json** → Finds neuron name and hemisphere
6. **Updates dropdowns** → Neuron and hemisphere selectors
7. **Updates URL parameters** → Browser address bar

### URL Detection Methods

The iframe-bridge.js uses multiple methods to detect navigation:

1. **History API Interception**
   - Wraps `pushState` and `replaceState`
   - Detects programmatic navigation

2. **Hash Change Events**
   - Listens to `hashchange` event
   - Detects anchor navigation

3. **Link Click Interception**
   - Intercepts all anchor clicks
   - Detects user-initiated navigation

4. **Browser Navigation**
   - Listens to `popstate` event
   - Detects back/forward button clicks

5. **Polling Fallback**
   - Checks `window.location.href` every second
   - Catches edge cases

### URL Matching Algorithm

Instead of parsing URLs or making assumptions about filename structure, the system uses a **matching approach**:

```javascript
function findNeuronByUrl(viewers, iframeWindow, newUrl) {
  // 1. Identify which viewer's iframe sent the message
  const viewer = viewers.find(v => 
    v.elements.iframe?.contentWindow === iframeWindow
  );
  
  if (!viewer?.state?.neuronData) return null;
  
  // 2. Normalize the target URL
  const normalizedTarget = normalizeUrl(newUrl);
  
  // 3. Iterate through all neurons in the dataset
  for (const neuron of viewer.state.neuronData) {
    if (!neuron.urls) continue;
    
    // 4. Check each hemisphere URL
    for (const [hemisphere, relativeUrl] of Object.entries(neuron.urls)) {
      // 5. Build expected full URL
      const fullUrl = buildPreviewUrl(
        viewer.state.baseUrl, 
        `/types/${relativeUrl}`
      );
      
      // 6. Normalize and compare
      if (normalizeUrl(fullUrl) === normalizedTarget) {
        return {
          neuronName: neuron.name,
          hemisphere: hemisphere
        };
      }
    }
  }
  
  return null;
}

function normalizeUrl(url) {
  // Remove trailing slashes and fragments
  return url.replace(/#.*$/, '').replace(/\/$/, '');
}
```

**Advantages:**
- Works with any URL structure
- No assumptions about filename patterns
- Resilient to special characters
- Single source of truth: neurons.json

### Prevention of Infinite Loops

When updating dropdowns programmatically, we temporarily disable event handlers to prevent circular updates:

```javascript
function setDropdownValue(select, value) {
  const originalOnChange = select.onchange;
  select.onchange = null;        // Disable handler
  select.value = value;          // Update value
  select.onchange = originalOnChange;  // Re-enable handler
}
```

### Message Structure

Messages sent from iframe to parent:

```javascript
{
  type: 'neuview-url-changed',
  url: 'https://example.com/types/LC11_left.html',
  timestamp: Date.now()
}
```

### Security Considerations

**Development Mode:**
- `targetOrigin: '*'` allows any origin (default)
- Convenient for local development

**Production Mode:**
```javascript
// In iframe-bridge.js
window.neuviewIframeBridge.setTargetOrigin(
  'https://your-neudiff-domain.com'
);
```

**Parent Validation:**
- Checks message type is `neuview-url-changed`
- Validates message source is a known iframe element
- Only processes messages from embedded iframes

## Adding New Datasets

### Step 1: Register the Dataset

In `scripts/main.js`, add to the dataset registry:

```javascript
datasetRegistry.add(
  "Your Dataset Name",
  "https://url-to-your-dataset/"
);
```

### Step 2: Dataset Requirements

Your dataset must have:

1. **Neuron Data File**: `neurons.json` or `neuron_data.js`
   - Located at `{baseUrl}/data/neurons.json` or `{baseUrl}/neuron_data.js`
   - Format:
   ```javascript
   [
     {
       "name": "CellTypeName",
       "urls": {
         "combined": "CellTypeName.html",
         "left": "CellTypeName_L.html",
         "right": "CellTypeName_R.html"
       }
     }
   ]
   ```

2. **Cell Type Pages**: Individual HTML pages
   - Located at `{baseUrl}/types/{filename}.html`
   - Example: `https://dataset.com/types/LC11.html`

3. **CORS Headers**: Allow cross-origin requests
   - Required for loading data files
   - Most GitHub Pages deployments work automatically

### Step 3: Enable Iframe Synchronization (Optional)

To enable automatic dropdown synchronization, cell type pages must include `iframe-bridge.js`:

```html
<!-- In cell type page template -->
<script src="../api/iframe-bridge.js"></script>
```

Or copy `iframe-bridge.js` to your dataset repository:

```
your-dataset/
├── api/
│   └── iframe-bridge.js
├── data/
│   └── neurons.json
└── types/
    ├── LC11.html (includes ../api/iframe-bridge.js)
    └── ...
```

### Step 4: Test the Integration

1. Open neuDiff in a browser
2. Select your new dataset from the dropdown
3. Verify cell types are populated
4. Test navigation and synchronization

## API Documentation

### Dataset Registry API

#### `datasetRegistry.add(name, baseUrl)`
Add a new dataset to the registry.

**Parameters:**
- `name` (string): Display name for the dataset
- `baseUrl` (string): Base URL where the dataset is hosted

**Example:**
```javascript
datasetRegistry.add("My Dataset", "https://example.com/dataset/");
```

#### `datasetRegistry.getAll()`
Get all registered datasets.

**Returns:** Array of dataset objects

#### `datasetRegistry.getByName(name)`
Get a specific dataset by name.

**Parameters:**
- `name` (string): Dataset name

**Returns:** Dataset object or undefined

### Viewer API

#### `loadDatasetForViewer(viewer, datasetName)`
Load a dataset into a viewer.

**Parameters:**
- `viewer` (object): Viewer state object
- `datasetName` (string): Name of dataset to load

**Behavior:**
- Fetches neuron data from dataset
- Populates neuron dropdown
- Updates viewer state

#### `loadNeuronPreview(viewer, neuronName, hemisphere)`
Load a cell type page into the viewer iframe.

**Parameters:**
- `viewer` (object): Viewer state object
- `neuronName` (string): Cell type name
- `hemisphere` (string): 'combined', 'left', or 'right'

**Behavior:**
- Finds neuron in viewer's neuronData
- Constructs preview URL
- Updates iframe src
- Updates URL parameters

### Iframe Bridge API

#### `window.neuviewIframeBridge.setTargetOrigin(origin)`
Set the target origin for postMessage.

**Parameters:**
- `origin` (string): Target origin URL or '*'

**Example:**
```javascript
window.neuviewIframeBridge.setTargetOrigin('https://neudiff.com');
```

#### `window.neuviewIframeBridge.setDebug(enabled)`
Enable or disable debug logging.

**Parameters:**
- `enabled` (boolean): true to enable, false to disable

**Example:**
```javascript
window.neuviewIframeBridge.setDebug(true);
```

## Development Workflow

### Local Development

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd neudiff
   ```

2. **Start a local server:**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js
   npx http-server
   
   # PHP
   php -S localhost:8000
   ```

3. **Open in browser:**
   ```
   http://localhost:8000
   ```

### Code Style

- Use ES6+ features (const/let, arrow functions, template literals)
- Consistent indentation (2 or 4 spaces)
- Descriptive variable names
- Comments for complex logic
- No external dependencies

### Browser Console

Enable debug mode to see synchronization messages:

**In cell type page console (iframe):**
```javascript
window.neuviewIframeBridge.setDebug(true);
```

**In parent window console:**
```javascript
window.addEventListener('message', (e) => console.log('Message:', e.data));
```

## Testing

### Manual Testing

Use the provided test harness:

1. Open `test-iframe-sync.html` in a browser
2. Click test buttons to simulate navigation
3. Check console for debug messages
4. Verify dropdowns update correctly

### Testing Checklist

- [ ] Dataset loading
  - [ ] Dataset dropdown populates
  - [ ] Neuron data loads correctly
  - [ ] Cell type dropdown populates
- [ ] Neuron selection
  - [ ] Selecting neuron loads preview
  - [ ] Hemisphere options populate correctly
  - [ ] Iframe displays correct page
- [ ] URL state
  - [ ] URL parameters update on selection
  - [ ] Sharing URL preserves state
  - [ ] Browser back/forward works
- [ ] Iframe synchronization
  - [ ] Clicking links in iframe updates dropdowns
  - [ ] Neuron name matches
  - [ ] Hemisphere matches
  - [ ] URL parameters update
- [ ] Cross-browser
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge

### Common Test Cases

**Test 1: Basic Navigation**
1. Select dataset and cell type
2. Click link in iframe to different cell type
3. Verify dropdown updates

**Test 2: Hemisphere Switching**
1. Select cell type with multiple hemispheres
2. Click hemisphere-specific link in iframe
3. Verify hemisphere dropdown updates

**Test 3: Cross-Dataset**
1. Set Viewer A to Dataset 1, Cell Type X
2. Set Viewer B to Dataset 2, Cell Type Y
3. Navigate in both iframes
4. Verify each updates independently

**Test 4: URL Sharing**
1. Set up a specific comparison
2. Copy URL from address bar
3. Open in new tab/window
4. Verify state is restored

## Deployment

### Static Hosting Options

neuDiff can be deployed to any static file hosting service:

- **GitHub Pages**: Free, easy setup
- **Netlify**: Free tier, continuous deployment
- **Vercel**: Free tier, automatic HTTPS
- **AWS S3**: Scalable, pay-per-use
- **Any web server**: Apache, Nginx, etc.

### GitHub Pages Deployment

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to repository Settings
   - Navigate to Pages section
   - Select branch (e.g., `main`)
   - Select folder (root or `/docs`)
   - Save

3. **Access at:**
   ```
   https://<username>.github.io/<repository>/
   ```

### CORS Considerations

If datasets are hosted on different domains:
- Ensure dataset servers send appropriate CORS headers
- GitHub Pages typically works by default
- For custom servers, configure:
  ```
  Access-Control-Allow-Origin: *
  ```

### Performance Optimization

- **Minification**: Not critical for this size, but possible
- **Caching**: Configure server cache headers
- **CDN**: Use CDN for faster global access
- **Compression**: Enable gzip/brotli compression

## Contributing

### Adding Features

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/new-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

### Bug Reports

Include:
- Browser and version
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)
- Dataset and cell type being viewed

### Code Review

Pull requests should:
- Follow existing code style
- Include comments for complex logic
- Not introduce external dependencies
- Work in all modern browsers
- Include test cases if applicable

## Advanced Topics

### Custom URL Parsing

If you need custom URL matching logic:

```javascript
function customUrlParser(url) {
  // Your custom logic here
  const match = url.match(/custom-pattern/);
  return {
    neuronName: match[1],
    hemisphere: match[2]
  };
}
```

### Multiple Iframe Sync

For more than two viewers:

```javascript
const viewers = [
  createViewer('viewerA'),
  createViewer('viewerB'),
  createViewer('viewerC')
];

// Message listener handles all viewers
window.addEventListener('message', (event) => {
  const sourceViewer = viewers.find(v => 
    v.elements.iframe?.contentWindow === event.source
  );
  if (sourceViewer) {
    updateDropdownsFromIframeUrl(sourceViewer, event.data.url);
  }
});
```

### Custom Dataset Formats

If your dataset uses a different format:

```javascript
async function loadCustomDataset(baseUrl) {
  const response = await fetch(`${baseUrl}/custom-data.json`);
  const data = await response.json();
  
  // Transform to neuDiff format
  return data.map(item => ({
    name: item.cellType,
    urls: {
      combined: item.page,
      left: item.leftPage,
      right: item.rightPage
    }
  }));
}
```

## Troubleshooting

### Debug Mode

Enable comprehensive logging:

```javascript
// In iframe
window.neuviewIframeBridge.setDebug(true);

// In parent
const DEBUG = true;
if (DEBUG) console.log('Debug message');
```

### Common Issues

**Issue: Dropdowns not updating**
- Check iframe-bridge.js is loaded in cell type pages
- Verify postMessage is being sent
- Check URL matching logic

**Issue: Cell types not loading**
- Verify neurons.json exists and is accessible
- Check CORS headers
- Verify JSON format

**Issue: Iframe blank**
- Check URL construction
- Verify cell type page exists
- Check browser console for errors

## License

neuDiff is licensed under the **GNU General Public License v3.0 (GPL-3.0)**.

---

**Last Updated:** 2025  
**Version:** 1.0  
**Maintainer:** Frank Loesche (https://github.com/floesche)  
**Repository:** neuDiff