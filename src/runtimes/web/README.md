# Skypager Web Runtime 

This provides a version of the Skypager Runtime specially tailored to run in the browser.

## Installation and Usage

You can use this with any module bundler

```javascript
import runtime from '@skypager/web'
```

Or load it via script tag

```html
<script type="text/javascript" src="https://unpkg.com/@skypager/web"></script>
<script type="text/javascript">
const skypager = window.skypager

skypager.start().then(() => {
  console.log('Skypager Runtime Started')
})
</script>
```