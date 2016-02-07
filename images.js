var fs = require('fs'),
    pathlib = require('path')
    multicb = require('multicb'),
    PNG = require('png-coder').PNG,
    JPEG = require('jpeg-js');

module.exports.loadAll = function (path, cb) {
    var base = pathlib.basename(path)
    fs.readdir(path, (err, names) => {
	if (err) return cb(err)
	var paths = names.map(name => pathlib.join(base, name))
	module.exports.load(paths, cb)
    })
}

module.exports.load = function (paths, cb) {
    var done = multicb({ pluck: 1 })
    ;(Array.isArray(paths) ? paths : [paths]).forEach(p => {
	if (/png$/.test(p)) {
	    console.log('loading', p)
	    var cb2 = done()	    
	    fs.createReadStream(p)
		.pipe(new PNG({ filterType: -1 }))
		.on('parsed', () => cb2(null, this))
	} else if (/.jpe?g$/.test(p)) {
	    console.log('loading', p)
	    var cb2 = done()	    
	    fs.readFile(p, function (err, buf) {
		if (err) return cb2(err)
		cb2(null, JPEG.decode(buf))
	    })
	}
    })
    done(cb)
}

module.exports.draw = function (matrix, img, opts) {
    for (var y=0; y < opts.to.height; y++) {
	for (var x=0; x < opts.to.width; x++) {
	    var pixel = sample(img, x+opts.from.x, y+opts.from.y, opts.pixelSize)
	    matrix.setPixel(y, opts.to.height-x, pixel.r, pixel.g, pixel.b)
	}
    }
}

var sample =
module.exports.sample = function (img, x, y, size) {
    x *= size
    y *= size
    var s = (size / 2)|0
    var pixels = []
    for (var i = (y-s); i <= (y+s); i++) {
	if (i < 0 || i >= img.height) continue
	for (var j = (x-s); j <= (x+s); j++) {
	    if (j < 0 || j >= img.width) continue
	    pixels.push(getPixel(img, i, j))
	}
    }

    var avg = pixels.reduce((v, acc) => {
	return { r: v.r+acc.r, g: v.g+acc.g, b: v.b+acc.b }
    }, { r: 0, g: 0, b: 0 })
    avg.r = (avg.r / pixels.length)|0
    avg.g = (avg.g / pixels.length)|0
    avg.b = (avg.b / pixels.length)|0
    return avg
}

var getPixel =
module.exports.getPixel = function (img, x, y) {
    var i = (img.width * y + x) * 4
    var alpha = 1 //(img.data[i+3]/255)||1 DISABLED
    return { r: (img.data[i]*alpha)|0, g: (img.data[i+1]*alpha)|0, b: (img.data[i+2]*alpha)|0 }
}

//	    to: { x: loX(), y: loY(), width: hiX(), height: hiY() },
//	    from: { x: loX(), y: loY(), width: hiX(), height: hiY() },
//	    pixelSize: 1
