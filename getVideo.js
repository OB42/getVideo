const parsonic = require("parsonic");
const Nightmare = require("nightmare");
const request = require("request");
const url = require("url");
const fs = require("fs");
/*Most sites using Flash or Mediastream will send a regular video file
if we're sending a mobile user-agent*/
var userAgent = "Mozilla/5.0 (Linux; Android 4.0.4; Galaxy Nexus Build/IMM76B) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.133 Mobile Safari/535.19";
var notFound = "Sorry, we couldn't find any video.";
var nightmareOptions = {
	show: false,
	webPreferences: {
		images: false,
		webaudio: false,
		plugins: false
	}
};
module.exports = (videoUrl, callback) => {
	var headless = require("./headless.json");
	var parsedUrl = url.parse(videoUrl);
	if (typeof headless[parsedUrl.host] === "undefined") {
		firstParsing(parsedUrl, (err, headlessOnly, video) => {
			if (err) {
				callback(err);
			} else if (isFileUrl(video)) {
				callback(null, video);
				headless[parsedUrl.host] = headlessOnly;
				fs.writeFileSync(__dirname + "/headless.json", JSON.stringify(headless));
			} else {
				callback(notFound);
			}
		});
	} else if (headless[parsedUrl.host]) {
		headlessParsing(parsedUrl.href, callback);
	} else {
		parsing(parsedUrl.href, callback);
	}
};

function getVideo() {
	var videos = document.querySelectorAll("video, video > source");
	for (var v = 0; v < videos.length; v++) {
		if (videos[v].src.length) {
			return videos[v].src;
		}
	}
	return null;
}

function isFileUrl(u) {
	var protocol = url.parse(u).protocol;
	return protocol !== "blob:" && protocol !== "mediasource:";
}

function headlessParsing(videoUrl, callback) {
	Nightmare(nightmareOptions)
		.useragent(userAgent)
		.goto(videoUrl)
		.evaluate(getVideo)
		.end()
		.then(function(video) {
			callback(video && isFileUrl(video) ? null : notFound, video);
		})
		.catch(callback);
}

function parsing(videoUrl, callback) {
	request({
		"url": videoUrl,
		"User-Agent": userAgent
	}, (err, res, html) => {
		if (err) {
			callback(err);
		} else {
			parsonic.load(html, {}, getVideo, (results) => {
				if (isFileUrl(video)) {
					callback(results.error || null, results.error ? null : results);
				} else {
					callback(notFound);
				}
			});
		}
	});
}

function firstParsing(parsedUrl, callback) {
	var filename = __dirname + "/tmp/" + encodeURIComponent(parsedUrl.href) + ".html";
	Nightmare(nightmareOptions)
		.useragent(userAgent)
		.goto(parsedUrl.href)
		.html(filename, "HTMLOnly")
		.evaluate(getVideo)
		.end()
		.then(function(video) {
			fs.readFile(filename, (err, html) => {
				try {
					if (err) {
						throw err;
					}
					parsonic.load(html, {}, getVideo, (results) => {
						if (results) {
							if (results.error) {
								throw results.error;
							}
							callback(null, false, results);
						} else if (video) {
							callback(null, true, video);
						} else {
							throw notFound;
						}
					});
				} catch (err) {
					callback(err);
				}
				fs.unlinkSync(filename);
			});
		})
		.catch(callback);
}
