const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;

// Allowed file extensions for security
const ALLOWED_EXTENSIONS = ['.html', '.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp'];
const ALLOWED_FILES = ['index.html'];

const server = http.createServer((req, res) => {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Serve index.html for root path
    let requestedPath = req.url === '/' ? '/index.html' : req.url;
    
    // Normalize and resolve path to prevent directory traversal
    const normalizedPath = path.normalize(requestedPath).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(__dirname, normalizedPath);
    
    // Security: Ensure file is within project directory
    const projectRoot = path.resolve(__dirname);
    if (!filePath.startsWith(projectRoot)) {
        res.writeHead(403, { 'Content-Type': 'text/html' });
        res.end('<h1>403 - Forbidden</h1>');
        return;
    }

    // Security: Check file extension
    const ext = path.extname(filePath).toLowerCase();
    if (requestedPath !== '/' && !ALLOWED_EXTENSIONS.includes(ext)) {
        res.writeHead(403, { 'Content-Type': 'text/html' });
        res.end('<h1>403 - Forbidden File Type</h1>');
        return;
    }

    // Security: Check if file exists and is readable
    fs.access(filePath, fs.constants.F_OK | fs.constants.R_OK, (err) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - File Not Found</h1>');
            return;
        }

        // Read and serve file
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 - Internal Server Error</h1>');
                return;
            }

            // Determine content type
            const contentTypes = {
                '.html': 'text/html; charset=utf-8',
                '.css': 'text/css; charset=utf-8',
                '.js': 'text/javascript; charset=utf-8',
                '.json': 'application/json; charset=utf-8',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml',
                '.ico': 'image/x-icon',
                '.webp': 'image/webp'
            };

            res.writeHead(200, { 
                'Content-Type': contentTypes[ext] || 'text/plain; charset=utf-8',
                'Cache-Control': 'public, max-age=3600'
            });
            res.end(data);
        });
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📄 Serving: ${__dirname}/index.html`);
});

