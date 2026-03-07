import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * MarkdownPipe - Converts simple markdown to sanitized HTML
 * 
 * Supports:
 * - **bold text** → <strong>bold text</strong>
 * - \n\n (double newlines) → <br><br>
 * - \n (single newlines) → <br>
 * - Bullet points with - or • → <ul><li>
 * 
 * Sanitizes output to prevent XSS attacks
 */
@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) {
      return '';
    }

    let html = value;

    // Convert **bold** to <strong>
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Convert bullet points (- or •) to list items
    // Match lines starting with - or • followed by space
    const lines = html.split('\n');
    let inList = false;
    const processedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isBullet = /^[\-•]\s+(.+)/.test(line.trim());

      if (isBullet) {
        const content = line.trim().replace(/^[\-•]\s+/, '');
        if (!inList) {
          processedLines.push('<ul>');
          inList = true;
        }
        processedLines.push(`<li>${content}</li>`);
      } else {
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }
        processedLines.push(line);
      }
    }

    // Close list if still open
    if (inList) {
      processedLines.push('</ul>');
    }

    html = processedLines.join('\n');

    // Convert double newlines to <br><br>
    html = html.replace(/\n\n/g, '<br><br>');

    // Convert single newlines to <br>
    html = html.replace(/\n/g, '<br>');

    // Sanitize to prevent XSS
    return this.sanitizer.sanitize(1, html) || '';
  }
}
