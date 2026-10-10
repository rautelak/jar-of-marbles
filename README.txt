Jar of Marbles static site

Files:
- index.html
- about.html
- privacy.html
- terms.html
- styles.css

Before launch:
1. Replace every href="#" App Store link with the real App Store URL.
2. Review and customize privacy.html to match the app's actual data practices.
3. Review terms.html and consider legal review.
4. Add a real support/privacy contact method.
5. Deploy these files as a static site to Cloudflare Pages.

Cloudflare Pages build settings (so .git, .claude and README.txt are not published):
- Build command:          mkdir -p dist && cp -r *.html styles.css js images _headers dist/
- Build output directory: dist
- Add any new top-level site file or folder to the cp command above.
- Security headers (CSP, HSTS, etc.) live in _headers. If you add a new external script,
  API or image host, add it to the Content-Security-Policy there.
- In Cloudflare: SSL/TLS > Edge Certificates > Always Use HTTPS = On.
