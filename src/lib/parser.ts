import hljs from 'highlight.js';

export interface ContentBlock {
  id: string;
  type: 'text' | 'code';
  content: string;
  language?: string;
}

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Parses input text into a sequence of text and code blocks.
 * It handles explicit markdown code blocks and attempts to auto-detect
 * "naked" code blocks in plain text.
 */
export function parseContent(input: string): ContentBlock[] {
  if (!input.trim()) return [];

  const blocks: ContentBlock[] = [];
  
  // 1. Handle explicit markdown code blocks first
  // Regex to find ```language\ncode\n``` or just ```code```
  const mdCodeRegex = /```([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = mdCodeRegex.exec(input)) !== null) {
    // Process text before this code block
    const textBefore = input.substring(lastIndex, match.index);
    if (textBefore.trim()) {
      blocks.push(...processPotentialMixedText(textBefore));
    }

    const fullMatch = match[1];
    const lines = fullMatch.split('\n');
    let language = '';
    let code = fullMatch;

    // Check if the first line is a language identifier
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      // Simple heuristic: if first line is one word and doesn't look like code, it's a language
      if (firstLine && !firstLine.includes(' ') && !firstLine.includes('(') && !firstLine.includes('{')) {
        language = firstLine;
        code = lines.slice(1).join('\n');
      }
    }

    // Auto-detect if language is missing or verify it
    const detection = hljs.highlightAuto(code, language ? [language] : undefined);

    blocks.push({
      id: generateId(),
      type: 'code',
      content: code.trim(),
      language: detection.language || language || 'plaintext'
    });

    lastIndex = mdCodeRegex.lastIndex;
  }

  // Process remaining text after the last code block
  const remainingText = input.substring(lastIndex);
  if (remainingText.trim()) {
    blocks.push(...processPotentialMixedText(remainingText));
  }

  return blocks;
}

/**
 * Analyzes a block of text that might contain "naked" code (not in backticks).
 */
function processPotentialMixedText(text: string): ContentBlock[] {
  // Split by double newlines to separate paragraphs/sections
  const sections = text.split(/\n\s*\n/);
  const result: ContentBlock[] = [];

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    // Heuristics for "naked" code detection:
    // 1. Use highlight.js auto-detection
    // 2. Check for common code markers (braces, semicolons, keywords)
    // 3. Check relevance score
    
    const detection = hljs.highlightAuto(trimmed);
    
    // Code markers
    const hasBraces = (trimmed.match(/[{}]/g) || []).length >= 2;
    const hasSemicolons = (trimmed.match(/;/g) || []).length >= 2;
    const hasAssignment = (trimmed.match(/=/g) || []).length >= 1;
    const hasKeywords = /\b(function|const|let|var|class|import|export|if|for|while|return|def|fn|pub|struct|enum|interface|type|async|await)\b/.test(trimmed);
    
    // A block is likely code if it has high relevance OR strong structural markers
    const isLikelyCode = 
      (detection.relevance > 5 && (hasBraces || hasSemicolons || hasKeywords)) ||
      (detection.relevance > 10) ||
      (hasKeywords && hasBraces);

    if (isLikelyCode && trimmed.split('\n').length > 1) {
      result.push({
        id: generateId(),
        type: 'code',
        content: trimmed,
        language: detection.language || 'plaintext'
      });
    } else {
      result.push({
        id: generateId(),
        type: 'text',
        content: trimmed
      });
    }
  }

  return result;
}
