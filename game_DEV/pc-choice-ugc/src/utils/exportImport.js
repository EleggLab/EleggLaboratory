// Export project as single JSON file with embedded assets
export const exportProject = (editorData, assets) => {
  const projectData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    meta: editorData.meta,
    globalStats: editorData.globalStats,
    flags: editorData.flags,
    nodes: editorData.nodes,
    edges: editorData.edges,
    assets: {
      characters: assets.characters,
      items: assets.items,
      backgrounds: assets.backgrounds,
    },
  };

  return projectData;
};

// Download JSON as file
export const downloadJSON = (data, filename) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'project.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Import project from JSON file
export const importProject = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        // Validate structure
        if (!data.nodes || !data.assets) {
          throw new Error('Invalid project file format');
        }

        resolve(data);
      } catch (error) {
        reject(new Error('Failed to parse project file: ' + error.message));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// Validate project data structure
export const validateProject = (data) => {
  const errors = [];

  if (!data.meta) {
    errors.push('Missing project metadata');
  }

  if (!Array.isArray(data.nodes)) {
    errors.push('Missing or invalid nodes array');
  }

  if (!Array.isArray(data.edges)) {
    errors.push('Missing or invalid edges array');
  }

  if (!data.assets) {
    errors.push('Missing assets');
  } else {
    if (!Array.isArray(data.assets.characters)) {
      errors.push('Missing or invalid characters array');
    }
    if (!Array.isArray(data.assets.items)) {
      errors.push('Missing or invalid items array');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
