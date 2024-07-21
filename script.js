document.getElementById('repoForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const repoUrl = document.getElementById('repoUrl').value;
    const repoParts = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!repoParts) {
        alert('Invalid GitHub repository URL');
        return;
    }

    const owner = repoParts[1];
    const repo = repoParts[2];

    try {
        const { scriptsContent, fileTree } = await fetchAllScripts(owner, repo);
        const combinedContent = `/*\nFile Tree:\n\n${fileTree}\n*/\n\n${scriptsContent.join('\n\n')}`;
        downloadFile(combinedContent, 'combined_scripts.txt');
    } catch (error) {
        console.error('Error fetching scripts:', error);
        alert('Failed to fetch scripts from the repository.');
    }
});

async function fetchAllScripts(owner, repo, path = '') {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents${path ? '/' + path : ''}`;
    let files = await fetch(apiUrl).then(res => res.json());
    
    let scriptsContent = [];
    let fileTree = '';
    
    for (let file of files) {
        fileTree += `${' '.repeat(path.split('/').length * 2)}- ${file.name}\n`;
        
        if (file.type === 'file' && (file.name.endsWith('.js') || file.name.endsWith('.html') || file.name.endsWith('.css'))) {
            let content = await fetch(file.download_url).then(res => res.text());
            scriptsContent.push(`/* ${file.path} */\n\n${content}`);
        } else if (file.type === 'dir') {
            let { scriptsContent: dirScripts, fileTree: dirTree } = await fetchAllScripts(owner, repo, file.path);
            scriptsContent = scriptsContent.concat(dirScripts);
            fileTree += dirTree;
        }
    }
    
    return { scriptsContent, fileTree };
}

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.getElementById('downloadLink');
    link.href = url;
    link.download = filename;
    link.style.display = 'block';
    link.textContent = `Download ${filename}`;
}
