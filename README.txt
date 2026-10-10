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

Cloudflare deployment (Workers static assets, connected to this GitHub repo):
- The whole repo root is uploaded as the site. .assetsignore keeps .git, .claude and README.txt
  out of the deployment; add anything else that should not be public to it.
- Security headers (CSP, HSTS, etc.) live in _headers, which Cloudflare applies but does not serve.
  If you add a new external script, API or image host, add it to the Content-Security-Policy there.
- In Cloudflare: SSL/TLS > Edge Certificates > Always Use HTTPS = On.
- After deploying, check that /.git/config returns 404.
