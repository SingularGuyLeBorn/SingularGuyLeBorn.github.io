// create.js (全新简化版, 无需额外依赖)

const fs = require('fs');
const path = require('path');

// --- 配置区 ---
// 你的笔记文件夹的名称
const ROOT_DIR = 'my_notes';
// 输出的JSON文件名
const OUTPUT_FILE = 'structure.json';
// 扫描时需要忽略的文件和文件夹列表
const IGNORE_LIST = ['.git', '.gitignore', '.DS_Store', '__pycache__', '.vscode', 'node_modules'];

/**
 * 解析单个Markdown文件，仅提取标题的层级(level)和原始文本(text)。
 * ID的生成将由前端JavaScript完成，以避免Python端的额外依赖。
 * @param {string} filepath - Markdown文件的完整路径。
 * @returns {Array<Object>} 标题对象的数组。
 */
function parseMarkdownHeaders(filepath) {
    const headers = [];
    try {
        const content = fs.readFileSync(filepath, 'utf8');
        const lines = content.split('\n');
        let inCodeBlock = false;

        for (const line of lines) {
            const strippedLine = line.trim();
            // 跟踪代码块的状态
            if (strippedLine.startsWith('```')) {
                inCodeBlock = !inCodeBlock;
            }

            // 确保我们处理的是标题行，并且不在代码块内
            if (!inCodeBlock && strippedLine.startsWith('#')) {
                // 查找第一个空格的索引，它代表了 # 的数量（即标题级别）
                const levelEndIndex = strippedLine.indexOf(' ');
                // 确保是有效的标题行（至少一个#和一个空格，且后面有文本）
                if (levelEndIndex > 0) {
                    const level = levelEndIndex; // '#' 的数量
                    const text = strippedLine.substring(levelEndIndex + 1).trim();
                    if (text) { // 确保标题文本不为空
                        headers.push({
                            level: level,
                            text: text
                        });
                    }
                }
            }
        }
    } catch (e) {
        // 如果文件无法解析，打印警告但继续执行
        console.warn(`  [Warning] Could not parse headers from ${filepath}: ${e.message}`);
    }
    return headers;
}

/**
 * 递归地扫描指定路径，并将其转换为一个字典结构。
 * @param {string} currentPath - 当前扫描的路径。
 * @returns {Object|null} 目录或文件的结构对象，如果被忽略则返回null。
 */
function createDirectoryStructure(currentPath) {
    const baseName = path.basename(currentPath);

    // 如果当前项在忽略列表中，则跳过
    if (IGNORE_LIST.includes(baseName)) {
        return null;
    }

    let stats;
    try {
        stats = fs.statSync(currentPath);
    } catch (e) {
        // 如果路径不存在或无法访问，则跳过
        console.warn(`  [Warning] Could not access ${currentPath}: ${e.message}`);
        return null;
    }

    // 构建基础信息对象
    const item = {
        name: baseName,
        path: currentPath.replace(/\\/g, '/') // 保证Web兼容性，将所有反斜杠替换为正斜杠
    };

    // 如果是文件夹，则递归处理子项
    if (stats.isDirectory()) {
        item.type = 'directory';
        const children = [];
        const entries = fs.readdirSync(currentPath); // 获取所有子项的名称

        for (const entryName of entries) {
            const childPath = path.join(currentPath, entryName);
            const childItem = createDirectoryStructure(childPath);
            if (childItem) {
                children.push(childItem);
            }
        }
        // 对子项进行排序：文件夹在前，文件在后；同类型内按名称排序
        item.children = children.sort((a, b) => {
            const isADirectory = a.type === 'directory';
            const isBDirectory = b.type === 'directory';

            // 优先排序目录
            if (isADirectory && !isBDirectory) {
                return -1; // a是目录，b是文件，a排在前面
            }
            if (!isADirectory && isBDirectory) {
                return 1; // a是文件，b是目录，b排在前面
            }
            // 如果类型相同，则按名称排序
            return a.name.localeCompare(b.name);
        });
    }
    // 如果是文件
    else {
        item.type = 'file';
        // 如果是Markdown文件，则解析其标题
        if (item.name.toLowerCase().endsWith('.md')) {
            item.headers = parseMarkdownHeaders(currentPath);
        }
    }

    return item;
}

/**
 * 主执行函数
 */
function main() {
    console.log("--- Starting Simplified Structure Scan (JS-Handled IDs) ---");

    // 检查根文件夹是否存在并且是一个目录
    if (!fs.existsSync(ROOT_DIR) || !fs.statSync(ROOT_DIR).isDirectory()) {
        console.error(`Error: Directory '${ROOT_DIR}' not found or is not a directory. Please ensure your notes folder is in the same directory and named correctly.`);
        return;
    }

    console.log(`Target: '${ROOT_DIR}' | Ignoring: ${IGNORE_LIST.join(', ')}`);

    // 生成文件结构
    const structure = createDirectoryStructure(ROOT_DIR);

    if (!structure) {
        console.error("Error: Root directory is empty or ignored.");
        return;
    }

    // 将结构写入JSON文件
    try {
        // JSON.stringify 的第三个参数 '2' 用于美化输出，使其可读性更高
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(structure, null, 2), 'utf8');
        console.log(`\n--- Success ---`);
        console.log(`Directory structure saved to '${OUTPUT_FILE}'. No Node.js dependencies were needed.`);
        console.log("You can now refresh your web page.");
    } catch (e) {
        console.error(`\nAn error occurred while writing to JSON file: ${e.message}`);
    }
}

// 当脚本被直接执行时运行main函数
if (require.main === module) {
    main();
}