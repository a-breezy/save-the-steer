const APP_PREFIX = "SaveTheSteer-";
const VERSION = "version_01";
const CACHE_NAME = APP_PREFIX + VERSION;

// select files to cache for offline browsing
const FILES_TO_CACHE = [
	"./index.html",
	"./css/styles.css",
	"./js/index.js",
	"./js/idb.js",
];

// install service worker to cache above files
self.addEventListener("install", function (e) {
	e.waitUntil(
		caches.open(CACHE_NAME).then(function (cache) {
			console.log("installing cache : " + CACHE_NAME);
			return cache.addAll(FILES_TO_CACHE);
		})
	);
});

// activate service worker
self.addEventListener("activate", function (e) {
	e.waituntil(
		caches.keys().then(function (keyList) {
			let cacheKeepList = keyList.filter(function (key) {
				return key.indexOf(APP_PREFIX);
			});
			cacheKeepList.push(CACHE_NAME);

			return Promise.all(
				keyList.map(function (key, i) {
					if (cacheKeepList.indexOf(key) === -1) {
						console.log("deleting cache : " + keyList[i]);
						return caches.delete(keyList[i]);
					}
				})
			);
		})
	);
});

// fetch from cache when offline
self.addEventListener("fetch", function (e) {
	console.log("fetch request : " + e.request.url);
	e.respondWith(
		caches.match(e.request).then(function (request) {
			if (request) {
				// if cache is available, respond with cache
				console.log("responding with cache : " + e.request.url);
				return request;
			} else {
				// if there are no cache, try fetching request
				console.log("file is not cached, fetching : " + e.request.url);
				return fetch(e.request);
			}

			// You can omit if/else for console.log & put one line below like this too.
			// return request || fetch(e.request)
		})
	);
});
