/**
 * @author ashconnell / http://ashconnell.com/
 */

var html2canvas = require('html2canvas');
var throttle = require('lodash.throttle');

THREE.Interface = function (html, methods, options) {

    THREE.Object3D.call( this );

    this.type = 'Interface';
    this.methods = methods || {};
    this.options = options || {};
    this.scaler = 0.0025;
    this.queue = [];

    // set throttling

    if (this.options.throttle !== false) {
        this.options.throttle = this.options.throttle || 250;
        this.render = throttle(this.render, this.options.throttle);
    }

    // bind method contexts to this instance

    for (var prop in this.methods) {
        if (typeof this.methods[prop] === 'function') {
            this.methods[prop] = this.methods[prop].bind(this);
        }
    }

    // create singleton image we will update with canvas renders

    this.image = new Image();
    this.image.onload = this.onImageReady.bind(this);

    // render the interface plane

    this.render(html);
}

THREE.Interface.prototype = Object.create( THREE.Object3D.prototype );
THREE.Interface.prototype.constructor = THREE.Interface;

THREE.Interface.prototype.render = function (html) {

    // convert html to element

    if (html) {
        this.element = this.makeElement(html);
    }

    // clone the elment and add to dom

    var clone = this.element.cloneNode(true);

    this.queue.push(clone);

    if (!this.isRendering) {
        this.renderNext();
    }

}

THREE.Interface.prototype.renderImmediate = function (html) {

}

THREE.Interface.prototype.renderNext = function () {

    this.isRendering = true;

    var clone = this.queue.shift();

    document.body.appendChild(clone);

    // load any <img> tags in the dom element

    this.loadImages(clone, function () {

        // check size changes

        this.sizeChanged = (this.lastHeight !== clone.clientHeight || this.lastWidth !== clone.clientWidth);
        this.lastHeight = clone.clientHeight;
        this.lastWidth = clone.clientWidth;

        // render!

        html2canvas(clone).then(function (canvas) {

            // update image src, will fire loaded event when ready

            this.image.src = canvas.toDataURL();

            // calculate button positions

            this.getBounds(clone);

            // dispose of cloned element

            document.body.removeChild(clone);
            clone = null;

        }.bind(this));

    }.bind(this));

}

THREE.Interface.prototype.onImageReady = function () {

    // create or recreate plane if size changed

    if (this.sizeChanged) {
        this.makePlane();
    }

    // dispose of any previous texture

    if (this.plane.material.map) {
        this.plane.material.map.dispose();
    }

    // update plane texture

    this.plane.material.map = new THREE.Texture(this.image);
    this.plane.material.map.needsUpdate = true;

    if (this.queue.length) {
        this.renderNext();
    } else {
        this.isRendering = false;
    }

}

THREE.Interface.prototype.makePlane = function () {

    // remove and dispose of current plane (if any)

    if (this.plane) {

        this.remove(this.plane);
        this.plane.geometry.dispose();
        this.plane.material.dispose();

    }

    // transpose element to plane size using scaler

    var width = this.scaler * this.lastWidth;
    var height = this.scaler * this.lastHeight;

    // create plane

    // var texture = new THREE.Texture(this.image);
    var geometry = new THREE.PlaneGeometry(width, height);
    var material = new THREE.MeshLambertMaterial({

        // texture will be updated with canvas render

        // map: texture,

        // enable css opacity, rgba etc

        transparent: true,

        // makes the interface always on top

        depthTest: !this.options.alwaysOnTop

    });

    this.plane = new THREE.Mesh(geometry, material);
    this.add(this.plane);
}

THREE.Interface.prototype.makeElement = function (html) {

    // create a wrapper element (so we don't muck with user defined styles)

    var elem = document.createElement('div');
    elem.style.position = 'absolute';
    elem.style.top = 0;
    elem.style.left = 0;
    elem.style.zIndex = -1;
    elem.style.display = 'inline-block';
    elem.style.boxSizing = 'border-box';

    // handlers

    if (typeof html == 'string') {

        // strings get added as innerHTML

        elem.innerHTML = html;

    } else if (html instanceof Array) {

        // arrays get concatenated and added as innerHTML

        elem.innerHTML = html.join('');


    } else if (html.nodeType && html.nodeType === 1) {

        // actual nodes just get added as child

        elem.appendChild(html);

    } else {

        console.error('html must be String, Array or HTMLElement');
    }

    // remove existing observer (if any)

    if (this.observer) {
        this.observer.disconnect();
    }

    // set up observer if option is set

    if (this.options.observe === true) {

        var config = { attributes: true, childList: true, characterData: true, subtree: true };
        this.observer = new MutationObserver(this.onElementChange.bind(this));
        this.observer.observe(elem, config);

    }

    return elem;

}

THREE.Interface.prototype.onElementChange = function () {

    this.render();

}

THREE.Interface.prototype.loadImages = function (clone, done) {

    // find all <img> elements

    var images = Array.prototype.slice.call(clone.querySelectorAll('img'));
    if (!images.length) return done();

    // wait until they all load

    var total = images.length;
    var complete = 0;

    for (var i=0; i < images.length; i++) {
        var img = images[i];

        img.addEventListener('load', function () {
            complete++;
            if (complete === total) done(); // done!
        });
    }

}

THREE.Interface.prototype.performClick = function (point) {

    // convert ray point from world to local

    this.plane.worldToLocal(point);

    // debug shows click point

    if (this.options.debug) {
        var geometry = new THREE.SphereGeometry(0.05);
        var material = new THREE.MeshLambertMaterial({ color: 'green' });
        var box = new THREE.Mesh(geometry, material);
        box.position.copy(point);
        this.plane.add(box);
    }

    // convert point into pixel coords

    var click = {
        x: (point.x + (this.plane.geometry.parameters.width / 2)) / this.scaler,
        y: -(point.y - (this.plane.geometry.parameters.height / 2)) / this.scaler
    };

    // fire any hits (if any)

    for (var i=0; i < this.bounds.length; i++) {
        var btn = this.bounds[i];

        if (click.y >= btn.top && click.y <= btn.bottom &&
            click.x >= btn.left && click.x <= btn.right) {

            var method = this.methods[btn.method];
            if (method) this.methods[btn.method](btn.elem);
        }
    }

}

THREE.Interface.prototype.getBounds = function (clone) {

    // get button bounds

    this.bounds = [];

    var elems = clone.querySelectorAll('[method]');

    for (var i=0; i < elems.length; i++) {
        var btn = elems[i];
        var b = btn.getBoundingClientRect();

        this.bounds.push({
            top: b.top,
            left: b.left,
            right: b.right,
            bottom: b.bottom,
            width: b.width,
            height: b.height,
            method: btn.getAttribute('method'),
            elem: btn
        });
    }
}
