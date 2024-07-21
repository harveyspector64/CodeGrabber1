document.getElementById('zipForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const fileInput = document.getElementById('zipFile');
    if (fileInput.files.length === 0) {
        alert('Please upload a ZIP file.');
        return;
    }

    const zipFile = fileInput.files[0];
    document.getElementById('loading').style.display = 'block';
    document.getElementById('downloadLink').style.display = 'none';

    try {
        const zip = await JSZip.loadAsync(zipFile);
        let scriptsContent = [];
        let fileTree = '';

        for (let fileName in zip.files) {
            const file = zip.files[fileName];
            fileTree += `- ${fileName}\n`;

            if (!file.dir && (fileName.endsWith('.js') || fileName.endsWith('.html') || fileName.endsWith('.css'))) {
                const content = await file.async('text');
                scriptsContent.push(`/* ${fileName} */\n\n${content}`);
            }
        }

        const combinedContent = `/*\nFile Tree:\n\n${fileTree}\n*/\n\n${scriptsContent.join('\n\n')}`;
        downloadFile(combinedContent, 'combined_scripts.txt');
    } catch (error) {
        console.error('Error processing ZIP file:', error);
        alert('Failed to process ZIP file.');
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
});

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.getElementById('downloadLink');
    link.href = url;
    link.download = filename;
    link.style.display = 'block';
    link.textContent = `Download ${filename}`;
}
