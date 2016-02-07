var LedMatrix = require("node-rpi-rgb-led-matrix")
var imglib = require('./images')

// settings
const VIZ_TIME = 30e3
const DAMPENING = 0.1
const algs = [random, /*zigzag,*/ thematrix, imgsweep]

// dampening monkeypatch
var matrix = new LedMatrix(32)
var _setPixel = matrix.setPixel.bind(matrix)
matrix.setPixel = function(x,y,r,g,b) {
    _setPixel(x,y,r*DAMPENING, g*DAMPENING, b*DAMPENING)
}

// asets
var images = null
imglib.loadAll('/home/pi/Software/viz/images', (err, _images) => {
    if (err) throw err
    images = _images
    console.log('images loaded')
})

// helpers
const loX = () => 0
const loY = () => 0
const loR = () => 0
const loG = () => 0
const loB = () => 0
const hiX = () => 32
const hiY = () => 32
const hiR = () => 255
const hiG = () => 255
const hiB = () => 255
const randX = () => (Math.random()*hiX())|0
const randY = () => (Math.random()*hiY())|0
const randR = () => (Math.random()*hiR())|0
const randG = () => (Math.random()*hiG())|0
const randB = () => (Math.random()*hiB())|0

// main
var calg = 0
main()
function main() {
    var alg = algs[calg]
    var stop = alg()
    setTimeout(() => {
	stop()
	calg++
	if (calg >= algs.length)
	    calg = 0
	main()
    }, VIZ_TIME)
}


// algorithms

function imgsweep() {
    var img
    var x = 0, xDir=1
    var imageIndex = 0
    
    var i = setInterval(() => {
	if (!images) return // wait for images to load

	img = images[imageIndex]

	// ahh fuck it, it's easier to just resize prior with image magick
	/*var pixelSize = 1
	var from = { x: loX(), y: loY() }	
	if (img.width > img.height) {
	    // scale the pixel to stretch vertically
	    pixelSize = (img.height / hiY())|0	    
	    // then center it vertically
	    var scaledHeight = (hiY()-loY())*pixelSize
	    var overflow = img.height - scaledHeight
	    from.y = (overflow/2)|0

	} else {
	    // scale the pixel to stretch horizontally
   	    pixelSize = (img.width / hiX())|0
	    // then center it horizontally
	    var scaledWidth = (hiX()-loX())*pixelSize
	    var overflow = img.width - scaledWidth
	    from.x = (overflow/2)|0
	}*/

	// debug draw code
	/*imglib.draw(matrix, images[imageIndex], {
	    to: { x: loX(), y: loY(), width: hiX(), height: hiY() },
	    from: from,
	    pixelSize: pixelSize
	})*/
	
	imageIndex++
	if (imageIndex >= images.length)
	    imageIndex = 0
    }, 4e3)
    const render = () => {
	y = randY()
	var p = imglib.getPixel(img, x, y)
	matrix.setPixel(x, hiY()-y, p.r, p.g, p.b)
    }
    var j = setInterval(() => {
	if (!img) return // wait for images to load

	for (var n=0; n < 10; n++)
	    render()
	
	x += xDir
	if (x >= hiX())
	    xDir = -1
	if (x <= loX())
	    xDir = 1
    }, 10)
    
    return () => {clearInterval(i), clearInterval(j)}
}

function random() {
    var x=0, y=0, r=255, g=0, b=0
    matrix.fill(0,0,0)
    var i = setInterval(() => {
	matrix.setPixel(randX(),randY(),randR(),randG(),randB())	
    }, 5)
    return () => clearInterval(i)
}

function zigzag() {
    var x=0, y=0, r=255, g=0, b=0
    var xDir=1, yDir=1
    var i = setInterval(() => {
	matrix.setPixel(x,y,r,g,b)
	x+=xDir	
	if (x >= hiX() || x < loX()) {
	    xDir = -xDir
	    x += xDir
	    y+=yDir

	    if (y >= hiY()-1 || y <= loY()) {
		yDir=-yDir
		r = randR()
		g = randG()
		b = randB()
	    }
	}
    }, 1)
    return () => clearInterval(i)
}

function thematrix() {
    var runners = []
    const LEN=15
    
    var i = setInterval(() => {
	runners = runners.filter(r => r.y > -LEN)	
	runners.forEach(runner => {
	    for (var i=LEN; i >= 0; i--) {
		var y = (runner.y - i)|0
		if (y >= hiY() || y < 0)
		    continue
		var r = i==LEN?(hiR()*0.5):0
		var g = (hiG()*(i/LEN))|0
		var b = i==LEN?(hiB()*0.5):0
		matrix.setPixel(runner.x, y, r, g, b)
	    }
	    runner.y -= runner.speed
	})
    }, 33)

    var j = setInterval(() => {
	runners.push({ x: randX(), y: hiY()+LEN, speed: Math.random()+0.1 })
    }, 33)
    
    return () => { clearInterval(i); clearInterval(j); }
}
