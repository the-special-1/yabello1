/**
 * API Endpoint Migration Script
 * 
 * This script automatically updates all API endpoint calls in your project to use the apiService utility.
 * It handles the differences between development and production environments.
 * 
 * Usage: 
 * 1. Run with Node.js: node update-api-endpoints.js
 * 2. The script will scan all JavaScript files in the client/src directory
 * 3. It will update fetch and axios calls to use the apiService utility
 */

const fs = require('fs');
const path = require('path');

// Directory to scan for JavaScript files
const sourceDir = path.join(__dirname, 'client', 'src');

// Patterns to match and replace
const patterns = [
  // Match fetch calls to /api endpoints
  {
    regex: /fetch\(['"]\/api\/([^'"]+)['"]/g,
    replacement: "apiService.get('$1'"
  },
  // Match fetch POST calls to /api endpoints
  {
    regex: /fetch\(['"]\/api\/([^'"]+)['"],\s*{\s*method:\s*['"]POST['"]/g,
    replacement: "apiService.post('$1', "
  },
  // Match fetch PUT calls to /api endpoints
  {
    regex: /fetch\(['"]\/api\/([^'"]+)['"],\s*{\s*method:\s*['"]PUT['"]/g,
    replacement: "apiService.put('$1', "
  },
  // Match fetch PATCH calls to /api endpoints
  {
    regex: /fetch\(['"]\/api\/([^'"]+)['"],\s*{\s*method:\s*['"]PATCH['"]/g,
    replacement: "apiService.patch('$1', "
  },
  // Match fetch DELETE calls to /api endpoints
  {
    regex: /fetch\(['"]\/api\/([^'"]+)['"],\s*{\s*method:\s*['"]DELETE['"]/g,
    replacement: "apiService.delete('$1'"
  },
  // Match axios get calls to /api endpoints
  {
    regex: /axios\.get\(['"]\/api\/([^'"]+)['"]/g,
    replacement: "apiService.get('$1'"
  },
  // Match axios post calls to /api endpoints
  {
    regex: /axios\.post\(['"]\/api\/([^'"]+)['"]/g,
    replacement: "apiService.post('$1'"
  },
  // Match axios put calls to /api endpoints
  {
    regex: /axios\.put\(['"]\/api\/([^'"]+)['"]/g,
    replacement: "apiService.put('$1'"
  },
  // Match axios patch calls to /api endpoints
  {
    regex: /axios\.patch\(['"]\/api\/([^'"]+)['"]/g,
    replacement: "apiService.patch('$1'"
  },
  // Match axios delete calls to /api endpoints
  {
    regex: /axios\.delete\(['"]\/api\/([^'"]+)['"]/g,
    replacement: "apiService.delete('$1'"
  }
];

// Import statement to add if apiService is used
const apiServiceImport = "import apiService from '../utils/apiService';";
const apiServiceImportRelative = (depth) => {
  const relativePath = '../'.repeat(depth) + 'utils/apiService';
  return `import apiService from '${relativePath}';`;
};

// Function to recursively scan directories for JavaScript files
function scanDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      // Skip node_modules directory
      if (file !== 'node_modules') {
        scanDirectory(filePath);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      processFile(filePath);
    }
  });
}

// Function to process a single file
function processFile(filePath) {
  console.log(`Processing ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let needsImport = false;
  
  // Apply each pattern
  patterns.forEach(pattern => {
    if (pattern.regex.test(content)) {
      content = content.replace(pattern.regex, pattern.replacement);
      modified = true;
      needsImport = true;
    }
  });
  
  // Add import statement if needed
  if (needsImport && !content.includes('apiService')) {
    // Calculate relative path depth
    const relativePath = path.relative(sourceDir, filePath);
    const depth = relativePath.split(path.sep).length - 1;
    
    // Add import at the top of the file, after other imports
    const importStatement = apiServiceImportRelative(depth);
    
    // Find a good place to insert the import
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, importStatement);
      content = lines.join('\n');
    } else {
      content = importStatement + '\n' + content;
    }
  }
  
  // Write changes back to file if modified
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

// Start the scanning process
console.log('Starting API endpoint migration...');
scanDirectory(sourceDir);
console.log('API endpoint migration complete!');
