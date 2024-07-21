const GITHUB_TOKEN = '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';

document.getElementById('repoForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const repoUrl = document.getElementById('repoUrl').value;
    const branchName = document.getElementById('branchName').value;
    const repoParts = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!repoParts) {
        alert('Invalid GitHub repository URL');
        return;
    }

    const owner = repoParts[1];
    const repo = repoParts[2];
    
    document.getElementById('loading').style.display = 'block';
    document.getElementById('downloadLink').style.display = 'none';

    try {
        console.log(`Fetching scripts from repo: ${owner}/${repo} on branch: ${branchName}`);
        const { scriptsContent, fileTree } = await fetchAllScripts(owner, repo, branchName);
        const combinedContent = `/*\nFile Tree:\n\n${fileTree}\n*/\n\n${scriptsContent.join('\n\n')}`;
        const filename = `${repo}-${branchName}-combined_scripts.txt`;
        downloadFile(combinedContent, filename);
    } catch (error) {
        console.error('Error fetching scripts:', error);
        alert('Failed to fetch scripts from the repository.');
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
});

async function fetchAllScripts(owner, repo, branch, path = '') {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents${path ? '/' + path : ''}?ref=${branch}`;
    console.log(`Fetching from URL: ${apiUrl}`);
    
    let response = await fetch(apiUrl, {
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`
        }
    });

    if (!response.ok) {
        console.error('Failed to fetch contents:', response.statusText);
        throw new Error(`Failed to fetch contents from ${apiUrl}`);
    }

    let files = await response.json();
    
    let scriptsContent = [];
    let fileTree = '';
    
    for (let file of files) {
        fileTree += `${' '.repeat(path.split('/').length * 2)}- ${file.name}\n`;
        
        if (file.type === 'file' && (file.name.endsWith('.js') || file.name.endsWith('.html') || file.name.endsWith('.css'))) {
            let content = await fetchFileContent(file.url);
            scriptsContent.push(`/* ${file.path} */\n\n${content}`);
        } else if (file.type === 'dir') {
            let { scriptsContent: dirScripts, fileTree: dirTree } = await fetchAllScripts(owner, repo, branch, file.path);
            scriptsContent = scriptsContent.concat(dirScripts);
            fileTree += dirTree;
        }
    }
    
    return { scriptsContent, fileTree };
}

async function fetchFileContent(url) {
    const response = await fetch(url, {
        headers: { 
            'Accept': 'application/vnd.github.v3.raw',
            'Authorization': `token ${GITHUB_TOKEN}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch file content from ${url}`);
    }

    const content = await response.text();
    return content;
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
