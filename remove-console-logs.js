#!/usr/bin/env node

/**
 * Remove Console Logs Script
 * 
 * This script removes console.log statements from TypeScript/JavaScript files.
 * It preserves console.error for critical error logging.
 * 
 * Usage: node remove-console-logs.js
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');

// Patterns to remove
const PATTERNS_TO_REMOVE = [
  /console\.log\([^)]*\);?\s*/g,
  /console\.warn\([^)]*\);?\s*/g,
  /console\.debug\([^)]*\);?\s*/g,
  /\{console\.log\([^)]*\)\}/g, // JSX expressions
];

// Patterns to keep (critical errors)
const PATTERNS_TO_KEEP = [
  // Keep critical error logs in production services
  'console.error',
];

function shouldProcessFile(filePath) {
  return (
    (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) &&
    !filePath.includes('node_modules') &&
    !filePath.includes('.next') &&
    !filePath.endsWith('.d.ts')
  );
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Remove console.log, console.warn, console.debug
    PATTERNS_TO_REMOVE.forEach(pattern => {
      content = content.replace(pattern, '');
    });
    
    // Clean up empty lines (max 2 consecutive empty lines)
    content = content.replace(/\n\s*\n\s*\n\s*\n/g, '\n\n');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Cleaned: ${path.relative(SRC_DIR, filePath)}`);
      return 1;
    }
    
    return 0;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function walkDir(dir) {
  let filesProcessed = 0;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      filesProcessed += walkDir(filePath);
    } else if (shouldProcessFile(filePath)) {
      filesProcessed += processFile(filePath);
    }
  });
  
  return filesProcessed;
}

console.log('🧹 Removing console.log statements from source files...\n');

const filesProcessed = walkDir(SRC_DIR);

console.log(`\n✅ Done! Processed ${filesProcessed} file(s)`);
console.log('ℹ️  Note: console.error statements were preserved for error handling');
