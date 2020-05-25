function Collapse(id) {

	var content = document.getElementById(id);
	if (content.style.display == null || content.style.display == 'none') {
		content.style.display = 'block';
	} else {
		content.style.maxHeight = null;
		content.style.display = 'none';
	}
}

function AnimatedCollapse(id) {

	var content = document.getElementById(id);
	if (content.style.display == null || content.style.display == 'none') {
		content.style.maxHeight = content.scrollHeight + "px";
		content.style.display = 'table';
	} else {
		content.style.maxHeight = null;
		content.style.display = 'none';
	}
}

function getStyle(el, styleProp) {
	var value, defaultView = (el.ownerDocument || document).defaultView;
	// W3C standard way:
	if (defaultView && defaultView.getComputedStyle) {
		// sanitize property name to css notation
		// (hypen separated words eg. font-Size)
		styleProp = styleProp.replace(/([A-Z])/g, "-$1").toLowerCase();
		return defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
	} else if (el.currentStyle) { // IE
		// sanitize property name to camelCase
		styleProp = styleProp.replace(/\-(\w)/g, function (str, letter) {
			return letter.toUpperCase();
		});
		value = el.currentStyle[styleProp];
		// convert other units to pixels on IE
		if (/^\d+(em|pt|%|ex)?$/i.test(value)) {
			return (function (value) {
				var oldLeft = el.style.left, oldRsLeft = el.runtimeStyle.left;
				el.runtimeStyle.left = el.currentStyle.left;
				el.style.left = value || 0;
				value = el.style.pixelLeft + "px";
				el.style.left = oldLeft;
				el.runtimeStyle.left = oldRsLeft;
				return value;
			})(value);
		}
		return value;
	}
}

function getRandomColor() {
	var letters = '0123456789ABCDEF'.split('');
	var color = '#';
	for (var i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}

function Hide(element) {
	element.style.display = "none";
}

function Show(element) {
	element.style.display = "block";
}

function HideId(elementId) {
	Hide(document.getElementById(elementId));
}

function ShowId(elementId) {
	Show(document.getElementById(elementId));
}

function ToggleId(elementId) {

	var element = document.getElementById(elementId);
	if (!element.style.display || element.style.display == "none")
		Show(element);
	else
		Hide(element);
}

function GetCurrentDateTime() {

	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth() + 1; //January is 0!

	var yyyy = today.getFullYear();
	if (dd < 10) {
		dd = '0' + dd;
	}
	if (mm < 10) {
		mm = '0' + mm;
	}

	var MM = today.getMinutes();
	if (MM < 10) {
		MM = '0' + MM;
	}

	var hh = today.getHours();
	if (hh < 10) {
		hh = '0' + hh;
	}

	var ss = today.getSeconds();
	if (ss < 10) {
		ss = '0' + ss;
	}

	var ms = today.getMilliseconds();

	return yyyy + '-' + mm + '-' + dd + 'T' + hh + ':' + MM + ':' + ss + '.' + ms;
}

function Download(filename, text) {
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}


function ReplaceAll(source, oldValue, newValue) {

	var searchMask = oldValue;
	var regEx = new RegExp(searchMask, "ig");
	var replaceMask = newValue;

	return source.replace(regEx, replaceMask);
}