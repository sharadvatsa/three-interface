# ThreeJS Interface

A [ThreeJS][three] extension that lets you place interactive HTML and CSS into your scene. This is most useful for WebVR 
as it works with stereoscopic rendering.

## Examples

[Basic Example](http://envokevr.github.io/three-interface/)

[Textbox and Virtual Keyboard](http://envokevr.github.io/three-interface/textbox.html)

## Usage

```javascript
    var html = '<div method="click">Click Me</div>';
    var methods = {
        click: function (elem) {
            console.log('element clicked!', elem);
        }
    };
    var options = {
        observe: true,         // watches the element for changes and re-renders (default true)
        alwaysOnTop: false,    // ensures the UI is always on top of everything in the scene (default false) 
        debug: false,          // places a small sphere at the click point (default false)
        clearTexture: true     // useful if you change the root element size to prevent intermittent stretching (default true)
    };
    var ui = new THREE.Interface(html, methods, options);
    scene.add(ui);
```

### Arguments

| Param | Type | Details |
| ----- | ---- | ------- |
| html  | `HTMLElement`, `String` or `Array` | The html to be placed into your scene
| methods | `Object` | a dictionary of interaction methods
| options | `Object` | a dictionary of options

[three]: http://threejs.org/
[css3d]: http://threejs.org/