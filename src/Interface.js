/**
 * @author ashconnell / http://ashconnell.com/
 */

var html2canvas = require('html2canvas');

THREE.Interface = function (html, methods, options) {

    THREE.Object3D.call( this );

    this.type = 'Interface';
    this.methods = methods || {};
    this.options = options || {};
    this.scaler = 0.0025;

    // bind method contexts to this instance

    for (var prop in this.methods) {
        if (typeof this.methods[prop] === 'function') {
            this.methods[prop] = this.methods[prop].bind(this);
        }
    }

    // initialise our texture and canvas image loading logic

    this.texture = new THREE.Texture();
    this.image = new Image();

    this.image.onload = function () {

        this.texture.image = this.image;
        this.texture.needsUpdate = true;

    }.bind(this);

    // render the html onto the plane

    this.render(html);
}

THREE.Interface.prototype = Object.create( THREE.Object3D.prototype );
THREE.Interface.prototype.constructor = THREE.Interface;

THREE.Interface.prototype.build = function (html) {

    // decipher and turn html in a node

    this.element = this.makeElement(html);

    // remove existing observer (if any)

    if (this.observer) {
        this.observer.disconnect();
    }

    // set up observer if option is set

    if (this.options.observe === true) {

        var config = { attributes: true, childList: true, characterData: true, subtree: true };
        this.observer = new MutationObserver(this.onChange.bind(this));
        this.observer.observe(this.element, config);

    }

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

    return elem;
}

THREE.Interface.prototype.onChange = function () {

    // fired when observe notices change - render again

    this.render();

}

THREE.Interface.prototype.updatePlane = function (clone) {

    // transpose element to plane size using scaler

    var width = this.scaler * clone.clientWidth;
    var height = this.scaler * clone.clientHeight;

    // remove any existing plane

    if (this.plane) this.remove(this.plane);

    // create plane

    var geometry = new THREE.PlaneGeometry(width, height);
    var material = new THREE.MeshLambertMaterial({

        // texture will be updated with canvas render

        map: this.texture,

        // enable css opacity, rgba etc

        transparent: true,

        // makes the interface always on top

        depthTest: !this.options.alwaysOnTop

    });

    this.plane = new THREE.Mesh(geometry, material);
    this.add(this.plane);
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
        x: (point.x + this.data.plane.halfWidth) / this.scaler,
        y: -(point.y - this.data.plane.halfHeight) / this.scaler
    };

    // fire any hits (if any)

    for (var i=0; i < this.data.buttons.length; i++) {
        var btn = this.data.buttons[i];

        if (click.y >= btn.top && click.y <= btn.bottom &&
            click.x >= btn.left && click.x <= btn.right) {

            var method = this.methods[btn.method];
            if (method) this.methods[btn.method](click);
        }
    }

}

THREE.Interface.prototype.render = function (html) {

    // build the passed in html and set up observers

    if (html) this.build(html);

    // clone the elment and add to dom

    var clone = this.element.cloneNode(true);
    document.body.appendChild(clone);

    this.image.src = '';
    if (this.options.clearTexture !== false) {
        this.texture.image = null;
        this.texture.needsUpdate = true;
    }

    // wait for images to load

    this.loadImages(clone, function () {

        // build or rebuild the plane with the correct size

        this.updatePlane(clone);

        // calculate button positions

        this.getBounds(clone);

        // render it

        html2canvas(clone).then(function (canvas) {

            // set the image src which will update the texture when it loads

            this.image.src = canvas.toDataURL();

            // remove from dom (performance?)

            document.body.removeChild(clone);

        }.bind(this));

    }.bind(this));

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

THREE.Interface.prototype.getBounds = function (clone) {
    this.data = {};

    // calculate plane bounds etc

    this.data.plane = {
        halfWidth: this.plane.geometry.parameters.width / 2,
        halfHeight: this.plane.geometry.parameters.height / 2
    };

    // get button bounds

    var elems = clone.querySelectorAll('[method]');

    this.data.buttons = [];

    for (var i=0; i < elems.length; i++) {
        var btn = elems[i];
        var b = btn.getBoundingClientRect();

        this.data.buttons.push({
            top: b.top,
            left: b.left,
            right: b.right,
            bottom: b.bottom,
            width: b.width,
            height: b.height,
            method: btn.getAttribute('method')
        });
    }
}
