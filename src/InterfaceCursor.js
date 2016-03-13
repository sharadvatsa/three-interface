/**
 * @author ashconnell / http://ashconnell.com/
 */

THREE.InterfaceCursor = function (scene, camera) {

    this.scene = scene;
    this.camera = camera;
    this.ray = new THREE.Raycaster();

    // add a reticle to the center of the camera

    var loader = new THREE.TextureLoader();
    var map = loader.load('img/reticle.png');
    var material = new THREE.SpriteMaterial({ map: map, color: 0xffffff, fog: true });

    material.depthTest = false; // always on top

    var reticle = new THREE.Sprite(material);
    reticle.position.set(0, 0, -0.5);
    reticle.scale.set(0.02, 0.02, 0.02);
    camera.add(reticle);

    // listen for mouse events

    window.addEventListener('mousedown', this.onMouseDown.bind(this), true);
    window.addEventListener('mousemove', this.onMouseMove.bind(this), true);
    window.addEventListener('mouseup', this.onMouseUp.bind(this), true);
}

THREE.InterfaceCursor.prototype.onMouseDown = function (e) {

    // prevents drag firing a click

    this.isMoving = false;

}

THREE.InterfaceCursor.prototype.onMouseMove = function (e) {

    // prevents drag firing a click

    this.isMoving = true;

}

THREE.InterfaceCursor.prototype.onMouseUp = function (e) {

    // fire a click

    if (!this.isMoving) this.performClick();

}

THREE.InterfaceCursor.prototype.performClick = function () {

    // raycast from camera, in camera direction

    this.ray.set(this.camera.getWorldPosition(), this.camera.getWorldDirection());
    var intersects = this.ray.intersectObjects(this.scene.children, true);
    if (intersects.length <= 1) return; // no hits, reticle doesn't count

    // check if we hit a THREE.Interface, ignore recticle as first hit

    var intersect = intersects[1];
    var parent = intersect.object.parent;

    if (parent instanceof THREE.Interface) {

        // tell the interface to perform a click at the intersect point

        parent.performClick(intersect.point);

    }
}
