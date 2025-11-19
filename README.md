# neuDiff

A (very simple) comparative visualization tool for exploring and comparing cell type pages from existing Cell Type Catalogues. This tool does not provide any new data, just basically shows two windows side-by-side.

## Overview

**neuDiff** is a static webpage that enables side-by-side comparison of cell types from neuroscience datasets. It provides an interactive interface for researchers to examine morphology, connectivity, and other properties of different cell types, either within the same dataset or across different datasets.

## Features

- **Side-by-Side Comparison**: View two cell type pages simultaneously in split-screen mode.
- **Cross-Dataset Compatibility**: Compare cell types from different Janelia Cell Type Catalogues.
- **Flexible Selection**: Compare different cell types within the same dataset, the same cell type across different datasets, or any combination thereof.
- **URL State Management**: Share specific comparisons via URL parameters.
- **Responsive Design**: Optimized for wide monitors. No fallback for smaller screens.

## Getting Started

### Prerequisites

This is a static web application that requires only a modern web browser. No build process or dependencies are needed.

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd neudiff
   ```

2. Serve the files using any static web server. For example:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js http-server
   npx http-server
   ```

3. Open your browser and navigate to `http://localhost:8000`

### Usage

1. Select a dataset from the **Dataset A** dropdown menu
2. Choose a cell type from the **Cell Type A** dropdown
3. Select a dataset from the **Dataset B** dropdown menu
4. Choose a cell type from the **Cell Type B** dropdown
5. The interactive visualizations will appear side-by-side

Click the **neuDiff** button in the top-left corner at any time to reset your selections and return to the welcome screen.

## Implementation

### Architecture

neuDiff is built as a lightweight, client-side web application with the following structure:

```
neudiff/
├── index.html          # Main HTML structure
├── scripts/
│   └── main.js        # Core application logic
├── styles/
│   ├── plume-all.css  # UI framework styles
│   └── main.css       # Custom styles
└── assets/
    └── images/        # Image assets
```

### Key Components

#### Dataset Registry

The application uses a dataset registry pattern to manage available datasets:

```javascript
datasetRegistry.add(
  "Dataset Name",
  "https://base-url-to-dataset/"
);
```

Default datasets include:
- [Male CNS](https://reiserlab.github.io/celltype-explorer-drosophila-male-cns)
- [Female Adult Fly Brain](https://reiserlab.github.io/celltype-explorer-drosophila-female-adult-fly-brain/)

#### Dynamic Content Loading

Cell type data is dynamically fetched from the respective dataset repositories. The application:
1. Parses JavaScript files from the source datasets to extract neuron type definitions
2. Builds an index of available cell types
3. Generates preview URLs for iframe embedding
4. Handles cross-origin resource loading

#### State Management

- URL parameters encode the current selection state
- Format: `?datasetA=<name>&celltypeA=<type>&datasetB=<name>&celltypeB=<type>`
- Enables sharing specific comparisons via URL

### Technologies Used

- **HTML5**: Semantic markup and structure
- **CSS3**: Styling with Plume CSS framework
- **Vanilla JavaScript**: No framework dependencies for maximum compatibility
- **Iframes**: For embedding cell type pages

## Adding New Datasets

To add a new dataset to neuDiff:

1. Register the dataset in `scripts/main.js`:
   ```javascript
   datasetRegistry.add(
     "Your Dataset Name",
     "https://url-to-your-dataset/"
   );
   ```

2. Ensure the dataset follows the Janelia Cell Type Catalogue structure with:
   - A `neuron_data.js` file containing cell type definitions
   - Individual cell type pages accessible via predictable URLs

## Authors

- Frank Loesche (https://github.com/loeschef) - Initial development and implementation

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0) - see below for details.

## Display Recommendations

neuDiff works best on wide monitors where both cell types can be viewed side-by-side. For smaller screens or tablets, consider opening different cell type pages in separate browser tabs for optimal viewing.
