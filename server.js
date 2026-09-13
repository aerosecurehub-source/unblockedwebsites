import express from 'express';
import axios from 'axios';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.static(path.join(__dirname, 'src')));

app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('URL parameter is required.');

    try {
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            responseType: 'text',
            validateStatus: (status) => status < 500
        });

        let content = response.data;
        const contentType = response.headers['content-type'] || '';

        if (typeof content === 'string' && contentType.includes('text/html')) {
            const parsedUrl = new URL(targetUrl);
            const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;

            // Inject scripts to intercept FETCH + XHR and keep requests pointing to localhost!
            content = content.replace(
                /<head>/i,
                `<head>
                <base href="${baseUrl}/">
                <script>
                    (function() {
                        const PROXY_SERVER = window.location.origin + '/proxy?url=';

                        // 1. Intercept window.fetch
                        const originalFetch = window.fetch;
                        window.fetch = function(resource, init) {
                            let target = typeof resource === 'string' ? resource : resource.url;
                            if (target && !target.startsWith(window.location.origin)) {
                                if (target.startsWith('/')) {
                                    target = '${baseUrl}' + target;
                                }
                                resource = PROXY_SERVER + encodeURIComponent(target);
                            }
                            return originalFetch(resource, init);
                        };

                        // 2. Intercept XMLHttpRequest (Fixes YouTube internal API & search!)
                        const originalOpen = XMLHttpRequest.prototype.open;
                        XMLHttpRequest.prototype.open = function(method, url, ...args) {
                            if (url && !url.startsWith(window.location.origin)) {
                                let fullUrl = url;
                                if (url.startsWith('/')) {
                                    fullUrl = '${baseUrl}' + url;
                                }
                                url = PROXY_SERVER + encodeURIComponent(fullUrl);
                            }
                            return originalOpen.call(this, method, url, ...args);
                        };
                    })();
                </script>`
            );
        }

        // Disable security headers blocking iframe/CORS execution
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.removeHeader('X-Frame-Options');
        res.removeHeader('Content-Security-Policy');

        if (contentType) res.setHeader('Content-Type', contentType);
        res.send(content);

    } catch (error) {
        console.error(`🚨 Proxy Error loading ${targetUrl}:`, error.message);
        res.status(500).send(`Proxy Error: ${error.message}`);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Proxy active at http://localhost:${PORT}`));
