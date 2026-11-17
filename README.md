# PeakLoop by AT Media: source code of our Postiz changes

This repository is the source code offer for the social media scheduler that **AT Media Global**
runs for its own brands and for its customers. The scheduler is **Postiz** (https://github.com/gitroomhq/postiz-app),
version **v2.25.3**, © the Postiz authors, licensed under the **GNU Affero General Public License v3.0** (see `LICENSE`).

## What we change

We change only what users see: the product name, logos, favicon, accent colours and legal links.
We do not change how Postiz works. The full list of changes is the patch script.

| File | Content |
|---|---|
| `deploy/postiz/whitelabel.mjs` | The patch. It runs on the unchanged Postiz source of version v2.25.3. |
| `deploy/postiz/Dockerfile` | Downloads Postiz v2.25.3, applies the patch, builds the image. |
| `branding/` | Logo, icon and favicon files. |
| `LICENSE` | The AGPL-3.0 license of Postiz. |

## Build the same image

```bash
docker build -f deploy/postiz/Dockerfile -t postiz-branded:v2.25.3 .
```

Build arguments: `BRAND_NAME`, `BRAND_TAGLINE`, `SOURCE_URL`, `TERMS_URL`, `PRIVACY_URL`, `POSTIZ_VERSION`.
An installation for a customer uses the same patch with that customer's name, logo files and legal links.

## License

Postiz is licensed under AGPL-3.0. Our patch files in this repository are also licensed under AGPL-3.0.

Contact: AT Media Global, Kottayam, Kerala, India. https://atmediaglobal.com
