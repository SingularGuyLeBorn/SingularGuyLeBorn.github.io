// script.js (终极调试版)

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Element Selectors & Global State ---
    const topNav = document.getElementById('top-nav');
    const fileBrowser = document.getElementById('file-browser');
    const contentViewer = document.getElementById('content-viewer');
    const welcomeMessage = document.getElementById('welcome-message');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const leftSidebar = document.getElementById('file-browser-container');
    const tocContainer = document.getElementById('toc-container');
    const tocList = document.getElementById('toc-list');

    let jsonData = null;
    let activeNodeContent = null;

    // --- 2. Initialization & Setup ---
    async function initialize() {
        try {
            const response = await fetch('structure.json');
            jsonData = await response.json();

            if (window.marked && window.markedKatex) {
                window.marked.use(window.markedKatex({ throwOnError: false }));
            }

            buildTopNav();
            setupEventListeners();
        } catch (error) {
            console.error("Initialization failed:", error);
        }
    }

    function setupEventListeners() {
        sidebarToggle.addEventListener('click', () => leftSidebar.classList.toggle('collapsed'));
        contentViewer.addEventListener('scroll', throttle(updateActiveToc, 150));
    }

    // --- 3. Tree Building Logic ---
    function buildTopNav() {
        const topLevelDirs = jsonData.children.filter(item => item.type === 'directory');
        topNav.innerHTML = '';
        topLevelDirs.forEach(dir => {
            const link = document.createElement('a');
            link.href = '#';
            link.textContent = dir.name;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelector('#top-nav a.active')?.classList.remove('active');
                link.classList.add('active');
                displayTree(dir);
            });
            topNav.appendChild(link);
        });
    }

    function displayTree(folderData) {
        fileBrowser.innerHTML = '';
        const rootUl = document.createElement('ul');
        rootUl.className = 'file-tree';
        buildTree(folderData.children, rootUl);
        fileBrowser.appendChild(rootUl);
    }

    function buildTree(children, parentElement) {
        const indexFileNames = new Set(
            children
                .filter(item => item.name.toLowerCase() === 'readme.md' || item.name.toLowerCase().endsWith('.md'))
                .map(item => item.name.toLowerCase())
        );

        children.forEach(item => {
            const folderNameForThisFile = item.name.replace(/\.md$/i, '').toLowerCase();
            if (indexFileNames.has(`${folderNameForThisFile}.md`) && children.some(c => c.type === 'directory' && c.name.toLowerCase() === folderNameForThisFile)) {
                 if (item.name.toLowerCase() !== 'readme.md') return;
            }

            const li = document.createElement('li');
            li.className = 'tree-node';
            const nodeContent = document.createElement('div');
            nodeContent.className = 'node-content';
            const nodeToggle = document.createElement('span');
            nodeToggle.className = 'node-toggle';
            const nodeIcon = document.createElement('span');
            nodeIcon.className = 'node-icon';
            const nodeLabel = document.createElement('span');
            nodeLabel.className = 'node-label';
            nodeLabel.textContent = item.name.replace(/\.md$/i, '');
            nodeContent.appendChild(nodeToggle);
            nodeContent.appendChild(nodeIcon);
            nodeContent.appendChild(nodeLabel);
            li.appendChild(nodeContent);

            if (item.type === 'directory') {
                nodeIcon.textContent = '📁';
                const hasChildren = item.children && item.children.length > 0;
                const indexFile = item.children?.find(child => child.name.toLowerCase() === 'readme.md' || child.name.toLowerCase() === `${item.name.toLowerCase()}.md`);

                if (indexFile) {
                    nodeContent.addEventListener('click', () => {
                        setActiveNode(nodeContent);
                        displayFileContent(indexFile);
                    });
                }

                if (hasChildren) {
                    nodeToggle.addEventListener('click', (e) => {
                        e.stopPropagation();
                        li.classList.toggle('expanded');
                    });
                    const childUl = document.createElement('ul');
                    li.appendChild(childUl);
                    buildTree(item.children, childUl);
                } else {
                    nodeToggle.classList.add('empty');
                }
            } else if (item.type === 'file' && item.name.toLowerCase().endsWith('.md')) {
                nodeIcon.textContent = '📄';
                nodeToggle.classList.add('empty');
                nodeContent.addEventListener('click', () => {
                    setActiveNode(nodeContent);
                    displayFileContent(item);
                });
            } else {
                return;
            }

            parentElement.appendChild(li);
        });
    }

    // --- 4. Content & TOC Handling ---
    async function displayFileContent(fileData) {
        welcomeMessage.style.display = 'none';
        contentViewer.innerHTML = '<p>加载中...</p>';
        tocList.innerHTML = '';

        try {
            const response = await fetch(fileData.path);
            const text = await response.text();

            const basePath = fileData.path.substring(0, fileData.path.lastIndexOf('/') + 1);
            const renderer = new window.marked.Renderer();

            // --- 终极调试：打印出所有收到的图片信息 ---
            renderer.image = (token) => {
                const href = token.href;
                const title = token.title;
                const text = token.text;
                let finalHref = href;

                // 深度日志
                console.log('--- IMAGE DEBUG ---');
                console.log('  Raw Markdown:', token.raw);
                console.log('  Received href:', href);
                console.log('  Type of href:', typeof href);

                if (typeof href === 'string') {
                    if (!href.startsWith('http') && !href.startsWith('data:')) {
                        finalHref = basePath + href;
                    }
                } else {
                    finalHref = ''; // 如果href不是字符串，给一个空路径防止崩溃
                    console.warn('  WARNING: href is not a string! Defaulting to empty src.');
                }

                console.log('  Final computed src:', finalHref);
                console.log('-------------------');

                return `<img src="${finalHref}" alt="${text || ''}" title="${title || ''}">`;
            };

            renderer.heading = (token) => {
                const text = token.text;
                const level = token.depth;
                if (typeof text !== 'string') return `<h${level}></h${level}>`;
                const id = generateHeaderId_JS(text);
                return `<h${level} id="${id}">${text}</h${level}>`;
            };

            contentViewer.innerHTML = window.marked.parse(text, { renderer });
            buildToc(fileData.headers);

        } catch (error) {
            contentViewer.innerHTML = `<div class="welcome-message"><h2>加载内容出错</h2><p>${error.message}</p></div>`;
        }
    }

    function buildToc(headers) {
        if (!headers || headers.length === 0) {
            tocContainer.style.display = 'none';
            return;
        }
        tocContainer.style.display = 'block';
        const tocUl = document.createElement('ul');
        headers.forEach(header => {
            const id = generateHeaderId_JS(header.text);
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${id}`;
            a.textContent = header.text;
            a.className = `toc-level-${header.level}`;
            a.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
            });
            li.appendChild(a);
tocUl.appendChild(li);
        });
        tocList.appendChild(tocUl);
        updateActiveToc();
    }

    function updateActiveToc() {
        const headers = Array.from(contentViewer.querySelectorAll('h1, h2, h3, h4'));
        if (headers.length === 0) return;
        let activeId = null;
        for (let i = headers.length - 1; i >= 0; i--) {
            if (headers[i].getBoundingClientRect().top <= 100) {
                activeId = headers[i].id;
                break;
            }
        }
        document.querySelectorAll('#toc-list a.active').forEach(a => a.classList.remove('active'));
        if (activeId) {
            document.querySelector(`#toc-list a[href="#${activeId}"]`)?.classList.add('active');
        }
    }

    // --- 5. Helper Functions ---
    function generateHeaderId_JS(text) {
        if (typeof text !== 'string') return '';
        return text.trim().toLowerCase().replace(/[\s\W_]+/g, '-').replace(/^-+|-+$/g, '');
    }

    function setActiveNode(element) {
        if (activeNodeContent) {
            activeNodeContent.classList.remove('active');
        }
        activeNodeContent = element;
        activeNodeContent.classList.add('active');
    }

    function throttle(func, limit) {
        let inThrottle;
        return function() {
            if (!inThrottle) {
                func.apply(this, arguments);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    // --- 6. Run Application ---
    initialize();
});