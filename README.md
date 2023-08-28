# bunny-pack

Firefox add-on to automatically decode messagepack encoded messages on the rabbitmq management interface for easy debugging.

## Install

- Download the [latest](https://github.com/nbr23/bunny-pack/releases/download/v1.0.0/bunny-pack-1.0.0.xpi) release.
- Add it to Firefox (Go to `about:addons`, then `Install Add-On From File...`)
- Once installed, you may need to activate it for specific domains:
  - Browse to your RabbitMQ web interface
  - Hit the `Extensions` puzzle icon in your tool bar
  - Click BunnyPack's setting, and `Always Allow on ...`