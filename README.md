# bunny-pack

A browser extension to improve the RabbitMQ web interface a little.

## Features

- MessagePack message decoding
- Easy "Copy message" button
- JSON message pretty formatting
- Dark mode

## Install

### Firefox

- Download the [latest](https://github.com/nbr23/bunny-pack/releases/latest) release's `.xpi` file
- Add it to Firefox (Go to `about:addons`, then `Install Add-On From File...`)
- Once installed, you may need to activate it for specific domains:
  - Browse to your RabbitMQ web interface
  - Hit the `Extensions` puzzle icon in your tool bar
  - Click BunnyPack's setting, and `Always Allow on ...`

### Chrome

- Download the [latest](https://github.com/nbr23/bunny-pack/releases/latest) release's `*-chrome.zip` file
- Extract the zip file to a folder on your computer
- Open Chrome and navigate to `chrome://extensions/`
- Enable "Developer mode" by toggling the switch in the top-right corner
- Click the "Load unpacked" button
- Select the folder where you extracted the extension files

## Configuration

After installation, you can access the extension settings to enable/disable dark mode:

- **Firefox**: Click the extension icon or go to `about:addons` and click Options for BunnyPack
- **Chrome**: Click the extension icon or right-click and select "Options"

## Building from Source

If you prefer to build the extension yourself:

```bash
# Build for both browsers
make all

# Clean build artifacts
make clean
```

The built extensions will be in `./web-ext-artifacts/`
