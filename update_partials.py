#!/usr/bin/env python3
import os
import re
import sys

def get_rel_depth(filepath, root_dir):
    rel_path = os.path.relpath(filepath, root_dir)
    # Normalize separators
    rel_path_norm = rel_path.replace("\\", "/")
    parts = rel_path_norm.split("/")
    depth = len(parts) - 1
    return depth

def extract_alternate_links(html):
    alternates = {}
    # Find all <link ...> tags in head
    head_match = re.search(r'<head>.*?</head>', html, re.DOTALL)
    if not head_match:
        # Fallback to searching the entire HTML if <head> tag is missing or malformed
        search_area = html
    else:
        search_area = head_match.group(0)

    link_tags = re.findall(r'<link\s+[^>]+>', search_area)
    for tag in link_tags:
        if 'rel="alternate"' in tag or "rel='alternate'" in tag:
            lang_match = re.search(r'hreflang=["\']([^"\']+)["\']', tag)
            href_match = re.search(r'href=["\']([^"\']+)["\']', tag)
            if lang_match and href_match:
                lang = lang_match.group(1).lower()
                href = href_match.group(1)
                alternates[lang] = href
    return alternates

def build_lang_switcher(alternates, current_lang, base_path):
    def get_href(lang, fallback_suffix):
        if lang in alternates:
            return alternates[lang]
        return f"{base_path}{fallback_suffix}"
    
    href_es = get_href('es', '')
    href_en = get_href('en', 'en/')
    href_zh = get_href('zh', 'zh/')
    href_ja = get_href('ja', 'ja/')
    
    options = []
    
    # ES
    active_es = "active" if current_lang == "es" else ""
    options.append(f'                        <a href="{href_es}" class="lang-option {active_es}"><span class="flag">🇪🇸</span> Español</a>')
    
    # EN
    active_en = "active" if current_lang == "en" else ""
    options.append(f'                        <a href="{href_en}" class="lang-option {active_en}"><span class="flag">🇺🇸</span> English</a>')
    
    # ZH
    active_zh = "active" if current_lang == "zh" else ""
    options.append(f'                        <a href="{href_zh}" class="lang-option {active_zh}"><span class="flag">🇨🇳</span> 简体中文</a>')
    
    # JA
    active_ja = "active" if current_lang == "ja" else ""
    options.append(f'                        <a href="{href_ja}" class="lang-option {active_ja}"><span class="flag">🇯🇵</span> 日本語</a>')
    
    return "\n".join(options)

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    partials_dir = os.path.join(root_dir, "partials")
    
    if not os.path.exists(partials_dir):
        print(f"Error: Directory 'partials/' not found at {partials_dir}")
        sys.exit(1)
        
    # Load templates
    templates = {}
    langs = ['es', 'en', 'ja', 'zh']
    for lang in langs:
        header_path = os.path.join(partials_dir, f"header_{lang}.html")
        footer_path = os.path.join(partials_dir, f"footer_{lang}.html")
        
        if not os.path.exists(header_path) or not os.path.exists(footer_path):
            print(f"Error: Templates for '{lang}' missing at {partials_dir}")
            sys.exit(1)
            
        with open(header_path, "r", encoding="utf-8") as f:
            header_tpl = f.read()
        with open(footer_path, "r", encoding="utf-8") as f:
            footer_tpl = f.read()
            
        templates[lang] = {
            'header': header_tpl,
            'footer': footer_tpl
        }
        
    # Compile regexes
    header_comment_pattern = re.compile(r'<!--\s*HEADER_START\s*-->.*?<!--\s*HEADER_END\s*-->', re.DOTALL)
    header_tag_pattern = re.compile(r'<header\s+class=["\']app-header["\'][^>]*>.*?</header>', re.DOTALL)
    
    footer_comment_pattern = re.compile(r'<!--\s*FOOTER_START\s*-->.*?<!--\s*FOOTER_END\s*-->', re.DOTALL)
    footer_tag_pattern = re.compile(r'<footer\s+class=["\']app-footer-bar["\'][^>]*>.*?</footer>', re.DOTALL)
    
    modified_count = 0
    total_count = 0
    
    # Walk directory
    for root, dirs, files in os.walk(root_dir):
        # Exclude directories
        dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', 'partials', '.well-known']]
        
        for file in files:
            if file == "index.html" or file == "404.html" or file.endswith(".html"):
                filepath = os.path.join(root, file)
                
                # Check if it is under a specific language folder
                rel_dir = os.path.relpath(root, root_dir).replace("\\", "/")
                parts = rel_dir.split("/")
                first_dir = parts[0] if parts and parts[0] != "." else ""
                
                if first_dir in ['en', 'ja', 'zh']:
                    lang = first_dir
                else:
                    lang = 'es'
                    
                total_count += 1
                
                with open(filepath, "r", encoding="utf-8") as f:
                    original_html = f.read()
                    
                # Calculate depth and base_path
                depth = get_rel_depth(filepath, root_dir)
                base_path = "../" * depth if depth > 0 else "./"
                
                # Extract alternate links
                alternates = extract_alternate_links(original_html)
                
                # Build templates for this file
                tpl_header = templates[lang]['header']
                tpl_footer = templates[lang]['footer']
                
                # Replace {{BASE_PATH}}
                tpl_header = tpl_header.replace("{{BASE_PATH}}", base_path)
                tpl_footer = tpl_footer.replace("{{BASE_PATH}}", base_path)
                
                # Build and inject language switcher options
                lang_switcher_html = build_lang_switcher(alternates, lang, base_path)
                tpl_header = tpl_header.replace("<!-- LANG_OPTIONS -->", lang_switcher_html)
                
                # Process header
                new_html = original_html
                header_block = f"<!-- HEADER_START -->\n{tpl_header}\n<!-- HEADER_END -->"
                if header_comment_pattern.search(new_html):
                    new_html = header_comment_pattern.sub(header_block, new_html)
                elif header_tag_pattern.search(new_html):
                    new_html = header_tag_pattern.sub(header_block, new_html)
                    
                # Process footer
                footer_block = f"<!-- FOOTER_START -->\n{tpl_footer}\n<!-- FOOTER_END -->"
                if footer_comment_pattern.search(new_html):
                    new_html = footer_comment_pattern.sub(footer_block, new_html)
                elif footer_tag_pattern.search(new_html):
                    new_html = footer_tag_pattern.sub(footer_block, new_html)
                    
                # Save if changed
                if new_html != original_html:
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(new_html)
                    modified_count += 1
                    print(f"Updated: {os.path.relpath(filepath, root_dir)}")
                    
    print(f"\nCompleted! Synchronized {modified_count} out of {total_count} HTML files.")

if __name__ == "__main__":
    main()
