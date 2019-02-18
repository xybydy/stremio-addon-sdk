const express = require('express')
const landingTemplate = require('./landingTemplate')
const getRouter = require('./getRouter')

function serveHTTP(addonInterface, opts = {}) {
	if (addonInterface.constructor.name !== 'AddonInterface') {
		throw new Error('first argument must be an instance of AddonInterface')
	}
	const app = express()
	app.use((_, res, next) => {
		if (opts.cache) res.setHeader('cache-control', 'max-age='+opts.cache)
		next()
	})
	app.use(getRouter(addonInterface))

	// landing page
	const landingHTML = landingTemplate(addonInterface.manifest)
	app.get('/', (_, res) => {
		res.setHeader('content-type', 'text/html')
		res.end(landingHTML)
	})

	const server = app.listen(opts.port)
	return new Promise(function(resolve, reject) {
		server.on('listening', function() {
			const url = `http://127.0.0.1:${server.address().port}/manifest.json`
			console.log('HTTP addon accessible at:', url)
			if (process.argv.includes('--launch')) {
				const base = 'https://staging.strem.io#/addons/community/all'
				//const base = 'https://app.strem.io/shell-v4.4#/addons/community/all'
				//const base = 'https://app.strem.io/shell-v4.4#/discover/'
				const installUrl = `${base}?addon=${encodeURIComponent(url)}`
				// @TODO better launcher
				require('child_process').exec(`chromium --incognito "${installUrl}"`)
			}
			resolve({ url, server })
		})
		server.on('error', reject)
	})
}

module.exports = serveHTTP
