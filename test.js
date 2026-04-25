const { JSDOM } = require("jsdom");
const { window } = new JSDOM(`
  <html><body>
    <div class="header-menu-link has-dropdown">Link</div>
    <div class="header-menu-dropdown-desktop">Dropdown</div>
  </body></html>
`);
const $ = require("jquery")(window);
let $dropdowns = $('.header-menu-dropdown-desktop');
let $dropdown = $('.header-menu-dropdown-desktop');

$dropdowns.stop(true, true).slideUp(300);
$dropdown.stop(true, true).slideDown(300);
console.log($dropdown[0].style.display);
