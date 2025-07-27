# create.py (回归纯粹版, 无需任何额外安装)

import os
import json
import re

# --- 配置区 ---
ROOT_DIR = 'my_notes'
OUTPUT_FILE = 'structure.json'
IGNORE_LIST = ['.git', '.gitignore', '.DS_Store', '__pycache__', '.vscode', 'node_modules']

def parse_markdown_headers(filepath):
    """
    解析单个Markdown文件，只提取最原始的标题级别和文本。
    ID生成的工作将由前端JavaScript完成。
    """
    headers = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip().startswith('#'):
                    # 找到第一个空格，确定标题级别
                    level = line.find(' ')
                    # 提取标题的纯文本
                    text = line.strip()[level:].strip()
                    # 确保是有效的标题行
                    if level > 0 and text:
                        headers.append({
                            'level': level,
                            'text': text,
                            # 注意：我们不再在Python中生成ID
                        })
    except Exception as e:
        print(f"  [Warning] Could not parse headers from {filepath}: {e}")
    return headers

def create_directory_structure(path):
    """
    递归地扫描指定路径，并将其转换为一个字典结构。
    """
    if os.path.basename(path) in IGNORE_LIST:
        return None

    item = {
        'name': os.path.basename(path),
        'path': path.replace('\\', '/')
    }

    if os.path.isdir(path):
        item['type'] = 'directory'
        children = []
        for name in os.listdir(path):
            child_path = os.path.join(path, name)
            child_item = create_directory_structure(child_path)
            if child_item:
                children.append(child_item)
        item['children'] = sorted(children, key=lambda x: (x['type'] != 'directory', x['name']))
    else:
        item['type'] = 'file'
        if item['name'].lower().endswith('.md'):
            item['headers'] = parse_markdown_headers(path)

    return item

def main():
    print("--- Starting Pure Structure Scan (No external dependencies) ---")
    if not os.path.isdir(ROOT_DIR):
        print(f"Error: Directory '{ROOT_DIR}' not found.")
        return

    print(f"Target: '{ROOT_DIR}' | Ignoring: {IGNORE_LIST}")
    structure = create_directory_structure(ROOT_DIR)

    if not structure:
        print("Error: Root directory is empty or ignored.")
        return

    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(structure, f, ensure_ascii=False, indent=2)
        print(f"\n--- Success ---")
        print(f"Directory structure saved to '{OUTPUT_FILE}'. Please reload your webpage.")
    except Exception as e:
        print(f"\nAn error occurred: {e}")

if __name__ == '__main__':
    main()