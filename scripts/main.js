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
