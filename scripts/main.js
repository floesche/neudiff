const datasetRegistry = (() => {
  const datasets = [];

  function add(name, base_url) {
    if (!name || !base_url) {
      throw new Error("Both name and base_url are required to add a dataset.");
    }

    const index = datasets.findIndex((dataset) => dataset.name === name);
    const entry = { name, base_url };

    if (index >= 0) {
      datasets[index] = entry;
    } else {
      datasets.push(entry);
    }

    return entry;
  }

  function all() {
    return [...datasets];
  }

  function get(name) {
    return datasets.find((dataset) => dataset.name === name);
  }

  return { add, all, get };
})();

window.opticDatasetRegistry = datasetRegistry;

// Seed with a default dataset entry; feel free to replace or add more elsewhere.
datasetRegistry.add(
  "Male CNS",
  "https://reiserlab.github.io/celltype-explorer-drosophila-male-cns/",
);
datasetRegistry.add(
  "Female Adult Fly Brain",
  "https://reiserlab.github.io/celltype-explorer-drosophila-female-adult-fly-brain/",
);

document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});

// Viewer initialization code
(() => {
  const viewerConfigs = [{ prefix: "viewerA" }, { prefix: "viewerB" }];

  const datasetCache = new Map();
  const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

  // URL parameter handling
  let isRestoringFromURL = false;

  const updateURL = () => {
    // Don't update URL if we're currently restoring from URL parameters
    if (isRestoringFromURL) return;

    const params = new URLSearchParams();

    viewerConfigs.forEach((config) => {
      const datasetSelect = document.getElementById(
        `${config.prefix}-dataset-select`,
      );
      const neuronSelect = document.getElementById(
        `${config.prefix}-neuron-select`,
      );
      const hemisphereSelect = document.getElementById(
        `${config.prefix}-hemisphere-select`,
      );

      if (datasetSelect && datasetSelect.value) {
        const datasetName = datasetSelect.selectedOptions[0]?.textContent;
        if (datasetName) {
          params.set(
            `dataset-${config.prefix.replace("viewer", "").toLowerCase()}`,
            datasetName,
          );
        }
      }

      if (neuronSelect && neuronSelect.value) {
        const cellTypeName = neuronSelect.selectedOptions[0]?.textContent;
        if (cellTypeName) {
          params.set(
            `celltype-${config.prefix.replace("viewer", "").toLowerCase()}`,
            cellTypeName,
          );
        }
      }

      if (hemisphereSelect && hemisphereSelect.value) {
        params.set(
          `hemisphere-${config.prefix.replace("viewer", "").toLowerCase()}`,
          hemisphereSelect.value,
        );
      }
    });

    const newURL = params.toString() ? `?${params.toString()}` : "index.html";
    window.history.replaceState({}, "", newURL);
  };

  const getURLParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      datasetA: params.get("dataset-a"),
      celltypeA: params.get("celltype-a"),
      hemisphereA: params.get("hemisphere-a"),
      datasetB: params.get("dataset-b"),
      celltypeB: params.get("celltype-b"),
      hemisphereB: params.get("hemisphere-b"),
    };
  };

  const fetchDatasetData = (rawBaseUrl) => {
    const normalizedBase = (rawBaseUrl || "").replace(/\/+$/, "");
    if (!normalizedBase) {
      return Promise.reject(new Error("Dataset is missing a valid base_url."));
    }

    if (datasetCache.has(normalizedBase)) {
      return datasetCache.get(normalizedBase);
    }

    const loadPromise = (async () => {
      const resourceUrl = `${normalizedBase}/data/neurons.json`;
      const response = await fetch(resourceUrl, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(
          `Failed to fetch neurons.json (HTTP ${response.status}).`,
        );
      }

      const data = await response.json();

      if (!Array.isArray(data.names)) {
        throw new Error("neurons.json did not contain a valid names array.");
      }

      return {
        baseUrl: normalizedBase,
        neuronTypes: data.names,
        neuronData: Array.isArray(data.neurons) ? data.neurons : [],
      };
    })().catch((error) => {
      datasetCache.delete(normalizedBase);
      throw error;
    });

    datasetCache.set(normalizedBase, loadPromise);
    return loadPromise;
  };

  const normalizeKey = (value) =>
    typeof value === "string" || typeof value === "number"
      ? value.toString().trim().toLowerCase()
      : "";

  const buildNeuronIndex = (records) => {
    const index = new Map();
    if (!Array.isArray(records)) return index;
    records.forEach((record) => {
      if (record && typeof record === "object" && record.name) {
        const key = normalizeKey(record.name);
        if (key && !index.has(key)) {
          index.set(key, record);
        }
      }
    });
    return index;
  };

  const getPrimaryPath = (entry, hemisphere = "combined") => {
    if (!entry || typeof entry !== "object" || !entry.urls) return "";

    // Check for urls dictionary
    if (typeof entry.urls === "object") {
      const path = entry.urls[hemisphere];
      if (typeof path === "string" && path.trim()) {
        return `/types/${path.trim()}`;
      }
      // Fallback to combined if requested hemisphere doesn't exist
      if (hemisphere !== "combined" && entry.urls.combined) {
        return `/types/${entry.urls.combined.trim()}`;
      }
    }

    return "";
  };

  const getAvailableHemispheres = (entry) => {
    if (!entry || typeof entry !== "object" || !entry.urls) {
      return [];
    }
    if (typeof entry.urls === "object") {
      return Object.keys(entry.urls).filter(
        (key) => typeof entry.urls[key] === "string" && entry.urls[key].trim(),
      );
    }
    return [];
  };

  const buildPreviewUrl = (baseUrl, primaryPath) => {
    const cleanedPath = (primaryPath || "").trim();
    if (ABSOLUTE_URL_PATTERN.test(cleanedPath)) {
      return cleanedPath;
    }
    const normalizedBase = (baseUrl || "").replace(/\/+$/, "");
    const sanitizedPath = cleanedPath.replace(/^\//, "");
    if (!sanitizedPath) {
      return normalizedBase || "about:blank";
    }
    return `${normalizedBase}/${sanitizedPath}`;
  };

  const initViewer = (config, datasets) => {
    const datasetSelect = document.getElementById(
      `${config.prefix}-dataset-select`,
    );
    const neuronSelect = document.getElementById(
      `${config.prefix}-neuron-select`,
    );
    const hemisphereSelect = document.getElementById(
      `${config.prefix}-hemisphere-select`,
    );
    const frame = document.getElementById(`${config.prefix}-frame`);
    const previewPane = document.getElementById(`${config.prefix}-preview`);

    if (
      !datasetSelect ||
      !neuronSelect ||
      !hemisphereSelect ||
      !frame ||
      !previewPane
    ) {
      return;
    }

    const state = {
      baseUrl: "",
      neuronEntries: [],
      neuronData: [],
      neuronIndex: new Map(),
      currentNeuronRecord: null,
    };

    let currentLoadToken = 0;

    const welcomeScreen = document.getElementById("welcome-screen");

    // Get neuron select wrapper for loading spinner
    const neuronSelectWrapper = neuronSelect.closest(".selector");

    // Helper functions for loading state
    const setLoadingState = (isLoading) => {
      // Disable all dropdowns
      const allSelects = document.querySelectorAll(".viewer-controls select");
      allSelects.forEach((select) => {
        select.disabled = isLoading;
      });

      // Show/hide spinner on neuron select
      if (neuronSelectWrapper) {
        if (isLoading) {
          neuronSelectWrapper.classList.add("is-loading");
        } else {
          neuronSelectWrapper.classList.remove("is-loading");
        }
      }
    };

    const hidePreviewPane = () => {
      frame.src = "about:blank";
      previewPane.classList.add("is-hidden");
    };

    const showPreviewPane = () => {
      previewPane.classList.remove("is-hidden");
      if (welcomeScreen) {
        welcomeScreen.classList.add("is-hidden");
      }
    };

    const showWelcomeScreen = () => {
      if (welcomeScreen) {
        welcomeScreen.classList.remove("is-hidden");
      }
    };

    const checkIfBothViewersEmpty = () => {
      const viewerAHidden = document
        .getElementById("viewerA-preview")
        ?.classList.contains("is-hidden");
      const viewerBHidden = document
        .getElementById("viewerB-preview")
        ?.classList.contains("is-hidden");
      if (viewerAHidden && viewerBHidden) {
        showWelcomeScreen();
      }
    };

    const resetNeuronSelect = () => {
      neuronSelect.innerHTML = "";
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Choose cell type";
      option.disabled = true;
      option.selected = true;
      neuronSelect.appendChild(option);
      neuronSelect.disabled = true;
      state.neuronEntries = [];
      state.neuronData = [];
      state.neuronIndex = new Map();
      state.currentNeuronRecord = null;
      resetHemisphereSelect();
      hidePreviewPane();
      checkIfBothViewersEmpty();
    };

    const resetHemisphereSelect = () => {
      hemisphereSelect.innerHTML = "";
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Choose hemisphere";
      option.disabled = true;
      option.selected = true;
      hemisphereSelect.appendChild(option);
      hemisphereSelect.disabled = true;
    };

    const populateHemisphereOptions = (neuronRecord) => {
      hemisphereSelect.innerHTML = "";
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Choose hemisphere";
      defaultOption.disabled = true;
      hemisphereSelect.appendChild(defaultOption);

      const hemispheres = getAvailableHemispheres(neuronRecord);

      if (hemispheres.length === 0) {
        hemisphereSelect.disabled = true;
        return;
      }

      hemispheres.forEach((hemisphere) => {
        const option = document.createElement("option");
        option.value = hemisphere;
        option.textContent =
          hemisphere.charAt(0).toUpperCase() + hemisphere.slice(1);
        hemisphereSelect.appendChild(option);
      });

      // Auto-select "combined" if available, otherwise select first option
      if (hemispheres.includes("combined")) {
        hemisphereSelect.value = "combined";
      } else if (hemispheres.length > 0) {
        hemisphereSelect.value = hemispheres[0];
      }

      hemisphereSelect.disabled = false;
    };

    const populateNeuronOptions = () => {
      neuronSelect.innerHTML = "";
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Choose cell type";
      defaultOption.disabled = true;
      defaultOption.selected = true;
      neuronSelect.appendChild(defaultOption);

      state.neuronEntries.forEach((entry) => {
        const option = document.createElement("option");
        // Entries are strings (names from the names array)
        option.textContent = entry;
        option.value = normalizeKey(entry);
        neuronSelect.appendChild(option);
      });

      neuronSelect.disabled = !state.neuronEntries.length;
    };

    const populateDatasetOptions = () => {
      datasetSelect.innerHTML = "";
      if (!datasets.length) {
        const emptyOption = document.createElement("option");
        emptyOption.value = "";
        emptyOption.textContent = "No datasets configured";
        emptyOption.disabled = true;
        emptyOption.selected = true;
        datasetSelect.appendChild(emptyOption);
        datasetSelect.disabled = true;
        resetNeuronSelect();
        hidePreviewPane();
        checkIfBothViewersEmpty();
        return;
      }

      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Choose dataset";
      placeholder.disabled = true;
      placeholder.selected = true;
      datasetSelect.appendChild(placeholder);

      datasets.forEach((dataset, index) => {
        if (!dataset || typeof dataset.base_url !== "string") return;
        const option = document.createElement("option");
        option.value = dataset.base_url.replace(/\/+$/, "");
        option.textContent = dataset.name || `Dataset ${index + 1}`;
        datasetSelect.appendChild(option);
      });

      datasetSelect.disabled = false;
    };

    const restoreFromURLParams = () => {
      const urlParams = getURLParams();
      const paramPrefix = config.prefix === "viewerA" ? "A" : "B";
      const datasetToRestore = urlParams[`dataset${paramPrefix}`];
      const cellTypeToRestore = urlParams[`celltype${paramPrefix}`];
      const hemisphereToRestore = urlParams[`hemisphere${paramPrefix}`];

      if (datasetToRestore && datasetSelect) {
        isRestoringFromURL = true;

        // Find and select the matching dataset
        const options = Array.from(datasetSelect.options);
        const matchingOption = options.find(
          (opt) => opt.textContent === datasetToRestore,
        );
        if (matchingOption) {
          datasetSelect.value = matchingOption.value;

          // Manually trigger dataset loading
          const selectedBase = matchingOption.value.trim();
          const loadToken = ++currentLoadToken;

          // Enable loading state
          setLoadingState(true);

          fetchDatasetData(selectedBase)
            .then((data) => {
              if (loadToken !== currentLoadToken) return;
              state.baseUrl = data.baseUrl;
              state.neuronEntries = Array.isArray(data.neuronTypes)
                ? data.neuronTypes
                : [];
              state.neuronData = Array.isArray(data.neuronData)
                ? data.neuronData
                : [];
              state.neuronIndex = buildNeuronIndex(state.neuronData);
              populateNeuronOptions();

              // Now restore the cell type if specified
              if (cellTypeToRestore && neuronSelect) {
                const neuronOptions = Array.from(neuronSelect.options);
                const matchingNeuron = neuronOptions.find(
                  (opt) => opt.textContent === cellTypeToRestore,
                );
                if (matchingNeuron) {
                  neuronSelect.value = matchingNeuron.value;

                  // Manually trigger the neuron selection
                  const selectionKey = normalizeKey(matchingNeuron.value);
                  const record = selectionKey
                    ? state.neuronIndex.get(selectionKey)
                    : null;

                  if (record) {
                    state.currentNeuronRecord = record;
                    populateHemisphereOptions(record);

                    // Restore hemisphere if specified, otherwise use the auto-selected one
                    if (hemisphereToRestore && hemisphereSelect) {
                      const hemisphereOptions = Array.from(
                        hemisphereSelect.options,
                      );
                      const matchingHemisphere = hemisphereOptions.find(
                        (opt) => opt.value === hemisphereToRestore,
                      );
                      if (matchingHemisphere) {
                        hemisphereSelect.value = hemisphereToRestore;
                      }
                    }

                    const selectedHemisphere =
                      hemisphereSelect.value || "combined";
                    const primaryPath = getPrimaryPath(
                      record,
                      selectedHemisphere,
                    );
                    if (primaryPath) {
                      showPreviewPane();
                      frame.src = buildPreviewUrl(state.baseUrl, primaryPath);
                    }
                  }
                }
              }

              isRestoringFromURL = false;
              updateURL();

              // Disable loading state after DOM updates complete
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  setLoadingState(false);
                });
              });
            })
            .catch((error) => {
              console.error(error);
              isRestoringFromURL = false;
              updateURL();

              // Disable loading state after DOM updates complete
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  setLoadingState(false);
                });
              });
            });
        } else {
          isRestoringFromURL = false;
        }
      }
    };

    datasetSelect.addEventListener("change", (event) => {
      const selectedBase = (event.target.value || "").trim();
      currentLoadToken += 1;

      hidePreviewPane();

      if (!selectedBase) {
        resetNeuronSelect();
        checkIfBothViewersEmpty();
        updateURL();
        return;
      }

      resetNeuronSelect();

      const loadToken = currentLoadToken;

      // Enable loading state
      setLoadingState(true);

      fetchDatasetData(selectedBase)
        .then((data) => {
          if (loadToken !== currentLoadToken) return;
          state.baseUrl = data.baseUrl;
          state.neuronEntries = Array.isArray(data.neuronTypes)
            ? data.neuronTypes
            : [];
          state.neuronData = Array.isArray(data.neuronData)
            ? data.neuronData
            : [];
          state.neuronIndex = buildNeuronIndex(state.neuronData);
          populateNeuronOptions();
          updateURL();

          // Disable loading state after DOM updates complete
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setLoadingState(false);
            });
          });
        })
        .catch((error) => {
          console.error(error);
          if (loadToken !== currentLoadToken) return;
          state.baseUrl = "";
          state.neuronEntries = [];
          state.neuronData = [];
          state.neuronIndex = new Map();
          resetNeuronSelect();
          hidePreviewPane();
          checkIfBothViewersEmpty();
          updateURL();

          // Disable loading state after DOM updates complete
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setLoadingState(false);
            });
          });
        });
    });

    neuronSelect.addEventListener("change", () => {
      const selection = neuronSelect.value;
      if (!selection || !state.baseUrl) {
        resetHemisphereSelect();
        hidePreviewPane();
        checkIfBothViewersEmpty();
        updateURL();
        return;
      }

      const selectionKey = normalizeKey(selection);
      const record = selectionKey ? state.neuronIndex.get(selectionKey) : null;

      if (!record) {
        resetHemisphereSelect();
        hidePreviewPane();
        checkIfBothViewersEmpty();
        updateURL();
        return;
      }

      state.currentNeuronRecord = record;
      populateHemisphereOptions(record);

      // Auto-select combined (or first available) and load it
      const selectedHemisphere = hemisphereSelect.value || "combined";
      const primaryPath = getPrimaryPath(record, selectedHemisphere);
      if (!primaryPath) {
        hidePreviewPane();
        checkIfBothViewersEmpty();
        updateURL();
        return;
      }

      showPreviewPane();
      frame.src = buildPreviewUrl(state.baseUrl, primaryPath);
      updateURL();
    });

    hemisphereSelect.addEventListener("change", () => {
      const hemisphere = hemisphereSelect.value;
      if (!hemisphere || !state.currentNeuronRecord || !state.baseUrl) {
        hidePreviewPane();
        checkIfBothViewersEmpty();
        updateURL();
        return;
      }

      const primaryPath = getPrimaryPath(state.currentNeuronRecord, hemisphere);
      if (!primaryPath) {
        hidePreviewPane();
        checkIfBothViewersEmpty();
        updateURL();
        return;
      }

      showPreviewPane();
      frame.src = buildPreviewUrl(state.baseUrl, primaryPath);
      updateURL();
    });

    resetNeuronSelect();
    populateDatasetOptions();

    // Return viewer info for URL restoration
    return {
      datasetSelect,
      neuronSelect,
      hemisphereSelect,
      config,
      state,
      restoreFromURLParams,
    };
  };

  document.addEventListener("DOMContentLoaded", () => {
    const registry = window.opticDatasetRegistry;
    const datasets = Array.isArray(registry?.all?.()) ? registry.all() : [];

    const viewers = viewerConfigs.map((config) => initViewer(config, datasets));

    // Track last processed URLs for each viewer to prevent duplicate updates
    const lastProcessedUrls = new Map();

    // Debug flag - set to true to enable detailed logging
    const DEBUG_DROPDOWN_SYNC = false;

    // Helper function to update dropdowns based on iframe URL changes
    function updateDropdownsFromIframeUrl(viewerIndex, newUrl) {
      // Validate viewer index
      if (viewerIndex < 0 || viewerIndex >= viewers.length) {
        console.error("Invalid viewer index:", viewerIndex);
        return;
      }

      // Prevent duplicate processing of the same URL for the same viewer
      const lastUrl = lastProcessedUrls.get(viewerIndex);
      if (lastUrl === newUrl) {
        return;
      }
      lastProcessedUrls.set(viewerIndex, newUrl);

      const viewer = viewers[viewerIndex];
      if (
        !viewer ||
        !viewer.state ||
        !viewer.state.neuronData ||
        !viewer.state.baseUrl
      ) {
        return;
      }

      // Log which viewer is being updated (for debugging)
      if (DEBUG_DROPDOWN_SYNC) {
        console.log(
          `Updating dropdowns for ${viewer.config.prefix} with URL:`,
          newUrl,
        );
      }

      // Ensure we're only working with this specific viewer's DOM elements
      const viewerPrefix = viewer.config.prefix;
      const viewerDatasetSelect = document.getElementById(
        `${viewerPrefix}-dataset-select`,
      );
      const viewerNeuronSelect = document.getElementById(
        `${viewerPrefix}-neuron-select`,
      );
      const viewerHemisphereSelect = document.getElementById(
        `${viewerPrefix}-hemisphere-select`,
      );

      // Verify these match the viewer's stored references
      if (
        viewer.datasetSelect !== viewerDatasetSelect ||
        viewer.neuronSelect !== viewerNeuronSelect ||
        viewer.hemisphereSelect !== viewerHemisphereSelect
      ) {
        console.error(
          "Viewer element mismatch detected for viewer index",
          viewerIndex,
        );
        return;
      }

      // Match the URL against known URLs in neurons.json
      // Don't parse - instead search through all neuron records
      let matchedRecord = null;
      let matchedHemisphere = null;

      // Try to match the URL against each neuron's URLs
      for (const neuronRecord of viewer.state.neuronData) {
        if (!neuronRecord || !neuronRecord.urls) continue;

        // Check each hemisphere variant
        for (const [hemisphere, relativeUrl] of Object.entries(
          neuronRecord.urls,
        )) {
          if (!relativeUrl) continue;

          // Build the full URL that would match
          const fullUrl = buildPreviewUrl(
            viewer.state.baseUrl,
            `/types/${relativeUrl}`,
          );

          // Compare URLs (normalize by removing trailing slashes and fragments)
          const normalizedNewUrl = newUrl.split("#")[0].replace(/\/+$/, "");
          const normalizedFullUrl = fullUrl.split("#")[0].replace(/\/+$/, "");

          if (normalizedNewUrl === normalizedFullUrl) {
            matchedRecord = neuronRecord;
            matchedHemisphere = hemisphere;
            break;
          }
        }

        if (matchedRecord) break;
      }

      if (!matchedRecord) {
        // Clear cell type and hemisphere dropdowns when navigating to non-cell-type pages
        // Use the verified viewer-specific elements
        if (viewerNeuronSelect && viewerNeuronSelect.value) {
          // Temporarily disable change events
          const originalNeuronOnChange = viewerNeuronSelect.onchange;
          const originalHemisphereOnChange = viewerHemisphereSelect
            ? viewerHemisphereSelect.onchange
            : null;

          viewerNeuronSelect.onchange = null;
          if (viewerHemisphereSelect) viewerHemisphereSelect.onchange = null;

          // Clear selections
          viewerNeuronSelect.value = "";
          if (viewerHemisphereSelect) {
            viewerHemisphereSelect.value = "";
            viewerHemisphereSelect.disabled = true;
          }

          // Clear current record
          viewer.state.currentNeuronRecord = null;

          // Restore change handlers
          viewerNeuronSelect.onchange = originalNeuronOnChange;
          if (viewerHemisphereSelect)
            viewerHemisphereSelect.onchange = originalHemisphereOnChange;

          // Update URL to remove cell type and hemisphere parameters
          updateURL();
        }

        return; // URL not found in current dataset
      }

      const record = matchedRecord;
      const hemisphere = matchedHemisphere;
      const normalizedCellType = normalizeKey(record.name);

      // Update the neuron select dropdown if it's different
      // Use the verified viewer-specific elements
      if (
        viewerNeuronSelect &&
        viewerNeuronSelect.value !== normalizedCellType
      ) {
        // Temporarily disable change event to prevent loops
        const originalNeuronOnChange = viewerNeuronSelect.onchange;
        viewerNeuronSelect.onchange = null;

        viewerNeuronSelect.value = normalizedCellType;
        viewer.state.currentNeuronRecord = record;

        // Restore the change handler
        viewerNeuronSelect.onchange = originalNeuronOnChange;

        // Update hemisphere options based on the new neuron
        if (viewerHemisphereSelect) {
          // Get available hemispheres for this cell type
          const availableHemispheres = getAvailableHemispheres(record);

          // Temporarily disable change event
          const originalHemisphereOnChange = viewerHemisphereSelect.onchange;
          viewerHemisphereSelect.onchange = null;

          // Clear and repopulate hemisphere select
          viewerHemisphereSelect.innerHTML = "";
          const defaultOption = document.createElement("option");
          defaultOption.value = "";
          defaultOption.textContent = "Choose hemisphere";
          viewerHemisphereSelect.appendChild(defaultOption);

          availableHemispheres.forEach((hem) => {
            const option = document.createElement("option");
            option.value = hem;
            option.textContent = hem.charAt(0).toUpperCase() + hem.slice(1);
            viewerHemisphereSelect.appendChild(option);
          });

          viewerHemisphereSelect.disabled = availableHemispheres.length === 0;

          // Set the hemisphere value after options are populated
          if (availableHemispheres.includes(hemisphere)) {
            viewerHemisphereSelect.value = hemisphere;
          } else if (availableHemispheres.includes("combined")) {
            viewerHemisphereSelect.value = "combined";
          }

          // Restore the change handler
          viewerHemisphereSelect.onchange = originalHemisphereOnChange;
        }
      } else if (
        viewerHemisphereSelect &&
        viewerHemisphereSelect.value !== hemisphere
      ) {
        // Only update hemisphere if neuron didn't change
        const availableHemispheres = getAvailableHemispheres(record);

        if (availableHemispheres.includes(hemisphere)) {
          // Temporarily disable change event to prevent loops
          const originalOnChange = viewerHemisphereSelect.onchange;
          viewerHemisphereSelect.onchange = null;

          viewerHemisphereSelect.value = hemisphere;

          // Restore the change handler
          viewerHemisphereSelect.onchange = originalOnChange;
        }
      }

      // Update the URL parameters to reflect the change
      updateURL();
    }

    // Initialize NeuviewIframeController for each viewer
    const iframeControllers = viewerConfigs.map((config, index) => {
      const frame = document.getElementById(`${config.prefix}-frame`);
      if (!frame) return null;

      // Capture index in closure to ensure correct viewer is updated
      const viewerIndex = index;
      const viewerPrefix = config.prefix;

      return new NeuviewIframeController(frame, {
        onUrlChanged: function (data) {
          // Update dropdowns when iframe URL changes
          if (
            data.currentUrl &&
            data.currentUrl !== "about:blank" &&
            !data.currentUrl.startsWith("about:")
          ) {
            if (DEBUG_DROPDOWN_SYNC) {
              console.log(
                `${viewerPrefix} iframe URL changed to:`,
                data.currentUrl,
              );
            }
            updateDropdownsFromIframeUrl(viewerIndex, data.currentUrl);
          }
        },
        onNavigationRequest: function (data) {
          // Also update on navigation requests for faster response
          if (
            data.url &&
            data.url !== "about:blank" &&
            !data.url.startsWith("about:")
          ) {
            if (DEBUG_DROPDOWN_SYNC) {
              console.log(`${viewerPrefix} navigation request to:`, data.url);
            }
            updateDropdownsFromIframeUrl(viewerIndex, data.url);
          }
        },
        debug: false,
      });
    });

    // Add immediate src monitoring for instant feedback (hybrid approach)
    // This catches src changes before the iframe sends messages back
    viewerConfigs.forEach((config, index) => {
      const frame = document.getElementById(`${config.prefix}-frame`);
      if (!frame) return;

      // Capture index and prefix in closure to ensure correct viewer is updated
      const viewerIndex = index;
      const viewerPrefix = config.prefix;
      let lastSrc = frame.src;
      let debounceTimer = null;

      // Monitor src attribute changes with MutationObserver for instant updates
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "src"
          ) {
            const newSrc = frame.src;
            if (
              newSrc !== lastSrc &&
              newSrc !== "about:blank" &&
              !newSrc.startsWith("about:")
            ) {
              lastSrc = newSrc;
              if (DEBUG_DROPDOWN_SYNC) {
                console.log(
                  `${viewerPrefix} src attribute changed to:`,
                  newSrc,
                );
              }

              // Debounce to prevent multiple rapid calls
              if (debounceTimer) {
                clearTimeout(debounceTimer);
              }
              debounceTimer = setTimeout(() => {
                updateDropdownsFromIframeUrl(viewerIndex, newSrc);
              }, 50);
            }
          }
        });
      });

      observer.observe(frame, {
        attributes: true,
        attributeFilter: ["src"],
      });
    });

    // Restore state from URL parameters
    const urlParams = getURLParams();

    // Check if we have any URL parameters to restore
    const hasParams = urlParams.datasetA || urlParams.datasetB;

    if (hasParams) {
      // Wait for datasets to be populated, then restore
      setTimeout(() => {
        viewers.forEach((viewer) => {
          if (!viewer) return;
          viewer.restoreFromURLParams();
        });
      }, 100);
    }

    // Add reset functionality to neuDiff button
    const neuDiffButton = document.querySelector('a[href="index.html"]');
    if (neuDiffButton) {
      neuDiffButton.addEventListener("click", (event) => {
        event.preventDefault();

        // Reset all dataset and neuron selectors
        viewerConfigs.forEach((config) => {
          const datasetSelect = document.getElementById(
            `${config.prefix}-dataset-select`,
          );
          const neuronSelect = document.getElementById(
            `${config.prefix}-neuron-select`,
          );

          if (datasetSelect) {
            datasetSelect.value = "";
          }
          if (neuronSelect) {
            neuronSelect.value = "";
            neuronSelect.disabled = true;
          }

          // Hide preview panes
          const previewPane = document.getElementById(
            `${config.prefix}-preview`,
          );
          const frame = document.getElementById(`${config.prefix}-frame`);
          if (previewPane) {
            previewPane.classList.add("is-hidden");
          }
          if (frame) {
            frame.src = "about:blank";
          }
        });

        // Show welcome screen
        const welcomeScreen = document.getElementById("welcome-screen");
        if (welcomeScreen) {
          welcomeScreen.classList.remove("is-hidden");
        }

        // Clear URL parameters
        window.history.replaceState({}, "", "index.html");
      });
    }

    // Navigation line functionality
    const navLine = document.getElementById("nav-line");
    const navCircles = document.querySelectorAll(".nav-circle");

    // Function to check if both viewers are visible
    function updateNavLineVisibility() {
      const viewerAVisible = !document
        .getElementById("viewerA-preview")
        .classList.contains("is-hidden");
      const viewerBVisible = !document
        .getElementById("viewerB-preview")
        .classList.contains("is-hidden");

      if (viewerAVisible && viewerBVisible) {
        navLine.classList.remove("is-hidden");
      } else {
        navLine.classList.add("is-hidden");
      }
    }

    // Add click handlers to navigation circles
    navCircles.forEach((circle) => {
      circle.addEventListener("click", () => {
        const anchor = circle.getAttribute("data-anchor");

        // Navigate both iframes to the anchor
        iframeControllers.forEach((controller) => {
          if (controller && controller.isPageReady()) {
            controller.jumpToAnchor(anchor);
          }
        });
      });
    });

    // Monitor visibility changes to show/hide nav line
    const paneObserver = new MutationObserver(() => {
      updateNavLineVisibility();
    });

    const viewerAPane = document.getElementById("viewerA-preview");
    const viewerBPane = document.getElementById("viewerB-preview");

    if (viewerAPane && viewerBPane) {
      paneObserver.observe(viewerAPane, {
        attributes: true,
        attributeFilter: ["class"],
      });
      paneObserver.observe(viewerBPane, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }

    // Initial visibility check
    updateNavLineVisibility();
  });
})();
