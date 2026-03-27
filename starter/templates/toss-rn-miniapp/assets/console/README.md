# Console Assets

Fill `asset-manifest.json` with real paths before release validation.

## Required Assets
- App logo: `600x600` PNG with solid background
- Square thumbnail: `1000x1000` PNG
- Landscape thumbnail: `1932x828` PNG
- Screenshots:
  - Portrait flow: at least 3 images sized `636x1048`
  - Landscape flow: at least 1 image sized `1504x741`

The release validator checks the manifest, file existence, and `.png` extensions in strict mode.
