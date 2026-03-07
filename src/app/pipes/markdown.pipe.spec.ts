import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { MarkdownPipe } from './markdown.pipe';

describe('MarkdownPipe', () => {
  let pipe: MarkdownPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    sanitizer = TestBed.inject(DomSanitizer);
    pipe = new MarkdownPipe(sanitizer);
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should convert **bold** to <strong>', () => {
    const input = 'This is **bold text** in a sentence.';
    const result = pipe.transform(input);
    expect(result).toContain('<strong>bold text</strong>');
  });

  it('should convert multiple bold sections', () => {
    const input = '**First bold** and **second bold**';
    const result = pipe.transform(input);
    expect(result).toContain('<strong>First bold</strong>');
    expect(result).toContain('<strong>second bold</strong>');
  });

  it('should convert single newlines to <br>', () => {
    const input = 'Line one\nLine two';
    const result = pipe.transform(input);
    expect(result).toContain('<br>');
  });

  it('should convert double newlines to <br><br>', () => {
    const input = 'Paragraph one\n\nParagraph two';
    const result = pipe.transform(input);
    expect(result).toContain('<br><br>');
  });

  it('should convert bullet points with - to list items', () => {
    const input = '- First item\n- Second item\n- Third item';
    const result = pipe.transform(input);
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>First item</li>');
    expect(result).toContain('<li>Second item</li>');
    expect(result).toContain('<li>Third item</li>');
    expect(result).toContain('</ul>');
  });

  it('should convert bullet points with • to list items', () => {
    const input = '• First item\n• Second item';
    const result = pipe.transform(input);
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>First item</li>');
    expect(result).toContain('<li>Second item</li>');
    expect(result).toContain('</ul>');
  });

  it('should handle mixed formatting', () => {
    const input = 'Here are **great options**:\n\n- **Rooftop bars**\n- Pet-friendly\n\nLet me know!';
    const result = pipe.transform(input);
    expect(result).toContain('<strong>great options</strong>');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li><strong>Rooftop bars</strong></li>');
    expect(result).toContain('<li>Pet-friendly</li>');
    expect(result).toContain('</ul>');
    expect(result).toContain('<br><br>');
  });

  it('should handle empty string', () => {
    const result = pipe.transform('');
    expect(result).toBe('');
  });

  it('should handle null/undefined', () => {
    const result = pipe.transform(null as any);
    expect(result).toBe('');
  });

  it('should sanitize potentially dangerous HTML', () => {
    const input = 'Safe text **bold** <script>alert("xss")</script>';
    const result = pipe.transform(input);
    // DomSanitizer should strip the script tag
    expect(result).not.toContain('<script>');
    expect(result).toContain('<strong>bold</strong>');
  });

  it('should handle text without any markdown', () => {
    const input = 'Just plain text without any formatting.';
    const result = pipe.transform(input);
    expect(result).toContain('Just plain text without any formatting.');
  });

  it('should close list properly when followed by regular text', () => {
    const input = '- Item one\n- Item two\nRegular text after list';
    const result = pipe.transform(input);
    expect(result).toContain('<ul>');
    expect(result).toContain('</ul>');
    expect(result).toContain('Regular text after list');
  });
});
